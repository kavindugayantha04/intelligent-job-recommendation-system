import { useEffect, useState } from "react";
import api from "../api/api.js";
import { applyToJob } from "../api/applicationApi";

function formatDate(dateStr) {
  if (!dateStr) return "Not specified";
  return new Date(dateStr).toLocaleDateString();
}

function validateCvFile(file) {
  if (!file) return false;

  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowed.includes(file.type) && !/\.(pdf|doc|docx)$/i.test(file.name)) {
    return false;
  }

  if (file.size > 5 * 1024 * 1024) {
    return false;
  }

  return true;
}

function showToast(msg) {
  alert(msg);
}

/**
 * Shared apply flow for Browse Jobs, Recommended Jobs, etc.
 */
export default function JobApplyModal({ job, onClose, onAppliedSuccess }) {
  const [savedCv, setSavedCv] = useState("");
  const [hasSavedCv, setHasSavedCv] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [cvError, setCvError] = useState("");
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);

  async function loadSavedCv() {
    try {
      const res = await api.getPrefs();
      const data = res?.data || {};

      if (data.resume) {
        setSavedCv(data.resume);
        setHasSavedCv(true);
      } else {
        setSavedCv("");
        setHasSavedCv(false);
      }
    } catch {
      setSavedCv("");
      setHasSavedCv(false);
    }
  }

  useEffect(() => {
    if (!job) return;
    setCoverLetter("");
    setCvFile(null);
    setCvError("");
    setApplyError("");
    setApplySuccess("");
    setApplyLoading(false);
    loadSavedCv();
  }, [job?._id]);

  if (!job) return null;

  async function handleApply() {
    setCvError("");
    setApplyError("");
    setApplySuccess("");
    setApplyLoading(true);

    try {
      if (!hasSavedCv) {
        if (!cvFile) {
          throw new Error("Please upload your CV before applying.");
        }

        if (!validateCvFile(cvFile)) {
          throw new Error("Please upload a valid PDF or Word file under 5MB.");
        }

        const formData = new FormData();
        formData.append("cv", cvFile);

        await api.uploadCV(formData);

        setSavedCv(cvFile.name);
        setHasSavedCv(true);
      }

      await applyToJob({
        jobId: job._id,
        coverLetter,
      });

      setApplySuccess("✓ Application submitted successfully!");
      showToast("Application submitted successfully!");

      setTimeout(() => {
        onClose();
        if (typeof onAppliedSuccess === "function") {
          onAppliedSuccess();
        }
      }, 1200);
    } catch (e) {
      setApplyError(
        e.response?.data?.message || e.message || "Failed to submit application."
      );
    } finally {
      setApplyLoading(false);
    }
  }

  function handleClose() {
    if (applyLoading) return;
    onClose();
  }

  return (
    <div className="modal-overlay open">
      <div className="modal job-apply-modal">
        <div className="job-apply-modal__top">
          <div className="modal-header">
            <div className="modal-title">Apply for {job.title}</div>
            <button type="button" className="modal-close" onClick={handleClose}>
              &times;
            </button>
          </div>

          {cvError && <div className="alert alert-error show">{cvError}</div>}
          {applyError && <div className="alert alert-error show">{applyError}</div>}
          {applySuccess && <div className="alert alert-success show">{applySuccess}</div>}
        </div>

        <div className="job-apply-modal__scroll">
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "1rem", fontWeight: "800", marginBottom: "0.4rem" }}>
              {job.title}
            </div>

            <div style={{ color: "var(--primary)", fontWeight: "700", marginBottom: "0.75rem" }}>
              📂 {job.category || "General"}
            </div>

            <div className="job-meta" style={{ marginBottom: "0.75rem" }}>
              <span>🎓 {job.experienceLevel || "Not specified"}</span>
              <span>💼 {job.workType || "Not specified"}</span>
              <span>⏳ Deadline {formatDate(job.deadline)}</span>
            </div>

            <div
              style={{
                marginBottom: "0.75rem",
                color: "var(--text-muted)",
                fontWeight: "600",
              }}
            >
              💰 Salary: ${job.salaryMin || 0} - ${job.salaryMax || 0}
            </div>

            {job.mandatorySkills && job.mandatorySkills.length > 0 && (
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontWeight: "700", marginBottom: "0.4rem" }}>Mandatory Skills</div>
                <div className="job-skills">
                  {job.mandatorySkills.map((skill) => (
                    <span className="skill-tag" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.preferredSkills && job.preferredSkills.length > 0 && (
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontWeight: "700", marginBottom: "0.4rem" }}>Preferred Skills</div>
                <div className="job-skills">
                  {job.preferredSkills.map((skill) => (
                    <span
                      className="skill-tag"
                      key={skill}
                      style={{
                        background: "#eef6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: "1rem" }}>
              <div style={{ fontWeight: "700", marginBottom: "0.4rem" }}>Job Description</div>
              <div
                style={{
                  color: "var(--text-muted)",
                  lineHeight: "1.7",
                  whiteSpace: "pre-wrap",
                }}
              >
                {job.description || "No description available."}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>CV / Resume</label>

            {hasSavedCv ? (
              <div
                style={{
                  padding: "12px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  color: "#334155",
                  fontSize: "0.92rem",
                }}
              >
                <strong>Saved CV found:</strong> {savedCv}
                <div style={{ marginTop: "4px", color: "#64748b", fontSize: "0.84rem" }}>
                  This CV will be used for your application.
                </div>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setCvFile(file);

                    if (file && !validateCvFile(file)) {
                      setCvError("Please upload a valid PDF or Word file under 5MB.");
                    } else {
                      setCvError("");
                    }
                  }}
                />

                {cvFile && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Selected file: {cvFile.name}
                  </div>
                )}

                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.82rem",
                    color: "#64748b",
                  }}
                >
                  No saved CV found. Upload once and it will be reused for future applications.
                </div>
              </>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>
              Cover Letter <span style={{ color: "var(--text-dim)" }}>(optional)</span>
            </label>
            <textarea
              rows={5}
              placeholder="Write a short message about why you are suitable for this role…"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>
        </div>

        <div className="job-apply-modal__footer">
          <button type="button" className="btn btn-outline" onClick={handleClose} disabled={applyLoading}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleApply} disabled={applyLoading}>
            {applyLoading ? "Submitting…" : "Apply Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
