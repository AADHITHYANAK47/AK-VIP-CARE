import React, { useState, useEffect } from "react";
import { 
  Building2, Users, TrendingUp, Award, AlertTriangle, FileSpreadsheet, 
  Download, RefreshCw, CheckCircle2, ShieldCheck
} from "lucide-react";
import { api } from "../services/api";

export default function TpoDashboard({ currentUser }) {
  const [metrics, setMetrics] = useState(null);
  const [naacReport, setNaacReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNaacModal, setShowNaacModal] = useState(false);

  useEffect(() => {
    loadTpoData();
  }, []);

  async function loadTpoData() {
    try {
      setLoading(true);
      const data = await api.getTpoDashboard();
      setMetrics(data);
    } catch (err) {
      console.error("Failed to load TPO metrics", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenNaac() {
    try {
      const report = await api.getNaacReport();
      setNaacReport(report);
      setShowNaacModal(true);
    } catch (err) {
      alert("Failed to generate NAAC report");
    }
  }

  if (loading || !metrics) {
    return (
      <div className="glass-panel" style={{ padding: "3.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        Compiling institutional placement analytics, department statistics, and NAAC accreditation records...
      </div>
    );
  }

  const tpoName = currentUser?.name || "Dr. K. Balaji";

  return (
    <div id="tpo-dashboard-container">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <span className="badge badge-indigo">INSTITUTIONAL PLACEMENT CELL</span>
            <span className="badge badge-emerald">NAAC CRITERION 5.2.1 COMPLIANT</span>
          </div>
          <h2 className="hero-title">{tpoName}'s Executive Placement Analytics</h2>
          <p className="hero-subtitle">
            Comprehensive placement monitoring, academic department performance metrics, early intervention lists for at-risk students,
            and exportable institutional accreditation reports.
          </p>
        </div>

        <button 
          type="button"
          id="btn-export-naac-report"
          className="btn btn-cyan" 
          onClick={handleOpenNaac}
          style={{ whiteSpace: "nowrap" }}
        >
          <FileSpreadsheet size={16} /> Export NAAC 5.2.1 Report
        </button>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: "1.75rem" }}>
        <div className="kpi-card" id="kpi-overall-placement-rate">
          <div className="kpi-label">Graduating Batch Placement Rate</div>
          <div className="kpi-value" style={{ color: "#34D399" }}>
            {metrics.overall_placement_percentage}%
          </div>
          <div className="kpi-subtext">
            {metrics.placed_students_count} of {metrics.total_students} Graduating Cohort Placed
          </div>
        </div>

        <div className="kpi-card" id="kpi-avg-ctc">
          <div className="kpi-label">Average Package CTC</div>
          <div className="kpi-value" style={{ color: "#67E8F9" }}>
            ₹{metrics.average_ctc_lpa} LPA
          </div>
          <div className="kpi-subtext">Across {metrics.total_placement_drives} corporate drives</div>
        </div>

        <div className="kpi-card" id="kpi-highest-ctc">
          <div className="kpi-label">Highest Package Offered</div>
          <div className="kpi-value" style={{ color: "#FBBF24" }}>
            ₹{metrics.highest_ctc_lpa} LPA
          </div>
          <div className="kpi-subtext">Secured by Top CS Candidate</div>
        </div>

        <div className="kpi-card" id="kpi-at-risk-count">
          <div className="kpi-label">Early Intervention Needed</div>
          <div className="kpi-value" style={{ color: metrics.students_needing_intervention.length > 5 ? "#FB7185" : "#FBBF24" }}>
            {metrics.students_needing_intervention.length} Students
          </div>
          <div className="kpi-subtext">0 Offers & Backlogs/Low Profile Strength</div>
        </div>
      </div>

      {/* Department Breakdown & Interventions */}
      <div className="grid-cols-2" style={{ marginBottom: "2rem" }}>
        {/* Department Placement Breakdown */}
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Building2 size={18} color="var(--primary)" /> Academic Department Placement Ratios
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {Object.keys(metrics.department_placement_rates).map((dept) => {
              const d = metrics.department_placement_rates[dept];
              return (
                <div key={dept} style={{ padding: "0.85rem 1rem", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{dept}</span>
                    <span style={{ fontWeight: 800, color: d.placement_percentage >= 70 ? "#34D399" : d.placement_percentage >= 50 ? "#FBBF24" : "#FB7185" }}>
                      {d.placement_percentage}% ({d.placed}/{d.total})
                    </span>
                  </div>
                  <div className="progress-track" style={{ height: "6px" }}>
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${d.placement_percentage}%`,
                        background: d.placement_percentage >= 70 ? "linear-gradient(90deg, #10B981, #06B6D4)" : "linear-gradient(90deg, #F59E0B, #EF4444)"
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* At-Risk Intervention List */}
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangle size={18} color="#F59E0B" /> Unplaced Students Early Intervention List
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Identified by low match scores or active backlogs. Recommended for skill roadmaps and mock coaching.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "320px", overflowY: "auto" }}>
            {metrics.students_needing_intervention.map((s) => (
              <div key={s.id} style={{ padding: "0.85rem", background: "rgba(0, 0, 0, 0.25)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid #FB7185" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{s.name}</span>
                  <span className="badge badge-rose">{s.roll_number}</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  {s.department} • CGPA {s.cgpa} • Backlogs: <strong style={{ color: "#FB7185" }}>{s.backlogs}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NAAC Modal */}
      {showNaacModal && naacReport && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "700px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>NAAC Criterion 5.2.1 Placement Accreditation Report</h3>
              <button className="modal-close-btn" onClick={() => setShowNaacModal(false)}>✕</button>
            </div>

            <div style={{ padding: "1rem 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                <span>Academic Year: <strong>{naacReport.academic_year}</strong></span>
                <span>Total Students Placed: <strong style={{ color: "#34D399" }}>{naacReport.total_placed}</strong></span>
              </div>

              <div style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
                  <thead style={{ background: "rgba(255,255,255,0.04)" }}>
                    <tr>
                      <th style={{ padding: "0.6rem 0.75rem" }}>Student Name</th>
                      <th style={{ padding: "0.6rem 0.75rem" }}>Dept</th>
                      <th style={{ padding: "0.6rem 0.75rem" }}>Employer</th>
                      <th style={{ padding: "0.6rem 0.75rem" }}>Package</th>
                    </tr>
                  </thead>
                  <tbody>
                    {naacReport.placed_records.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>{r.student_name}</td>
                        <td style={{ padding: "0.5rem 0.75rem" }}>{r.department}</td>
                        <td style={{ padding: "0.5rem 0.75rem", color: "var(--accent-cyan)" }}>{r.employer_name}</td>
                        <td style={{ padding: "0.5rem 0.75rem", fontWeight: 700 }}>₹{r.package_lpa} LPA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNaacModal(false)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={() => {
                  alert("📥 Exporting official NAAC 5.2.1 CSV Report for placement cell records...");
                  setShowNaacModal(false);
                }}>
                  <Download size={14} /> Download Accreditation CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
