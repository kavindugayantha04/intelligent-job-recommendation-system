import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createConversation,
  deleteChatMessage,
  deleteConversation,
  editChatMessage,
  getChatHistory,
  getCvs,
  selectCv,
  sendMessage,
} from "../api/chatApi";

const QUICK_PROMPTS = [
  "Upload CV help",
  "Job matching",
  "Skill gap",
  "Reset password",
  "File formats",
  "Low match score",
];

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState({ id: null, content: "" });
  const [cvs, setCvs] = useState([]);
  const [selectedCv, setSelectedCv] = useState("");
  const bottomRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === conversationId) || null,
    [conversations, conversationId]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadConversations = async () => {
    const res = await getChatHistory();
    const items = res.data?.conversations || [];
    setConversations(items);
    if (!conversationId && items.length > 0) {
      setConversationId(items[0].id);
    }
  };

  const loadCurrentConversation = async (id) => {
    if (!id) {
      setMessages([]);
      return;
    }
    const res = await getChatHistory(id);
    const convo = res.data?.conversation;
    setMessages(convo?.messages || []);
    if (convo?.cvId) setSelectedCv(String(convo.cvId));
  };

  const loadCvs = async () => {
    const res = await getCvs();
    const list = res.data?.data || [];
    setCvs(list);
    const primary = list.find((cv) => cv.isPrimary);
    if (primary) setSelectedCv(String(primary.id));
  };

  useEffect(() => {
    (async () => {
      try {
        setInitialLoading(true);
        await Promise.all([loadConversations(), loadCvs()]);
      } catch (e) {
        setError(e.response?.data?.message || e.message || "Failed to load chat data.");
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    loadCurrentConversation(conversationId).catch((e) =>
      setError(e.response?.data?.message || e.message || "Failed to load messages.")
    );
  }, [conversationId]);

  const handleNewChat = async () => {
    try {
      const res = await createConversation(selectedCv ? { cvId: selectedCv } : {});
      const convo = res.data?.conversation;
      if (convo?.id) {
        setConversations((prev) => [{ ...convo, preview: "" }, ...prev]);
        setConversationId(convo.id);
        setMessages([]);
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to create chat.");
    }
  };

  const handleSend = async () => {
    const message = draft.trim();
    if (!message || loading) return;
    setLoading(true);
    setError("");
    setDraft("");
    try {
      const res = await sendMessage({ conversationId, message, cvId: selectedCv || undefined });
      const convoId = res.data?.conversationId;
      if (convoId) {
        setConversationId(String(convoId));
        setMessages(res.data?.messages || []);
      }
      await loadConversations();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editing.id || !editing.content.trim()) return;
    try {
      const res = await editChatMessage(editing.id, editing.content.trim());
      setMessages(res.data?.messages || []);
      setEditing({ id: null, content: "" });
      await loadConversations();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to edit message.");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const res = await deleteChatMessage(messageId);
      setMessages(res.data?.messages || []);
      await loadConversations();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to delete message.");
    }
  };

  const handleDeleteConversation = async (id) => {
    try {
      await deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      setConversationId(remaining[0]?.id || null);
      if (!remaining.length) setMessages([]);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to delete conversation.");
    }
  };

  const handleCvChange = async (cvId) => {
    setSelectedCv(cvId);
    try {
      if (cvId) await selectCv(cvId);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to switch CV.");
    }
  };

  if (initialLoading) {
    return <div style={{ padding: 24 }}>Loading chat...</div>;
  }

  return (
    <div style={{ height: "100vh", display: "flex", background: "#f5f7fb" }}>
      <aside style={{ width: 290, borderRight: "1px solid #e5e7eb", background: "#ffffff" }}>
        <div style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
          <button
            className="btn btn-primary btn-sm"
            style={{ width: "100%" }}
            onClick={handleNewChat}
          >
            + New Chat
          </button>
          <select
            value={selectedCv}
            onChange={(e) => handleCvChange(e.target.value)}
            style={{ width: "100%", marginTop: 10, padding: 8 }}
          >
            <option value="">Use latest CV</option>
            {cvs.map((cv) => (
              <option key={cv.id} value={cv.id}>
                {cv.originalName} {cv.isPrimary ? "(Primary)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div style={{ overflowY: "auto", height: "calc(100vh - 120px)" }}>
          {conversations.map((c) => (
            <div
              key={c.id}
              style={{
                padding: 12,
                borderBottom: "1px solid #f3f4f6",
                background: c.id === conversationId ? "#ecfdf5" : "white",
                cursor: "pointer",
              }}
              onClick={() => setConversationId(c.id)}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>{c.title || "New Chat"}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
                {c.preview || "No messages yet"}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConversation(c.id);
                }}
                style={{
                  marginTop: 6,
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  background: "#fff",
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: "pointer"
                }}
              >
                Delete Chat
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
          <strong>{activeConversation?.title || "Chat Assistant"}</strong>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            AI responses are CV-aware and conversation-aware.
          </div>
        </div>
        <div
          style={{
            padding: "10px 14px",
            display: "flex",
            gap: 8,
            overflowX: "auto",
            background: "#fff",
            borderBottom: "1px solid #eef2f7",
          }}
        >
          {QUICK_PROMPTS.map((text) => (
            <button
              key={text}
              className="btn btn-outline btn-sm"
              onClick={() => setDraft(text)}
              style={{ whiteSpace: "nowrap" }}
            >
              {text}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    background: isUser ? "#2563eb" : "#ffffff",
                    color: isUser ? "#fff" : "#111827",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 12,
                    maxWidth: "75%",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <div>{m.content}</div>
                  <div style={{ marginTop: 8, fontSize: 11, opacity: 0.8 }}>
                    {new Date(m.timestamp).toLocaleString()}
                    {m.edited ? " • edited" : ""}
                  </div>
                  
                  {/* --- UPDATED BUTTONS START --- */}
                  {isUser && (
                    <div style={{ 
                      marginTop: 12, 
                      display: "flex", 
                      gap: 8, 
                      borderTop: "1px solid rgba(255,255,255,0.2)", 
                      paddingTop: 8 
                    }}>
                      <button
                        style={{
                          fontSize: 11,
                          padding: "4px 10px",
                          borderRadius: "4px",
                          border: "1px solid rgba(255, 255, 255, 0.5)",
                          background: "rgba(255, 255, 255, 0.15)",
                          color: "white",
                          cursor: "pointer",
                          fontWeight: "500"
                        }}
                        onClick={() => setEditing({ id: m.id, content: m.content })}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          fontSize: 11,
                          padding: "4px 10px",
                          borderRadius: "4px",
                          border: "none",
                          background: "#ef4444",
                          color: "white",
                          cursor: "pointer",
                          fontWeight: "600"
                        }}
                        onClick={() => handleDeleteMessage(m.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  {/* --- UPDATED BUTTONS END --- */}
                </div>
              </div>
            );
          })}

          {loading && <div style={{ fontSize: 13, color: "#6b7280" }}>AI is typing...</div>}
          {error && <div style={{ marginTop: 8, color: "#b91c1c" }}>{error}</div>}
          <div ref={bottomRef} />
        </div>

        {editing.id && (
          <div style={{ padding: 12, borderTop: "1px solid #e5e7eb", background: "#fff7ed" }}>
            <div style={{ fontSize: 12, marginBottom: 6 }}>Editing message</div>
            <textarea
              rows={3}
              value={editing.content}
              onChange={(e) => setEditing((prev) => ({ ...prev, content: e.target.value }))}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #e5e7eb" }}
            />
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={handleEdit}>
                Save Edit
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setEditing({ id: null, content: "" })}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ padding: 14, borderTop: "1px solid #e5e7eb", background: "#fff" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <textarea
              rows={2}
              value={draft}
              placeholder="Type your message..."
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{ flex: 1, resize: "none", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleSend} 
              disabled={loading || !draft.trim()}
              style={{ padding: "0 20px" }}
            >
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;