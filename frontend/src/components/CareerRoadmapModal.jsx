import React, { useState, useEffect } from "react";
import { X, BookOpen, ExternalLink, Target, Clock, Award, Sparkles, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";

export default function CareerRoadmapModal({ studentId, driveId, onClose }) {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId && driveId) {
      loadRoadmap();
    }
  }, [studentId, driveId]);

  async function loadRoadmap() {
    try {
      setLoading(true);
      const data = await api.getRoadmap(studentId, driveId);
      setRoadmap(data);
    } catch (err) {
      console.error("Failed to load roadmap", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" id="roadmap-modal">
      <div className="modal-content" style={{ maxWidth: "840px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: "rgba(99, 102, 241, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
              <Target size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Personalized Career Roadmap</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Targeting: {roadmap ? `${roadmap.target_company} — ${roadmap.target_role}` : "Loading..."}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} id="btn-close-roadmap">
            <X size={20} />
          </button>
        </div>

        {loading || !roadmap ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Analyzing skill vectors and generating curriculum...
          </div>
        ) : (
          <div>
            {/* Score Projection Card */}
            <div 
              style={{ 
                padding: "1.25rem 1.5rem", 
                borderRadius: "var(--radius-lg)", 
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem"
              }}
            >
              <div>
                <span className="badge badge-indigo" style={{ marginBottom: "0.4rem" }}>SKILL GAP PROJECTION</span>
                <p style={{ fontSize: "0.9rem", color: "#E0E7FF", lineHeight: 1.5, marginTop: "0.3rem" }}>
                  {roadmap.readiness_summary}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Current</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--accent-amber)" }}>
                    {roadmap.current_match_score.toFixed(0)}%
                  </div>
                </div>
                <div style={{ fontSize: "1.2rem", color: "var(--text-dim)" }}>→</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Projected</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#34D399" }}>
                    {roadmap.projected_match_score.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Milestones Sequence */}
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BookOpen size={16} color="var(--accent-cyan)" /> Curated Learning Milestones
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {roadmap.learning_path.map((m, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: "1.25rem", 
                    borderRadius: "var(--radius-md)", 
                    background: "rgba(255, 255, 255, 0.02)", 
                    border: "1px solid var(--border-subtle)" 
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>
                        {idx + 1}
                      </span>
                      <h5 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Master {m.skill}</h5>
                      <span className={`badge ${m.priority === "High" ? "badge-rose" : "badge-indigo"}`}>
                        {m.priority} Priority
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      <Clock size={13} /> {m.estimated_hours} Hours
                    </div>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    <strong>Suggested Project:</strong> {m.suggested_project}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {m.resources.map((r, rIdx) => (
                      <a 
                        key={rIdx} 
                        href={r.url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "0.35rem", 
                          padding: "0.4rem 0.8rem", 
                          borderRadius: "var(--radius-sm)", 
                          background: "rgba(255, 255, 255, 0.05)", 
                          color: "var(--text-main)", 
                          textDecoration: "none", 
                          fontSize: "0.8rem",
                          border: "1px solid var(--border-subtle)"
                        }}
                      >
                        <span>{r.title}</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--accent-cyan)" }}>({r.platform})</span>
                        <ExternalLink size={11} />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
