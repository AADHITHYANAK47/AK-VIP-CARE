import React, { useState, useEffect } from "react";
import { 
  Database, Server, CheckCircle2, AlertCircle, X, 
  RefreshCw, Copy, Check, ShieldCheck, Terminal, ArrowRight, ExternalLink
} from "lucide-react";
import { api } from "../services/api";

export default function DatabaseConfigModal({ isOpen, onClose }) {
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Custom DB test state
  const [testUrl, setTestUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedTemplate, setCopiedTemplate] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadDbStatus();
    }
  }, [isOpen]);

  async function loadDbStatus() {
    try {
      setLoading(true);
      const data = await api.getDbStatus();
      setDbStatus(data);
      if (!testUrl && data.masked_url) {
        setTestUrl(data.masked_url.includes("****") ? "" : data.masked_url);
      }
    } catch (err) {
      console.error("Failed to load DB status", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection(e) {
    e.preventDefault();
    if (!testUrl.trim()) return;

    setTesting(true);
    setTestResult(null);

    try {
      const res = await api.testDbConnection(testUrl.trim());
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || "Connection failed. Please verify host, port, and credentials."
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleReconnectNow() {
    if (!testUrl.trim()) return;
    setTesting(true);
    try {
      const res = await api.reconnectDatabase(testUrl.trim());
      setTestResult({
        success: true,
        message: `✅ Switched active engine! ${res.message}`
      });
      await loadDbStatus();
    } catch (err) {
      setTestResult({
        success: false,
        message: `Switch failed: ${err.message}`
      });
    } finally {
      setTesting(false);
    }
  }

  function handleCopyTemplate(templateStr, label) {
    navigator.clipboard.writeText(templateStr);
    setCopiedTemplate(label);
    setTestUrl(templateStr);
    setTimeout(() => setCopiedTemplate(null), 2000);
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div 
        className="modal-content glass-panel" 
        style={{ 
          maxWidth: "720px", 
          width: "92vw", 
          maxHeight: "90vh", 
          display: "flex", 
          flexDirection: "column",
          padding: "0",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.85)"
        }}
      >
        {/* Header */}
        <div 
          style={{ 
            padding: "1.25rem 1.75rem", 
            background: "rgba(14, 22, 38, 0.95)", 
            borderBottom: "1px solid var(--border-subtle)", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", background: "linear-gradient(135deg, #3B82F6, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF" }}>
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>Custom Database & Storage Architecture</h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>
                Configure PostgreSQL, Supabase, Neon, or custom SQLite databases
              </p>
            </div>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Active Database Status Card */}
          <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Server size={16} color="#06B6D4" /> Active Database Connection:
              </span>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ fontSize: "0.74rem", padding: "0.25rem 0.6rem" }}
                onClick={loadDbStatus}
                disabled={loading}
              >
                <RefreshCw size={12} className={loading ? "spin" : ""} /> Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Checking database health...</div>
            ) : dbStatus ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Engine Dialect:</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#38BDF8", textTransform: "uppercase" }}>
                    {dbStatus.dialect}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Database Mode:</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: dbStatus.is_custom_database ? "#10B981" : "#FBBF24" }}>
                    {dbStatus.is_custom_database ? "Custom Enterprise Database" : "Standard Local SQLite"}
                  </div>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Masked Connection URI:</div>
                  <div style={{ fontSize: "0.8rem", fontFamily: "monospace", color: "#94A3B8", background: "rgba(0,0,0,0.25)", padding: "0.35rem 0.6rem", borderRadius: "var(--radius-sm)", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {dbStatus.masked_url}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Health Status:</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: dbStatus.is_healthy ? "#34D399" : "#FB7185", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    {dbStatus.is_healthy ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {dbStatus.is_healthy ? "Online & Synchronized" : "Connection Error"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Schema State:</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#38BDF8" }}>
                    {dbStatus.schema_status?.toUpperCase() || "SYNCED"}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Test Custom Database Connection */}
          <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Terminal size={16} color="var(--accent-cyan)" /> Test & Reconnect Database
            </h4>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 0.85rem" }}>
              Test your PostgreSQL, Supabase, Neon, or custom SQLite database connection string in real-time.
            </p>

            <form onSubmit={handleTestConnection} style={{ display: "flex", gap: "0.5rem" }}>
              <input 
                type="text"
                className="form-input"
                style={{ flex: 1, fontSize: "0.82rem", fontFamily: "monospace" }}
                placeholder="postgresql://user:password@host:5432/dbname"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
              />
              <button 
                type="submit" 
                className="btn btn-secondary"
                style={{ fontSize: "0.8rem", padding: "0.5rem 1rem", whiteSpace: "nowrap" }}
                disabled={testing}
              >
                {testing ? "Testing..." : "Test Link"}
              </button>
              {testResult?.success && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: "0.8rem", padding: "0.5rem 1rem", whiteSpace: "nowrap", background: "linear-gradient(135deg, #10B981, #06B6D4)" }}
                  onClick={handleReconnectNow}
                  disabled={testing}
                >
                  ⚡ Activate Now
                </button>
              )}
            </form>

            {/* Test Result Banner */}
            {testResult && (
              <div 
                style={{ 
                  marginTop: "0.85rem", 
                  padding: "0.75rem 1rem", 
                  borderRadius: "var(--radius-sm)", 
                  background: testResult.success ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)",
                  border: `1px solid ${testResult.success ? "rgba(16, 185, 129, 0.35)" : "rgba(244, 63, 94, 0.35)"}`,
                  color: testResult.success ? "#34D399" : "#FB7185",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Quick-Copy Connection Templates */}
          <div>
            <h4 style={{ fontSize: "0.88rem", fontWeight: 700, margin: "0 0 0.65rem", color: "var(--text-muted)" }}>
              📋 Quick-Start Database Connection Templates:
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                {
                  label: "Supabase PostgreSQL",
                  conn: "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres",
                  tip: "Use Session or Transaction Pooler URI from Supabase settings"
                },
                {
                  label: "Neon Serverless Postgres",
                  conn: "postgresql://[user]:[password]@[endpoint].us-east-2.aws.neon.tech/neondb?sslmode=require",
                  tip: "Requires sslmode=require parameter"
                },
                {
                  label: "Local / Docker PostgreSQL",
                  conn: "postgresql://postgres:password123@localhost:5432/careerlens",
                  tip: "Standard PostgreSQL default port 5432"
                },
                {
                  label: "Custom Isolated SQLite File",
                  conn: "sqlite:///./my_custom_campus.db",
                  tip: "Creates a brand new empty database without seed records"
                }
              ].map((tmpl) => (
                <div 
                  key={tmpl.label}
                  style={{ 
                    background: "rgba(255, 255, 255, 0.02)", 
                    border: "1px solid rgba(255, 255, 255, 0.07)", 
                    borderRadius: "var(--radius-sm)", 
                    padding: "0.65rem 0.85rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#E2E8F0" }}>{tmpl.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tmpl.conn}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.72rem", padding: "0.3rem 0.6rem", flexShrink: 0 }}
                    onClick={() => handleCopyTemplate(tmpl.conn, tmpl.label)}
                  >
                    {copiedTemplate === tmpl.label ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                    <span>{copiedTemplate === tmpl.label ? "Pasted" : "Use"}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions note */}
          <div style={{ background: "rgba(6, 182, 212, 0.08)", border: "1px solid rgba(6, 182, 212, 0.25)", borderRadius: "var(--radius-sm)", padding: "0.85rem", fontSize: "0.78rem", color: "#CBD5E1", lineHeight: 1.5 }}>
            💡 <strong>How to activate your custom database permanently:</strong> Set <code>DATABASE_URL=your_connection_string</code> in your <code>backend/.env</code> file and restart the backend server. VIPCARE will automatically create all tables and link your real uploaded resumes to your database!
          </div>
        </div>
      </div>
    </div>
  );
}
