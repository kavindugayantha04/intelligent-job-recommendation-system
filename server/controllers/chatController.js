const OpenAI = require("openai");
const ChatConversation = require("../models/ChatConversation");
const CandidateCV = require("../models/CandidateCV");
const Job = require("../models/Job");

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function toTitle(input) {
  const text = String(input || "").trim().replace(/\s+/g, " ");
  if (!text) return "New Chat";
  return text.length > 50 ? `${text.slice(0, 50)}...` : text;
}

function compactMessages(messages) {
  return (messages || [])
    .filter((m) => !m.deleted && m.content)
    .map((m) => ({
      id: m._id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      edited: m.edited,
      deleted: m.deleted,
    }));
}

async function resolveSelectedCv(userId, cvId) {
  if (cvId) {
    const selected = await CandidateCV.findOne({ _id: cvId, userId }).lean();
    if (selected) return selected;
  }

  return CandidateCV.findOne({ userId })
    .sort({ isPrimary: -1, createdAt: -1 })
    .lean();
}

function buildSystemPrompt(cvRecord) {
  const cvText = String(cvRecord?.extractedText || "").slice(0, 12000);
  return [
    "You are a career assistant for an Intelligent Job Recommendation System.",
    "Give practical, concise and actionable answers.",
    "When user asks for jobs, provide role suggestions aligned with CV.",
    "Do not reuse generic identical output for different CVs.",
    "Base recommendations on the provided CV context.",
    "",
    `Selected CV: ${cvRecord?.originalName || "No CV selected"}`,
    "CV context:",
    cvText || "No CV text available.",
  ].join("\n");
}

function extractCvKeywords(cvRecord, max = 12) {
  const text = String(cvRecord?.extractedText || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");
  if (!text) return [];

  const stop = new Set([
    "the", "and", "for", "with", "this", "that", "from", "have", "your",
    "you", "are", "was", "were", "not", "job", "jobs", "work", "experience",
  ]);
  const freq = new Map();
  for (const token of text.split(/\s+/)) {
    if (!token || token.length < 3 || stop.has(token)) continue;
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}

async function generateFallbackResponse({ message, cvRecord }) {
  const q = String(message || "").toLowerCase();
  const cvName = cvRecord?.originalName || "No CV selected";
  const cvKeywords = extractCvKeywords(cvRecord, 10);

  if (!cvRecord?.extractedText) {
    return "No CV selected. Please upload/select a CV and ask again (e.g., 'suggest jobs for my CV').";
  }

  if (/hi|hello|hey/.test(q)) {
    return `Hello! I am using CV: ${cvName}. Ask me for job recommendations, skill gaps, or interview prep.`;
  }

  if (/skill|gap|missing|improve|learn|course/.test(q)) {
    const top = cvKeywords.slice(0, 5).join(", ");
    return `Based on ${cvName}, your detectable focus areas include: ${top || "general technical profile"}. I recommend improving domain depth with 2-3 portfolio projects and one certification in your target role.`;
  }

  if (/job|recommend|role|position|apply/.test(q)) {
    const jobs = await Job.find({})
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    const scored = jobs
      .map((job) => {
        const hay = [
          job.title,
          job.category,
          ...(job.mandatorySkills || []),
          ...(job.preferredSkills || []),
          job.description,
        ]
          .join(" ")
          .toLowerCase();
        let overlap = 0;
        for (const kw of cvKeywords) {
          if (hay.includes(kw)) overlap += 1;
        }
        return { job, overlap };
      })
      .filter((x) => x.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 5);

    if (!scored.length) {
      return `I analyzed ${cvName}, but I could not find strong keyword matches in current jobs. Try asking for specific roles (e.g., "Data Analyst jobs") or upload another CV version.`;
    }

    const lines = scored.map(
      (x, i) =>
        `${i + 1}. ${x.job.title || "Untitled Role"} (${x.job.category || "General"})`
    );
    return `Top CV-related jobs from current dataset for ${cvName}:\n${lines.join(
      "\n"
    )}\n\nAsk "why these jobs?" and I will explain the match.`;
  }

  return `Using CV: ${cvName}. I understood: "${message}". Ask for job recommendations, skill gap analysis, or interview tips to get tailored output.`;
}

async function generateAiResponse({ message, history, cvRecord }) {
  if (!openai) {
    return generateFallbackResponse({ message, cvRecord });
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const messages = [
    { role: "system", content: buildSystemPrompt(cvRecord) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.4,
    messages,
  });

  return (
    completion.choices?.[0]?.message?.content?.trim() ||
    "I could not generate a response right now."
  );
}

exports.sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId, message, cvId } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    let conversation = null;
    if (conversationId) {
      conversation = await ChatConversation.findOne({ _id: conversationId, userId });
    }

    if (!conversation) {
      conversation = await ChatConversation.create({
        userId,
        title: toTitle(message),
        cvId: cvId || null,
        messages: [],
      });
    } else if (cvId) {
      conversation.cvId = cvId;
    }

    const selectedCv = await resolveSelectedCv(userId, conversation.cvId || cvId);
    if (selectedCv && (!conversation.cvId || String(conversation.cvId) !== String(selectedCv._id))) {
      conversation.cvId = selectedCv._id;
    }

    const recentHistory = compactMessages(conversation.messages).slice(-8);
    const userMessage = {
      role: "user",
      content: String(message).trim(),
      timestamp: new Date(),
    };
    conversation.messages.push(userMessage);

    const aiReply = await generateAiResponse({
      message: userMessage.content,
      history: recentHistory,
      cvRecord: selectedCv,
    });

    conversation.messages.push({
      role: "assistant",
      content: aiReply,
      timestamp: new Date(),
    });
    conversation.lastMessageAt = new Date();
    await conversation.save();

    return res.json({
      success: true,
      conversationId: conversation._id,
      title: conversation.title,
      cv: selectedCv
        ? { id: selectedCv._id, originalName: selectedCv.originalName }
        : null,
      messages: compactMessages(conversation.messages),
      response: aiReply,
    });
  } catch (error) {
    console.error("[chat/send] error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send message.",
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.query;

    if (conversationId) {
      const conversation = await ChatConversation.findOne({
        _id: conversationId,
        userId,
      }).lean();

      if (!conversation) {
        return res.status(404).json({ success: false, message: "Conversation not found." });
      }

      return res.json({
        success: true,
        conversation: {
          id: conversation._id,
          title: conversation.title,
          cvId: conversation.cvId || null,
          lastMessageAt: conversation.lastMessageAt,
          messages: compactMessages(conversation.messages),
        },
      });
    }

    const conversations = await ChatConversation.find({ userId })
      .sort({ lastMessageAt: -1 })
      .lean();

    return res.json({
      success: true,
      conversations: conversations.map((c) => ({
        id: c._id,
        title: c.title || "New Chat",
        cvId: c.cvId || null,
        lastMessageAt: c.lastMessageAt,
        preview:
          compactMessages(c.messages).slice(-1)[0]?.content?.slice(0, 90) || "",
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const messageId = req.params.id;
    const { content } = req.body;

    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, message: "Edited content is required." });
    }

    const conversation = await ChatConversation.findOne({
      userId,
      "messages._id": messageId,
    });
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    const msg = conversation.messages.id(messageId);
    if (!msg || msg.role !== "user") {
      return res.status(400).json({
        success: false,
        message: "Only user messages can be edited.",
      });
    }

    msg.content = String(content).trim();
    msg.edited = true;
    msg.timestamp = new Date();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    return res.json({
      success: true,
      conversationId: conversation._id,
      messages: compactMessages(conversation.messages),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const messageId = req.params.id;

    const conversation = await ChatConversation.findOne({
      userId,
      "messages._id": messageId,
    });
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    const msg = conversation.messages.id(messageId);
    if (!msg) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    msg.deleted = true;
    msg.content = "[deleted]";
    conversation.lastMessageAt = new Date();
    await conversation.save();

    return res.json({
      success: true,
      conversationId: conversation._id,
      messages: compactMessages(conversation.messages),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    const deleted = await ChatConversation.findOneAndDelete({
      _id: conversationId,
      userId,
    });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    return res.json({ success: true, message: "Conversation deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const conversation = await ChatConversation.create({
      userId: req.userId,
      title: "New Chat",
      cvId: req.body?.cvId || null,
      messages: [],
    });
    return res.status(201).json({
      success: true,
      conversation: {
        id: conversation._id,
        title: conversation.title,
        cvId: conversation.cvId || null,
        lastMessageAt: conversation.lastMessageAt,
        messages: [],
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
