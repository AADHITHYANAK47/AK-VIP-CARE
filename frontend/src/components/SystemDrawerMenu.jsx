import React from "react";
import { 
  X, Mail, Database, Sparkles, ShieldCheck, Globe, 
  ArrowRight, ExternalLink, CheckCircle2, AlertCircle, 
  Terminal, Lock, KeyRound, Server
} from "lucide-react";

export default function SystemDrawerMenu({
  isOpen,
  onClose,
  smtpStatus,
  dbStatus,
  onOpenSmtpConfig,
  onOpenDatabaseConfig,
  onOpenAICopilot,
  onExploreGuest
}) {
  if (!isOpen) return null;

  const isSmtpActive = Boolean(smtpStatus?.configured);
  const isDbHealthy = Boolean(dbStatus?.is_healthy !== false);
  const dbDialect = (dbStatus?.dialect || "sqlite").toUpperCase();

  return (
    <div 
      className="system-drawer-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(3, 7, 18, 0.75)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
        animation: "fadeIn 0.2s ease-out"
      }}
    >
      <div 
        className="system-drawer-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "460px",
          height: "100%",
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 30, 0.99) 100%)",
          borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.7)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: "1.5rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.02)"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #06B6D4, #4F46E5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF"
              }}>
                <Server size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.01em" }}>
                  System Setup &amp; Controls
                </h3>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#94A3B8" }}>
                  Infrastructure, Gmail OTP, Database &amp; AI
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#94A3B8",
              cursor: "pointer",
              padding: "0.45rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease"
            }}
            title="Close Menu (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body Items */}
        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
          
          {/* 1. Real Gmail SMTP & OTP Setup */}
          <div style={{
            background: "rgba(16, 185, 129, 0.05)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "14px",
            padding: "1.1rem",
            position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{
                  padding: "0.45rem",
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#34D399"
                }}>
                  <Mail size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "#F1F5F9" }}>
                    Gmail OTP Verification
                  </h4>
                  <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                    Real email delivery to candidate inboxes
                  </span>
                </div>
              </div>

              <span style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                padding: "0.2rem 0.6rem",
                borderRadius: "20px",
                background: isSmtpActive ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.15)",
                color: isSmtpActive ? "#34D399" : "#FBBF24",
                border: `1px solid ${isSmtpActive ? "rgba(16, 185, 129, 0.35)" : "rgba(245, 158, 11, 0.35)"}`
              }}>
                {isSmtpActive ? "● ACTIVE GMAIL" : "● DEV CONSOLE"}
              </span>
            </div>

            <p style={{ margin: "0 0 0.85rem 0", fontSize: "0.78rem", color: "#CBD5E1", lineHeight: 1.45 }}>
              Deliver cryptographically secure 6-digit OTPs using Google App Passwords. Each student/recruiter gets their OTP in their actual Gmail inbox.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.72rem", color: "#64748B", fontFamily: "monospace" }}>
                {smtpStatus?.username_masked ? `User: ${smtpStatus.username_masked}` : "smtp.gmail.com:587"}
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenSmtpConfig) onOpenSmtpConfig();
                }}
                style={{
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  padding: "0.45rem 0.85rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
                }}
              >
                Configure Gmail OTP <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* 2. Custom Database Setup (DB Setup) */}
          <div style={{
            background: "rgba(6, 182, 212, 0.05)",
            border: "1px solid rgba(6, 182, 212, 0.25)",
            borderRadius: "14px",
            padding: "1.1rem",
            position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{
                  padding: "0.45rem",
                  borderRadius: "8px",
                  background: "rgba(6, 182, 212, 0.15)",
                  color: "#38BDF8"
                }}>
                  <Database size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "#F1F5F9" }}>
                    Database Setup (DB Setup)
                  </h4>
                  <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                    Enterprise Custom Storage
                  </span>
                </div>
              </div>

              <span style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                padding: "0.2rem 0.6rem",
                borderRadius: "20px",
                background: isDbHealthy ? "rgba(6, 182, 212, 0.18)" : "rgba(239, 68, 68, 0.18)",
                color: isDbHealthy ? "#38BDF8" : "#F87171",
                border: `1px solid ${isDbHealthy ? "rgba(6, 182, 212, 0.35)" : "rgba(239, 68, 68, 0.35)"}`
              }}>
                {dbDialect} {isDbHealthy ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </div>

            <p style={{ margin: "0 0 0.85rem 0", fontSize: "0.78rem", color: "#CBD5E1", lineHeight: 1.45 }}>
              Supply your own PostgreSQL, Supabase, Neon, or MySQL database connection URL. Resume PDFs and test logs isolate automatically.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.72rem", color: "#64748B", fontFamily: "monospace", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {dbStatus?.masked_url || "sqlite:///./careerlens.db"}
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenDatabaseConfig) onOpenDatabaseConfig();
                }}
                style={{
                  background: "linear-gradient(135deg, #06B6D4, #0284C7)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  padding: "0.45rem 0.85rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  boxShadow: "0 2px 8px rgba(6, 182, 212, 0.3)"
                }}
              >
                Configure Database <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* 3. Quantum AI Copilot & Career Coach */}
          <div style={{
            background: "rgba(99, 102, 241, 0.05)",
            border: "1px solid rgba(99, 102, 241, 0.22)",
            borderRadius: "14px",
            padding: "1.1rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{
                  padding: "0.45rem",
                  borderRadius: "8px",
                  background: "rgba(99, 102, 241, 0.15)",
                  color: "#818CF8"
                }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "#F1F5F9" }}>
                    Quantum AI Career Copilot
                  </h4>
                  <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                    Dynamic ATS Audits &amp; Mock Interviews
                  </span>
                </div>
              </div>

              <span style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                padding: "0.2rem 0.6rem",
                borderRadius: "20px",
                background: "rgba(99, 102, 241, 0.2)",
                color: "#A5B4FC",
                border: "1px solid rgba(99, 102, 241, 0.35)"
              }}>
                READY (Alt+C)
              </span>
            </div>

            <p style={{ margin: "0 0 0.85rem 0", fontSize: "0.78rem", color: "#CBD5E1", lineHeight: 1.45 }}>
              Runs with built-in expert career intelligence offline, or connect Groq, Gemini, or OpenAI API keys in your environment.
            </p>

            {onOpenAICopilot && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAICopilot();
                  }}
                  style={{
                    background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    padding: "0.45rem 0.85rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem"
                  }}
                >
                  Launch AI Copilot <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>

          {/* 4. Indian Tech Ecosystem & Compensation */}
          <div style={{
            background: "rgba(245, 158, 11, 0.05)",
            border: "1px solid rgba(245, 158, 11, 0.22)",
            borderRadius: "14px",
            padding: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <Globe size={16} color="#FBBF24" />
              <h4 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#FDE68A" }}>
                Indian Tech Hubs &amp; Compensation
              </h4>
            </div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#E2E8F0", lineHeight: 1.4 }}>
              Active Hubs: <strong>Bengaluru HQ (Outer Ring Road)</strong>, <strong>Hyderabad (HITEC City)</strong>, <strong>Pune (Hinjawadi)</strong>, <strong>Chennai (OMR)</strong>, <strong>Delhi-NCR</strong>, and <strong>Mumbai (BKC)</strong> with compensation modeled in <strong>₹ LPA</strong>.
            </p>
          </div>

          {/* 5. EEOC 4/5ths Rule Compliance & Guest Explore */}
          {onExploreGuest && (
            <div style={{
              background: "rgba(148, 163, 184, 0.05)",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: "14px",
              padding: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                  <ShieldCheck size={16} color="#94A3B8" />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#E2E8F0" }}>EEOC Fairness Audit</span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "#64748B" }}>Preview disparity curves without logging in</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExploreGuest();
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: "#F1F5F9",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  padding: "0.4rem 0.75rem",
                  cursor: "pointer"
                }}
              >
                Guest Preview
              </button>
            </div>
          )}

        </div>

        {/* Drawer Footer */}
        <div style={{
          padding: "1.2rem 1.5rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(255, 255, 255, 0.02)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              color: "#38BDF8",
              fontSize: "0.75rem",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            <Terminal size={13} /> FastAPI Swagger Docs <ExternalLink size={11} />
          </a>

          <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
            v2.6 Enterprise • India 🇮🇳
          </span>
        </div>
      </div>
    </div>
  );
}
