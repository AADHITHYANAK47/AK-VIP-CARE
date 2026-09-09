import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, X, Send, Maximize2, Minimize2, Bot, User, 
  RotateCcw, Copy, Check, ShieldCheck, FileText, Mic, 
  Briefcase, Zap, Terminal, ChevronRight
} from "lucide-react";
import { api } from "../services/api";

export default function AIChatbotModal({ 
  currentUser, 
  operatingMode = "campus", 
  activeTab = "student",
  isOpen: externalIsOpen,
  onClose: externalOnClose
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  function handleClose() {
    if (externalOnClose) externalOnClose();
    setInternalIsOpen(false);
  }

  function handleOpen() {
    setInternalIsOpen(true);
  }

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Conversation state (with localStorage persistence)
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("vipcare_copilot_chat") || localStorage.getItem("careerlens_copilot_chat");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        role: "assistant",
        content: `👋 **Welcome to VIPCARE Quantum AI Copilot!**\n\nI am your intelligent placement assistant, real resume optimizer, and technical interview coach.\n\n* **Audit My Resume**: Get a comprehensive ATS keyword match score & STAR bullet rewrite against active placement drives.\n* **Placement Mock Interview**: Interactive technical & HR interview with instant grading.\n* **Campus Drive Eligibility**: Find which ₹ LPA drives you qualify for and how to boost your fit score.\n\nHow can I help accelerate your career today?`
      }
    ];
  });

  const [suggestedPrompts, setSuggestedPrompts] = useState([
    "Audit my uploaded resume for ATS",
    "Simulate Fintech Corp technical interview",
    "Which placement drives am I eligible for?",
    "How to reach 95%+ match score for Super Dream offers?"
  ]);

  // Dynamically configure role-specific prompt chips
  useEffect(() => {
    const role = (currentUser?.role || (operatingMode === "enterprise" ? "employee" : "student")).toLowerCase();
    if (role === "student") {
      setSuggestedPrompts([
        "Audit my uploaded resume for ATS",
        "Simulate Fintech Corp interview",
        "Which placement drives am I eligible for?",
        "How to reach 95%+ match score for Super Dream offers?"
      ]);
    } else if (role === "employee") {
      setSuggestedPrompts([
        "Evaluate my skills for promotion to Principal Engineer (IC6)",
        "Audit internal requisition fit for Cloud Infrastructure",
        "Simulate System Design calibration review",
        "What are my cross-team mobility pathways?"
      ]);
    } else if (role === "recruiter" || role === "manager") {
      setSuggestedPrompts([
        "Analyze candidate pool strengths for Drive 1",
        "Explain EEOC 80% disparity in Fintech Corp drive",
        "Draft bias-free JD with standardized technical taxonomy",
        "Recommend candidates with highest counterfactual fairness"
      ]);
    } else if (role === "tpo" || role === "cpo" || role === "compliance") {
      setSuggestedPrompts([
        "Audit statutory EEOC 4/5ths Rule compliance report",
        "Explain NAAC 5.2.1 institutional placement metrics",
        "Show disparity mitigation in recent campus shortlists",
        "Review model retraining cycle accuracy & weight shifts"
      ]);
    }
  }, [currentUser, operatingMode]);

  const messagesEndRef = useRef(null);

  // Keyboard shortcut: Alt+C or Ctrl+Shift+C
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.altKey && (e.key === "c" || e.key === "C")) || (e.ctrlKey && e.key === "/")) {
        e.preventDefault();
        if (isOpen) handleClose();
        else handleOpen();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);


  // Save conversation
  useEffect(() => {
    try {
      localStorage.setItem("careerlens_copilot_chat", JSON.stringify(messages));
    } catch (e) {}
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSendMessage(queryText) {
    const text = queryText || inputQuery;
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await api.chatWithCopilot({
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        user_role: currentUser?.role || "student",
        student_id: currentUser?.student_id || 1,
        context_mode: "general"
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply
        }
      ]);

      if (res.suggested_prompts && res.suggested_prompts.length > 0) {
        setSuggestedPrompts(res.suggested_prompts);
      }
    } catch (err) {
      console.error("Copilot error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Quantum Copilot Notice**: Unable to reach AI service (${err.message}). You can still browse active placement drives and perform local resume audits.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeepResumeAudit() {
    setLoading(true);
    const userMsg = { role: "user", content: "Perform deep ATS audit on my real uploaded resume." };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const res = await api.analyzeResumeDeep({ student_id: currentUser?.student_id || 1 });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.raw_analysis || `### 🎯 Deep ATS Resume Audit\n**ATS Score**: ${res.ats_score}/100 (${res.grade})\n\n**Extracted Skills**: ${res.extracted_skills?.join(", ")}\n\n**Missing Skills**: ${res.missing_skills?.join(", ")}`
        }
      ]);
    } catch (err) {
      handleSendMessage("Audit my uploaded resume for ATS");
    } finally {
      setLoading(false);
    }
  }

  async function handleMockInterviewTurn() {
    const question = "When building a high-throughput API with Python and FastAPI, how do you prevent database connection pool exhaustion under sudden traffic spikes?";
    const userMsg = { role: "user", content: "Start technical mock interview session." };
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        role: "assistant",
        content: `### 🎙️ Technical Mock Interview — Systems Round\n\n**Question**:\n> *"${question}"*\n\n**Tips for full marks**:\n* Address connection pooling parameters (\`pool_size\`, \`max_overflow\`, \`pool_pre_ping\`).\n* Contrast non-blocking asynchronous event loops with synchronous worker threads.\n* Propose Redis caching and background task queues.\n\n*Type your answer below, and I will evaluate your technical correctness!*`
      }
    ]);
  }

  function handleResetChat() {
    if (window.confirm("Clear current conversation history?")) {
      const initial = [
        {
          role: "assistant",
          content: `🔄 **Conversation cleared.** How can I assist you with your placement goals or resume today?`
        }
      ];
      setMessages(initial);
      localStorage.removeItem("vipcare_copilot_chat");
      localStorage.removeItem("careerlens_copilot_chat");
    }
  }

  function handleCopy(text, index) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  }

  // Render markdown-styled formatting cleanly
  function renderFormattedContent(content) {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Headings
      if (line.startsWith("### ")) {
        return <h4 key={idx} style={{ color: "#38BDF8", margin: "0.5rem 0 0.3rem", fontWeight: 700 }}>{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("#### ")) {
        return <h5 key={idx} style={{ color: "#E2E8F0", margin: "0.4rem 0 0.2rem", fontWeight: 600 }}>{line.replace("#### ", "")}</h5>;
      }
      // Bullet points
      if (line.startsWith("* ") || line.startsWith("- ")) {
        return (
          <div key={idx} style={{ display: "flex", gap: "0.4rem", margin: "0.2rem 0", paddingLeft: "0.4rem" }}>
            <span style={{ color: "#06B6D4" }}>•</span>
            <span>{line.substring(2)}</span>
          </div>
        );
      }
      // Horizontal rule
      if (line.trim() === "---") {
        return <hr key={idx} style={{ borderColor: "rgba(255,255,255,0.1)", margin: "0.5rem 0" }} />;
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} style={{ height: "0.4rem" }} />;
      }
      return <p key={idx} style={{ margin: "0.25rem 0" }}>{line}</p>;
    });
  }

  return (
    <>
      {/* Floating Trigger Button (FAB) */}
      {!isOpen && (
        <button
          type="button"
          className="copilot-fab"
          onClick={handleOpen}
          title="Open VIPCARE Quantum AI Copilot (Shortcut: Alt+C)"
        >
          <div className="copilot-pulse-dot" />
          <Sparkles size={18} />
          <span>AI Copilot</span>
          <span style={{ fontSize: "0.72rem", background: "rgba(0,0,0,0.25)", padding: "0.15rem 0.45rem", borderRadius: "9999px", marginLeft: "0.2rem", border: "1px solid rgba(255,255,255,0.2)" }}>
            Alt+C
          </span>
        </button>
      )}

      {/* Slide-out Copilot Drawer / Modal */}
      {isOpen && (
        <div className={`copilot-drawer ${isFullscreen ? "fullscreen" : ""}`}>
          {/* Header */}
          <div className="copilot-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", background: "linear-gradient(135deg, #06B6D4, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF" }}>
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Quantum AI Copilot</h3>
                  <span className="badge badge-emerald" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>
                    Online
                  </span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Context: {currentUser?.name || "Candidate"} • {operatingMode === "enterprise" ? "Corporate" : "Campus"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <button
                type="button"
                className="btn-text"
                onClick={handleResetChat}
                title="Reset conversation"
                style={{ color: "var(--text-muted)", padding: "0.3rem" }}
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className="btn-text"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Restore window" : "Expand window"}
                style={{ color: "var(--text-muted)", padding: "0.3rem" }}
              >
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <button
                type="button"
                className="btn-text"
                onClick={handleClose}
                title="Close Copilot"
                style={{ color: "var(--text-muted)", padding: "0.3rem" }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="copilot-body">
            {messages.map((m, idx) => (
              <div key={idx} className={`copilot-msg ${m.role}`}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem", fontSize: "0.72rem", color: "var(--text-dim)" }}>
                  {m.role === "user" ? (
                    <>
                      <span>You</span>
                      <User size={12} />
                    </>
                  ) : (
                    <>
                      <Bot size={12} color="#06B6D4" />
                      <span style={{ color: "#38BDF8", fontWeight: 600 }}>Quantum AI</span>
                      <button
                        type="button"
                        className="btn-text"
                        onClick={() => handleCopy(m.content, idx)}
                        style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.2rem" }}
                        title="Copy text"
                      >
                        {copiedIndex === idx ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
                        <span>{copiedIndex === idx ? "Copied" : "Copy"}</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="copilot-bubble">
                  {renderFormattedContent(m.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="copilot-msg assistant">
                <div className="copilot-bubble" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div className="copilot-pulse-dot" />
                  <span style={{ color: "var(--text-muted)", fontSize: "0.84rem" }}>Quantum Copilot is analyzing and generating response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Instant Action Chips & Quick Suggestions */}
          <div style={{ padding: "0.5rem 1rem", background: "rgba(11, 18, 32, 0.9)", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: "0.72rem", padding: "0.25rem 0.65rem", display: "flex", alignItems: "center", gap: "0.3rem", background: "rgba(6, 182, 212, 0.12)", border: "1px solid rgba(6, 182, 212, 0.35)", color: "#38BDF8" }}
                onClick={handleDeepResumeAudit}
                disabled={loading}
              >
                <FileText size={12} /> Deep ATS Resume Audit
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: "0.72rem", padding: "0.25rem 0.65rem", display: "flex", alignItems: "center", gap: "0.3rem", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.35)", color: "#A5B4FC" }}
                onClick={handleMockInterviewTurn}
                disabled={loading}
              >
                <Mic size={12} /> Start Mock Interview
              </button>
            </div>

            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
              💡 Role Recommendations:
            </div>
            <div className="copilot-prompt-chips">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  className="copilot-chip-btn"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading}
                >
                  <ChevronRight size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: "2px" }} />
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input & Send Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="copilot-footer"
          >
            <input
              type="text"
              className="copilot-input"
              placeholder="Ask anything (e.g., 'Rewrite my project in STAR format')..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="copilot-send-btn"
              disabled={loading || !inputQuery.trim()}
              title="Send prompt"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
