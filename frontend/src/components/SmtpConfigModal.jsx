import React, { useState, useEffect } from "react";
import { 
  Mail, KeyRound, ShieldCheck, CheckCircle2, AlertCircle, 
  Send, RefreshCw, X, HelpCircle, ExternalLink, Eye, EyeOff, Lock
} from "lucide-react";
import { api } from "../services/api";

export default function SmtpConfigModal({ isOpen, onClose, onConfigSaved }) {
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [smtpServer, setSmtpServer] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("VIPCARE India Verification");
  const [useTls, setUseTls] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Test Email state
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  async function loadStatus() {
    try {
      const res = await api.getSmtpStatus();
      setSmtpStatus(res);
      if (res.server) setSmtpServer(res.server);
      if (res.port) setSmtpPort(res.port);
      if (res.username_masked && !smtpUsername) {
        // preserve masked placeholder
      }
    } catch (e) {
      console.warn("Could not load SMTP status:", e);
    }
  }

  async function handleSaveConfig(e) {
    if (e) e.preventDefault();
    if (!smtpUsername.trim() || !smtpPassword.trim()) {
      setStatusMsg({ type: "error", text: "Please provide both Gmail address and 16-character App Password." });
      return;
    }
    setSaving(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const payload = {
        smtp_server: smtpServer.trim() || "smtp.gmail.com",
        smtp_port: Number(smtpPort) || 587,
        smtp_username: smtpUsername.trim(),
        smtp_password: smtpPassword.trim(),
        smtp_from: smtpFrom.trim() ? `${smtpFrom.trim()} <${smtpUsername.trim()}>` : undefined,
        smtp_use_tls: useTls
      };
      const res = await api.updateSmtpConfig(payload);
      setStatusMsg({ type: "success", text: "✅ " + res.message });
      await loadStatus();
      if (onConfigSaved) onConfigSaved(res);
    } catch (err) {
      setStatusMsg({ type: "error", text: "❌ " + (err.message || "Failed to save SMTP configuration.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTestEmail() {
    const target = testEmail.trim() || smtpUsername.trim();
    if (!target || !target.includes("@")) {
      setStatusMsg({ type: "error", text: "Please enter a valid destination email address to send test verification." });
      return;
    }
    setTesting(true);
    setStatusMsg({ type: "info", text: `Sending real verification email to ${target}...` });
    try {
      const res = await api.testSmtpConnection({ test_email: target });
      setStatusMsg({ 
        type: "success", 
        text: `🎉 ${res.message} (Test OTP: ${res.test_otp})` 
      });
      await loadStatus();
    } catch (err) {
      setStatusMsg({ 
        type: "error", 
        text: "❌ " + (err.message || "Email dispatch failed. Please check your App Password and ensure 2FA is active on your Google account.") 
      });
    } finally {
      setTesting(false);
    }
  }

  if (!isOpen) return null;

  const isLive = smtpStatus?.configured;

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(3, 7, 18, 0.82)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem"
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "580px",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#0F172A",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          borderRadius: "16px",
          padding: "1.75rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
              <div style={{ 
                width: "36px", height: "36px", borderRadius: "10px", 
                background: "rgba(56, 189, 248, 0.15)", display: "flex", 
                alignItems: "center", justifyContent: "center", color: "#38BDF8" 
              }}>
                <Mail size={20} />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "#F8FAFC" }}>
                Gmail SMTP &amp; OTP Setup
              </h2>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#94A3B8", margin: 0 }}>
              Configure real Gmail delivery for 6-digit candidate verification codes across India 🇮🇳
            </p>
          </div>

          <button 
            type="button"
            onClick={onClose}
            style={{ 
              background: "rgba(255, 255, 255, 0.05)", border: "none", 
              borderRadius: "8px", padding: "0.4rem", color: "#94A3B8", 
              cursor: "pointer" 
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Status Pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          borderRadius: "10px",
          marginBottom: "1.25rem",
          background: isLive ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
          border: `1px solid ${isLive ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ 
              width: "10px", height: "10px", borderRadius: "50%", 
              background: isLive ? "#10B981" : "#F59E0B",
              boxShadow: isLive ? "0 0 8px #10B981" : "0 0 8px #F59E0B"
            }} />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: isLive ? "#34D399" : "#FBBF24" }}>
              {isLive ? `Live Gmail OTP Active (${smtpStatus?.username_masked || "Configured"})` : "Development Mode (Console / Dev Toast OTPs)"}
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
            {smtpStatus?.server}:{smtpStatus?.port}
          </span>
        </div>

        {/* Google App Password Step-by-Step Guide */}
        <div style={{
          background: "rgba(30, 41, 59, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "10px",
          padding: "0.9rem 1rem",
          marginBottom: "1.25rem",
          fontSize: "0.8rem",
          color: "#CBD5E1",
          lineHeight: 1.5
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, color: "#38BDF8", marginBottom: "0.4rem" }}>
            <KeyRound size={15} /> How to get a Google App Password in 60 seconds:
          </div>
          <ol style={{ margin: "0.3rem 0 0.5rem 1.2rem", padding: 0, color: "#94A3B8" }}>
            <li>Go to <strong style={{ color: "#F1F5F9" }}>myaccount.google.com/security</strong></li>
            <li>Ensure <strong style={{ color: "#F1F5F9" }}>2-Step Verification</strong> is switched ON</li>
            <li>Search for <strong style={{ color: "#38BDF8" }}>"App Passwords"</strong> (or go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: "#38BDF8", textDecoration: "underline" }}>myaccount.google.com/apppasswords</a>)</li>
            <li>Name it <strong style={{ color: "#F1F5F9" }}>"VIPCARE"</strong> and copy the generated 16-letter code</li>
          </ol>
          <div style={{ fontSize: "0.74rem", color: "#64748B" }}>
            💡 <em>Regular Gmail passwords fail due to Google security policies. Use only 16-character App Passwords.</em>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveConfig}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.3rem" }}>
                Gmail Address:
              </label>
              <input 
                type="email"
                className="input-field"
                placeholder="your.email@gmail.com"
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box" }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.3rem" }}>
                Google 16-Character App Password:
              </label>
              <div style={{ position: "relative" }}>
                <input 
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="abcd efgh ijkl mnop"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", paddingRight: "2.5rem" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "#64748B", cursor: "pointer"
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.3rem" }}>
                  SMTP Server:
                </label>
                <input 
                  type="text"
                  className="input-field"
                  value={smtpServer}
                  onChange={(e) => setSmtpServer(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.3rem" }}>
                  Port (TLS):
                </label>
                <input 
                  type="number"
                  className="input-field"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.3rem" }}>
                Sender Brand Header:
              </label>
              <input 
                type="text"
                className="input-field"
                value={smtpFrom}
                onChange={(e) => setSmtpFrom(e.target.value)}
                placeholder="VIPCARE India Verification"
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Feedback messages */}
          {statusMsg.text && (
            <div style={{
              marginTop: "1rem",
              padding: "0.75rem",
              borderRadius: "8px",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
              background: statusMsg.type === "success" ? "rgba(16, 185, 129, 0.12)" : statusMsg.type === "error" ? "rgba(244, 63, 94, 0.12)" : "rgba(56, 189, 248, 0.12)",
              border: `1px solid ${statusMsg.type === "success" ? "rgba(16, 185, 129, 0.3)" : statusMsg.type === "error" ? "rgba(244, 63, 94, 0.3)" : "rgba(56, 189, 248, 0.3)"}`,
              color: statusMsg.type === "success" ? "#34D399" : statusMsg.type === "error" ? "#FB7185" : "#38BDF8"
            }}>
              {statusMsg.text}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              {saving ? <RefreshCw size={16} className="spin" /> : <ShieldCheck size={16} />}
              {saving ? "Saving..." : "Save & Activate Credentials"}
            </button>
          </div>
        </form>

        {/* Live Email Test Section */}
        <div style={{
          marginTop: "1.5rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)"
        }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#F1F5F9", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Send size={15} color="#38BDF8" /> Test Real Inbox Delivery:
          </h4>
          <p style={{ fontSize: "0.78rem", color: "#94A3B8", margin: "0 0 0.75rem 0" }}>
            Enter your personal email to receive a real 6-digit test OTP right now:
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input 
              type="email"
              className="input-field"
              placeholder="recipient@gmail.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={testing}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }}
            >
              {testing ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
              {testing ? "Sending..." : "Send Test OTP"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
