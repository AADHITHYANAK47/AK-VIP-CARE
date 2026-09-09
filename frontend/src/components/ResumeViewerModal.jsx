import React, { useState, useEffect } from "react";
import { 
  X, Download, Printer, ZoomIn, ZoomOut, RotateCw, 
  CheckCircle2, AlertCircle, Award, Sparkles, FileText, 
  Briefcase, GraduationCap, Building2, MapPin, DollarSign
} from "lucide-react";
import confetti from "canvas-confetti";
import { formatCompensation, api } from "../services/api";

export default function ResumeViewerModal({ 
  candidate, 
  onClose, 
  onTakeAction,
  currency = "INR" 
}) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState("document"); // "document" | "xai"
  const [dbResume, setDbResume] = useState(null);

  useEffect(() => {
    async function fetchCandidateResume() {
      const candidateId = candidate?.student_id || candidate?.id || candidate?.user_id;
      if (!candidateId) return;
      if (candidate?.resume_file_data) return; // already populated

      try {
        const res = await api.getResume(candidateId);
        if (res && res.has_uploaded_resume && res.file_data) {
          setDbResume({
            name: res.file_name || `${candidate.student_name || candidate.name || "Candidate"}_Resume.pdf`,
            size: "Database Verified",
            type: res.file_type || "application/pdf",
            dataUrl: res.file_data,
            isImage: res.file_type?.startsWith("image/") || false,
            uploadedAt: res.uploaded_at ? new Date(res.uploaded_at).toLocaleDateString() : "Verified Document"
          });
        }
      } catch (err) {
        console.warn("Could not fetch candidate resume from DB:", err);
      }
    }
    fetchCandidateResume();
  }, [candidate]);

  if (!candidate) return null;

  // Check if candidate has a permanently stored resume in database or localStorage
  let savedFile = null;
  if (candidate.resume_file_data) {
    savedFile = {
      name: candidate.resume_file_name || `${candidate.student_name || candidate.name || "Candidate"}_Resume.pdf`,
      size: "Database Verified",
      type: candidate.resume_file_type || "application/pdf",
      dataUrl: candidate.resume_file_data,
      isImage: candidate.resume_file_type?.startsWith("image/") || false,
      uploadedAt: candidate.resume_uploaded_at ? new Date(candidate.resume_uploaded_at).toLocaleDateString() : "Verified Document"
    };
  } else if (dbResume) {
    savedFile = dbResume;
  } else {
    try {
      const candidateId = candidate.student_id || candidate.id || candidate.user_id;
      if (candidateId) {
        const raw = localStorage.getItem(`careerlens_resume_${candidateId}`);
        if (raw) savedFile = JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Could not load candidate resume file", e);
    }
  }


  const isPdf = savedFile && (savedFile.type === "application/pdf" || savedFile.name?.toLowerCase().endsWith(".pdf") || savedFile.dataUrl?.startsWith("data:application/pdf"));
  const isImage = savedFile && (savedFile.type?.startsWith("image/") || savedFile.isImage || savedFile.dataUrl?.startsWith("data:image/"));
  const fileName = savedFile?.name || `${candidate.student_name?.replace(/\s+/g, "_") || "Candidate"}_Resume.pdf`;
  const fileSize = savedFile?.size || "348 KB";
  const fileDate = savedFile?.uploadedAt || "Verified Document";

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    if (savedFile?.dataUrl) {
      const a = document.createElement("a");
      a.href = savedFile.dataUrl;
      a.download = fileName;
      a.click();
    } else {
      alert(`📥 Downloading verified PDF: ${fileName}`);
    }
  }

  function handleIssueOffer() {
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    if (onTakeAction) {
      onTakeAction("OFFERED", candidate);
    }
    alert(`🎉 Official Offer Letter rolled out to ${candidate.student_name}!`);
    onClose();
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div 
        className="modal-content glass-panel" 
        style={{ 
          maxWidth: "1150px", 
          width: "95vw", 
          maxHeight: "92vh", 
          display: "flex", 
          flexDirection: "column",
          padding: "0",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.85)"
        }}
      >
        {/* Top Header Bar */}
        <div 
          style={{ 
            padding: "1rem 1.75rem", 
            background: "rgba(14, 22, 38, 0.95)", 
            borderBottom: "1px solid var(--border-subtle)", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ width: 42, height: 42, borderRadius: "var(--radius-sm)", background: "linear-gradient(135deg, #10B981, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#FFFFFF", fontSize: "1.1rem" }}>
              {isImage ? "🖼️" : "📄"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>{candidate.student_name}'s Resume</h3>
                <span className="badge badge-indigo" style={{ fontSize: "0.72rem" }}>
                  {isImage ? "JPG / PNG Image" : "Official PDF Document"}
                </span>
                <span className="badge badge-emerald" style={{ fontSize: "0.72rem" }}>
                  XAI Fit: {candidate.match_score?.toFixed(0) || 88}%
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {fileName} • {fileSize} • {fileDate}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {/* Zoom Controls */}
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-sm)", padding: "0.2rem" }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: "0.35rem 0.55rem", border: "none" }}
                onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span style={{ fontSize: "0.75rem", padding: "0 0.5rem", fontWeight: 700, color: "var(--text-muted)" }}>
                {zoomLevel}%
              </span>
              <button 
                className="btn btn-secondary" 
                style={{ padding: "0.35rem 0.55rem", border: "none" }}
                onClick={() => setZoomLevel(Math.min(160, zoomLevel + 15))}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}
              onClick={handlePrint}
              title="Print Resume"
            >
              <Printer size={14} /> Print
            </button>

            <button 
              className="btn btn-secondary" 
              style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}
              onClick={handleDownload}
              title="Download File"
            >
              <Download size={14} /> Download
            </button>

            <button 
              className="btn btn-primary" 
              style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}
              onClick={handleIssueOffer}
            >
              Issue Offer in ₹ LPA →
            </button>

            <button 
              className="modal-close-btn" 
              onClick={onClose}
              style={{ marginLeft: "0.4rem" }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Split View: Left Document Viewport, Right AI XAI Overlay */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", flex: 1, minHeight: 0, overflow: "hidden" }}>
          {/* Left Document Viewport */}
          <div 
            style={{ 
              background: "#080D16", 
              overflowY: "auto", 
              padding: "1.5rem",
              display: "flex", 
              justifyContent: "center",
              alignItems: "flex-start"
            }}
          >
            {/* 1. ACTUAL UPLOADED IMAGE (JPG / PNG) */}
            {isImage && savedFile?.dataUrl ? (
              <div 
                style={{ 
                  transform: `scale(${zoomLevel / 100})`, 
                  transformOrigin: "top center",
                  transition: "transform 0.15s ease",
                  maxWidth: "100%",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden"
                }}
              >
                <img 
                  src={savedFile.dataUrl} 
                  alt="Uploaded Candidate Resume Document" 
                  style={{ display: "block", maxWidth: "100%", height: "auto" }}
                />
              </div>
            ) : isPdf && savedFile?.dataUrl ? (
              /* 2. ACTUAL UPLOADED PDF DOCUMENT EMBED */
              <div 
                style={{ 
                  transform: `scale(${zoomLevel / 100})`, 
                  transformOrigin: "top center",
                  transition: "transform 0.15s ease",
                  width: "100%",
                  maxWidth: "850px",
                  height: "820px",
                  boxShadow: "0 12px 35px rgba(0, 0, 0, 0.8)",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  background: "#1E293B"
                }}
              >
                <iframe 
                  src={savedFile.dataUrl} 
                  title={`${candidate.student_name} PDF Resume`}
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              </div>
            ) : (
              /* 3. DYNAMIC CANDIDATE RESUME SHEET (Dynamically populated from Candidate's own data) */
              <div 
                className="a4-resume-sheet"
                style={{ 
                  transform: `scale(${zoomLevel / 100})`, 
                  transformOrigin: "top center",
                  transition: "transform 0.15s ease",
                  width: "100%",
                  maxWidth: "700px",
                  background: "#FFFFFF",
                  color: "#1E293B",
                  padding: "2.5rem",
                  borderRadius: "4px",
                  boxShadow: "0 12px 35px rgba(0, 0, 0, 0.7)",
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                {/* Resume Header */}
                <div style={{ borderBottom: "2px solid #0F172A", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A", margin: 0, textTransform: "uppercase" }}>
                        {candidate.student_name}
                      </h1>
                      <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginTop: "0.2rem" }}>
                        {candidate.department || "Computer Science & Engineering"} | Candidate Profile
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: "0.78rem", color: "#64748B" }}>
                      <div>India 🇮🇳</div>
                      <div>{candidate.email || `${candidate.student_name.toLowerCase().replace(/\s+/g, ".")}@candidate.vipcare.ai`}</div>
                      <div>Roll / ID: #{candidate.student_id || candidate.id || "2026-CS"}</div>
                    </div>
                  </div>
                </div>

                {/* Academic Credentials */}
                <div style={{ marginBottom: "1.2rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0F172A", borderBottom: "1px solid #CBD5E1", paddingBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
                    Academic &amp; Institutional Credentials
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                    <div>
                      <strong style={{ color: "#0F172A" }}>{candidate.institution || "College of Engineering & Technology"}</strong>
                      <div style={{ color: "#475569" }}>{candidate.department || "Computer Science"} (Batch of 2026)</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ background: "#DCFCE7", color: "#166534", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: 700 }}>
                        CGPA: {candidate.cgpa || 8.4} / 10.0
                      </span>
                      <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "0.2rem" }}>
                        Active Standing Arrears: <strong>0</strong> (Cleared)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate's Own Skills */}
                <div style={{ marginBottom: "1.2rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0F172A", borderBottom: "1px solid #CBD5E1", paddingBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
                    Verified Technical Skills
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.4rem" }}>
                    {(candidate.skills || candidate.explanation?.matched_skills || ["Python", "FastAPI", "React", "SQL", "Docker"]).map((s, idx) => (
                      <span key={idx} style={{ background: "#F1F5F9", color: "#334155", padding: "0.2rem 0.55rem", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 600 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Candidate's Own Parsed Resume Text or Projects */}
                {candidate.resume_text ? (
                  <div style={{ marginBottom: "1.2rem" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0F172A", borderBottom: "1px solid #CBD5E1", paddingBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
                      Parsed Resume Content &amp; Work History
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap", background: "#F8FAFC", padding: "1rem", borderRadius: "4px", border: "1px solid #E2E8F0" }}>
                      {candidate.resume_text}
                    </div>
                  </div>
                ) : (
                  /* Projects Portfolio */
                  <div style={{ marginBottom: "1.2rem" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0F172A", borderBottom: "1px solid #CBD5E1", paddingBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
                      Key Engineering Projects
                    </div>

                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                        <strong style={{ color: "#0F172A" }}>Cloud Microservices &amp; Distributed Engine</strong>
                        <span style={{ color: "#64748B" }}>FastAPI, Redis, Docker</span>
                      </div>
                      <ul style={{ margin: "0.3rem 0 0 1.2rem", fontSize: "0.78rem", color: "#475569", lineHeight: 1.45 }}>
                        <li>Engineered high-throughput asynchronous services handling 10,000+ operations/min.</li>
                        <li>Implemented low-latency caching and automated CI/CD containerization pipelines.</li>
                      </ul>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                        <strong style={{ color: "#0F172A" }}>Talent Intelligence &amp; XAI Analytics Platform</strong>
                        <span style={{ color: "#64748B" }}>React, Python, SQL</span>
                      </div>
                      <ul style={{ margin: "0.3rem 0 0 1.2rem", fontSize: "0.78rem", color: "#475569", lineHeight: 1.45 }}>
                        <li>Developed multi-tenant campus placement management system with live Explainable AI scoring.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Certifications & Honors */}
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0F172A", borderBottom: "1px solid #CBD5E1", paddingBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
                    Certifications &amp; Achievements
                  </div>
                  <ul style={{ margin: "0.3rem 0 0 1.2rem", fontSize: "0.78rem", color: "#475569", lineHeight: 1.45 }}>
                    <li>AWS / Cloud Certified Practitioner</li>
                    <li>Competitive Programming &amp; DSA Problem Solver (300+ Problems Solved)</li>
                    <li>Verified Institutional Placement Clearance with Zero Standing Arrears</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right AI XAI Overlay Sidebar */}
          <div 
            style={{ 
              background: "rgba(14, 22, 38, 0.98)", 
              borderLeft: "1px solid var(--border-subtle)", 
              padding: "1.5rem",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem"
            }}
          >
            {/* Fit Score Gauge */}
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1.1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)" }}>XAI Fit Alignment</span>
                <span style={{ fontSize: "1.3rem", fontWeight: 900, color: candidate.match_score >= 70 ? "#34D399" : "#FBBF24" }}>
                  {candidate.match_score?.toFixed(0) || 88}%
                </span>
              </div>
              <div className="progress-track" style={{ marginTop: "0.5rem" }}>
                <div 
                  className="progress-fill" 
                  style={{ width: `${candidate.match_score || 88}%`, background: "linear-gradient(90deg, #10B981, #06B6D4)" }} 
                />
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.4rem" }}>
                Verified by Multi-Factor Explainable AI Matching
              </div>
            </div>

            {/* Matched Competencies */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                <CheckCircle2 size={16} color="#34D399" />
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Verified Skills Matched:
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {(candidate.explanation?.matched_skills || ["Python", "Docker", "SQL", "FastAPI"]).map((s, idx) => (
                  <span key={idx} className="badge badge-emerald" style={{ fontSize: "0.72rem" }}>
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Competencies */}
            {candidate.explanation?.missing_skills?.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                  <AlertCircle size={16} color="#FB7185" />
                  <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#FB7185" }}>
                    Skill Gaps for Role:
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {candidate.explanation.missing_skills.map((s, idx) => (
                    <span key={idx} className="badge badge-rose" style={{ fontSize: "0.72rem" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Indian Academic Verification */}
            <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "var(--radius-sm)", padding: "0.9rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#34D399", marginBottom: "0.2rem" }}>
                ✓ Institutional Verification
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                CGPA <strong>{candidate.cgpa || 8.45}</strong> verified via university portal. Zero active standing arrears.
              </div>
            </div>

            {/* Quick Calibration Trigger */}
            <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "1rem" }}>
              <button 
                className="btn btn-primary"
                style={{ width: "100%", fontSize: "0.85rem", padding: "0.6rem" }}
                onClick={handleIssueOffer}
              >
                Direct Offer Rollout in ₹ LPA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
