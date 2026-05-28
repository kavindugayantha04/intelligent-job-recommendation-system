const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
  },
  { _id: true }
);

const chatConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "New Chat" },
    cvId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CandidateCV",
      default: null,
    },
    messages: { type: [chatMessageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatConversationSchema.index({ userId: 1, lastMessageAt: -1 });

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
