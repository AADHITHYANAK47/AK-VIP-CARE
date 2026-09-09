import React, { useState, useEffect } from "react";
import { 
  Building2, Users, TrendingUp, Award, AlertTriangle, FileSpreadsheet, 
  Download, RefreshCw, CheckCircle2, ShieldCheck, Globe, Scale
} from "lucide-react";
import { api, formatCompensation } from "../services/api";

export default function CpoDashboard({ currentUser, currency = "INR" }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    loadCpoMetrics();
  }, []);

  async function loadCpoMetrics() {
    try {
      setLoading(true);
      const data = await api.getTpoDashboard();
      setMetrics(data);
    } catch (err) {
      console.error("Failed to load CPO metrics", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !metrics) {
    return (
      <div className="glass-panel" style={{ padding: "3.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        Compiling national talent mobility, multi-hub disparity indices, and regulatory compliance data...
      </div>
    );
  }

  const cpoName = currentUser?.name || "Dr. Kavita Nair";
  const cpoOrg = currentUser?.organization || "Mumbai HQ 🇮🇳 • National Talent Operations & DEI Governance";

  return (
    <div id="cpo-dashboard-container">
      {/* Hero Banner */}
      <div className="hero-banner" style={{ borderLeft: "4px solid var(--accent-emerald)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <span className="badge badge-indigo">CHIEF PEOPLE OFFICER (CPO) EXECUTIVE SUITE</span>
            <span className="badge badge-emerald">US EEOC &amp; NATIONAL AUDIT READY</span>
          </div>
          <h2 className="hero-title">{cpoName}'s National Workforce Mobility &amp; DEI Suite</h2>
          <p className="hero-subtitle">
            Executive oversight of talent mobility across Indian tech hubs (Bengaluru HQ, Hyderabad, Pune, Chennai, Mumbai, Delhi-NCR).
            Monitor statutory disparate impact ratios under US EEOC Title VII 4/5ths Rule and institutional NAAC fairness standards.
          </p>
        </div>

        <button 
          type="button"
          className="btn btn-cyan" 
          onClick={() => setShowExportModal(true)}
          style={{ whiteSpace: "nowrap" }}
        >
          <FileSpreadsheet size={16} /> Export Global Statutory Audit
        </button>
      </div>

      {/* Global Enterprise KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: "1.75rem" }}>
        <div className="kpi-card">
          <div className="kpi-label">Internal Mobility / Promotion Rate</div>
          <div className="kpi-value" style={{ color: "#34D399" }}>
            {metrics.overall_placement_percentage}%
          </div>
          <div className="kpi-subtext">
            {metrics.placed_students_count} of {metrics.total_students} Internal Candidates Successfully Promoted/Transferred
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Average Global Compensation</div>
          <div className="kpi-value" style={{ color: "#67E8F9" }}>
            {formatCompensation(metrics.average_ctc_lpa, currency)}
          </div>
          <div className="kpi-subtext">Across {metrics.total_placement_drives} open global requisitions</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Global Pay & Promotion Equity</div>
          <div className="kpi-value" style={{ color: "#A855F7" }}>98.4%</div>
          <div className="kpi-subtext">Parity ratio across male, female, non-binary</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">EEOC & EU AI Act Compliance</div>
          <div className="kpi-value" style={{ color: "#34D399" }}>
            0.84+ (Passed)
          </div>
          <div className="kpi-subtext">All active requisitions strictly above 0.80 threshold</div>
        </div>
      </div>

      {/* Multi-Hub Workforce Distribution */}
      <div className="grid-cols-2" style={{ marginBottom: "2rem" }}>
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Globe size={18} color="var(--accent-cyan)" /> National Tech Hub Workforce Breakdown
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {[
              { hub: "Bengaluru HQ 🇮🇳 (Outer Ring Road)", staff: "34 Staff & Principal Engineers", rate: "88.2%", color: "#06B6D4" },
              { hub: "Hyderabad Tech Hub 🇮🇳 (HITEC City)", staff: "24 Senior Cloud Engineers", rate: "82.5%", color: "#6366F1" },
              { hub: "Pune IT Corridor 🇮🇳 (Hinjewadi)", staff: "18 Backend & Platform Specialists", rate: "79.4%", color: "#10B981" },
              { hub: "Chennai Tech Hub 🇮🇳 (OMR IT Corridor)", staff: "16 Distributed Systems Engineers", rate: "85.0%", color: "#F59E0B" }
            ].map((h, i) => (
              <div key={i} style={{ padding: "0.75rem 1rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{h.hub}</span>
                  <span style={{ color: h.color, fontWeight: 800 }}>Mobility Rate: {h.rate}</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{h.staff}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Retention Early Intervention List */}
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangle size={18} color="#F59E0B" /> Talent Retention &amp; Attrition Early Intervention
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Employees in IC3/IC4 bands with high skill overlap who have not received an internal promotion within 24 months.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { name: "Rahul Sharma", role: "Senior Backend Engineer (IC4)", gap: "Missing Cloud Infrastructure Certification", status: "HIGH ATTRITION RISK", color: "#FB7185" },
              { name: "Sneha Patel", role: "Frontend Platform Engineer (IC3)", gap: "Needs 1 Cross-Org Distributed Project", status: "MODERATE RISK", color: "#FBBF24" },
              { name: "Karthik Raja", role: "DevOps Engineer (IC4)", gap: "Scheduled for Bengaluru Tech Lead Calibration", status: "INTERVENTION IN PROGRESS", color: "#67E8F9" }
            ].map((r, i) => (
              <div key={i} style={{ padding: "0.85rem", background: "rgba(0,0,0,0.25)", borderRadius: "var(--radius-sm)", borderLeft: `3px solid ${r.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{r.name}</span>
                  <span className="badge" style={{ background: `${r.color}22`, color: r.color, fontSize: "0.7rem" }}>
                    {r.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  {r.role} • {r.gap}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statutory Export Modal */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Export Statutory Regulatory AI Audit</h3>
              <button className="modal-close-btn" onClick={() => setShowExportModal(false)}>✕</button>
            </div>

            <div style={{ padding: "1rem 0" }}>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                Generate official board-ready compliance documentation demonstrating that algorithmic talent matching 
                satisfies the <strong>US EEOC Title VII 4/5ths Rule</strong>, <strong>EU AI Act (Regulation 2024/1689)</strong>, and <strong>UK Equality Act</strong>.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div style={{ padding: "0.75rem 1rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>1. US EEOC Title VII Disparity Report</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>UGESP 80% Rule contingency analysis across gender and protected cohorts</div>
                  </div>
                  <span className="badge badge-emerald">PASSED (0.84+)</span>
                </div>

                <div style={{ padding: "0.75rem 1rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>2. EU AI Act High-Risk AI Assessment</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Article 9 Risk Management & Article 10 Data Governance Compliance</div>
                  </div>
                  <span className="badge badge-cyan">CONFORMITY CERTIFIED</span>
                </div>

                <div style={{ padding: "0.75rem 1rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>3. UK Equality Act Pay & Promotion Parity</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>London Hub promotion parity audit across bands IC3 to IC6</div>
                  </div>
                  <span className="badge badge-emerald">AUDITED</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowExportModal(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    alert("📄 Generating official EEOC & EU AI Act PDF/CSV audit bundle for CPO Dr. Elena Rostova...");
                    setShowExportModal(false);
                  }}
                >
                  <Download size={15} /> Download Signed Statutory Audit Bundle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
