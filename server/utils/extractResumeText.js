/**
 * extractResumeText.js
 * ---------------------
 * Reads a file from disk and returns its plain text content together
 * with a structured diagnostic object so the caller (HTTP handler) can
 * show a specific, truthful error message instead of a generic one.
 *
 * Supported formats:
 *   .pdf  -> pdf-parse  (we require the internal entry point to avoid
 *                         pdf-parse v1.1.1's debug-code-on-require bug)
 *   .docx -> mammoth
 *   .doc  -> not supported by these parsers; caller should reject.
 */

const fs = require("fs");
const path = require("path");

/**
 * Custom error that carries a machine-readable `code` field so HTTP
 * handlers can switch on it and send precise messages / status codes.
 */
class ExtractionError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = "ExtractionError";
    this.code = code;          // "MODULE_MISSING" | "READ_FAILED" | "PARSE_FAILED" | "EMPTY_TEXT" | "UNSUPPORTED_FORMAT"
    this.extra = extra;
  }
}

/**
 * Safely `require` a module. If it is not installed, throw an
 * ExtractionError with code MODULE_MISSING so we can tell the user
 * "run npm install" instead of the misleading "could not read text".
 */
function safeRequire(modPath, friendlyName) {
  try {
    // eslint-disable-next-line global-require
    return require(modPath);
  } catch (e) {
    if (e && e.code === "MODULE_NOT_FOUND") {
      throw new ExtractionError(
        "MODULE_MISSING",
        `Server is missing the "${friendlyName}" package. Run "npm install" in the server/ folder.`,
        { modPath, originalError: e.message }
      );
    }
    throw new ExtractionError(
      "MODULE_LOAD_FAILED",
      `Failed to load the "${friendlyName}" package: ${e.message}`,
      { modPath, originalError: e.message }
    );
  }
}

async function extractFromPdf(filePath) {
  // IMPORTANT: use the internal entry point. The package's index.js
  // runs a self-test on `require` that can throw ENOENT for its
  // bundled test PDF in some environments. `/lib/pdf-parse.js`
  // exports the pure function with no debug code.
  const pdfParse = safeRequire("pdf-parse/lib/pdf-parse.js", "pdf-parse");

  let dataBuffer;
  try {
    dataBuffer = fs.readFileSync(filePath);
  } catch (e) {
    throw new ExtractionError(
      "READ_FAILED",
      `Could not read the uploaded file from disk at ${filePath}.`,
      { originalError: e.message }
    );
  }

  try {
    const result = await pdfParse(dataBuffer);
    return (result && typeof result.text === "string") ? result.text : "";
  } catch (e) {
    throw new ExtractionError(
      "PARSE_FAILED",
      `PDF parsing failed: ${e.message}`,
      { originalError: e.message }
    );
  }
}

async function extractFromDocx(filePath) {
  const mammoth = safeRequire("mammoth", "mammoth");

  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return (result && typeof result.value === "string") ? result.value : "";
  } catch (e) {
    throw new ExtractionError(
      "PARSE_FAILED",
      `DOCX parsing failed: ${e.message}`,
      { originalError: e.message }
    );
  }
}

/**
 * Normalize extracted text:
 *  - collapse whitespace and newlines
 *  - strip null bytes / control chars that can sneak in from PDFs
 */
function normalize(text) {
  if (!text) return "";
  return String(text)
    .replace(/\u0000/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Main entry. Always returns a structured result on success.
 * Throws ExtractionError for every failure mode — callers SHOULD
 * inspect `err.code` to craft a precise HTTP response.
 *
 * @param {string} filePath Absolute or relative path to the file on disk.
 * @returns {Promise<{ text: string, ext: string, supported: boolean }>}
 */
async function extractResumeText(filePath) {
  const absPath = path.resolve(filePath);
  const ext = path.extname(absPath).toLowerCase();

  if (!fs.existsSync(absPath)) {
    throw new ExtractionError(
      "READ_FAILED",
      `Uploaded file not found on disk: ${absPath}`
    );
  }

  let rawText = "";

  if (ext === ".pdf") {
    rawText = await extractFromPdf(absPath);
  } else if (ext === ".docx") {
    rawText = await extractFromDocx(absPath);
  } else if (ext === ".doc") {
    throw new ExtractionError(
      "UNSUPPORTED_FORMAT",
      "Legacy .doc files are not supported. Please upload a PDF or DOCX CV."
    );
  } else {
    throw new ExtractionError(
      "UNSUPPORTED_FORMAT",
      `Unsupported file extension "${ext}". Please upload a PDF or DOCX CV.`
    );
  }

  const text = normalize(rawText);

  if (!text) {
    throw new ExtractionError(
      "EMPTY_TEXT",
      "Text could not be extracted from this file.",
      { extractedLength: 0 }
    );
  }

  return { text, ext, supported: true };
}

module.exports = extractResumeText;
module.exports.ExtractionError = ExtractionError;
