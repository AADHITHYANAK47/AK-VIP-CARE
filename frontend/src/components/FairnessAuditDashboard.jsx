import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, AlertTriangle, CheckCircle, HelpCircle, 
  ArrowRight, Users, Scale, AlertCircle, RefreshCw, BarChart3, Filter
} from "lucide-react";
import { api } from "../services/api";

export default function FairnessAuditDashboard({ operatingMode = "enterprise" }) {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);

  const isEnterprise = operatingMode === "enterprise";

  // Counterfactual state
  const [cfStudentId, setCfStudentId] = useState("");
  const [cfHypoBacklogs, setCfHypoBacklogs] = useState(0);
  const [cfHypoDept, setCfHypoDept] = useState("");
  const [cfResult, setCfResult] = useState(null);
  const [cfLoading, setCfLoading] = useState(false);

  useEffect(() => {
    loadDrivesAndStudents();
  }, []);

  useEffect(() => {
    if (selectedDriveId) {
      loadAudit(selectedDriveId);
    }
  }, [selectedDriveId]);

  async function loadDrivesAndStudents() {
    try {
      setLoading(true);
      const [drivesRes, studentsRes] = await Promise.all([
        api.getDrives(),
        api.getStudents()
      ]);
      setDrives(drivesRes);
      setStudents(studentsRes);
      if (drivesRes.length > 0) {
        setSelectedDriveId(drivesRes[0].id);
      }
      // Default to Rahul Sharma for counterfactual demo
      const rahul = studentsRes.find(s => s.name === "Rahul Sharma") || studentsRes[0];
      if (rahul) {
        setCfStudentId(rahul.id);
        setCfHypoDept(rahul.department);
      }
    } catch (err) {
      console.error("Failed to load drives or students", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAudit(driveId) {
    try {
      setLoading(true);
      const data = await api.getDriveFairnessAudit(driveId);
      setAuditData(data);
    } catch (err) {
      console.error("Failed to load audit", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunCounterfactual() {
    if (!cfStudentId || !selectedDriveId) return;
    try {
      setCfLoading(true);
      const res = await api.runCounterfactual({
        student_id: parseInt(cfStudentId),
        drive_id: parseInt(selectedDriveId),
        hypothetical_backlogs: parseInt(cfHypoBacklogs),
        hypothetical_department: cfHypoDept || undefined
      });
      setCfResult(res);
    } catch (err) {
      console.error("Counterfactual failed", err);
    } finally {
      setCfLoading(false);
    }
  }

  const selectedStudentObj = students.find(s => s.id === parseInt(cfStudentId));

  return (
    <div id="fairness-audit-container">
      {/* Header Banner */}
      <div className="hero-banner">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <span className="badge badge-cyan">
              {isEnterprise ? "STATUTORY COMPLIANCE ENGINE" : "CORE DIFFERENTIATOR #1"}
            </span>
            <span className="badge badge-indigo">
              {isEnterprise ? "US EEOC TITLE VII (4/5THS RULE) & EU AI ACT (ARTICLES 9 & 10)" : "EEOC 80% FOUR-FIFTHS RULE COMPLIANCE"}
            </span>
            {isEnterprise && (
              <span className="badge badge-emerald">
                UK EQUALITY ACT 2010 AUDITED
              </span>
            )}
          </div>
          <h2 className="hero-title">
            {isEnterprise ? "Global Regulatory AI Fairness & Disparate Impact Auditor" : "Fairness & Bias Audit Dashboard"}
          </h2>
          <p className="hero-subtitle">
            {isEnterprise
              ? "Statutory audit of enterprise promotions and internal talent matching across international hubs for adverse impact under US EEOC Title VII, EU AI Act High-Risk Employment AI mandates, and UK Equality standards."
              : "Audits institutional placement drives for systematic disparate impact across Backlog cohorts, Academic Departments, and Genders. Provides explainable counterfactual sensitivity simulations."}
          </p>
        </div>

        {/* Drive Selector */}
        <div style={{ minWidth: "320px" }}>
          <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Filter size={14} /> {isEnterprise ? "Select Requisition to Audit:" : "Select Placement Drive to Audit:"}
          </label>
          <select 
            id="fairness-drive-select"
            className="form-select"
            value={selectedDriveId || ""}
            onChange={(e) => setSelectedDriveId(e.target.value)}
            style={{ fontWeight: 600 }}
          >
            {drives.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id === 1 ? (isEnterprise ? "🚨 Requisition 1: London Hub (Tenure/Backlog Disparity)" : "🚨 Drive 1: Fintech Corp (Backlog Bias)") : 
                 d.id === 2 ? (isEnterprise ? "⚠️ Requisition 2: NeuralAI (Remote Hub Disparity)" : "⚠️ Drive 2: NeuralAI (Department Bias)") : 
                 (isEnterprise ? `✅ Requisition ${d.id}: ${d.company_name} (Statutory Compliant Baseline)` : `✅ Drive ${d.id}: ${d.company_name} (Fair Baseline)`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading || !auditData ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <RefreshCw className="animate-spin" size={32} style={{ margin: "0 auto 1rem", color: "var(--primary)" }} />
          <p style={{ color: "var(--text-muted)" }}>Running statistical disparity audits...</p>
        </div>
      ) : (
        <>
          {/* EEOC Rule Verdict Bar */}
          <div 
            className="glass-panel" 
            style={{ 
              padding: "1.5rem 2rem", 
              marginBottom: "1.75rem",
              borderColor: auditData.auditor_verdict === "SEVERE_DISPARATE_IMPACT" ? "rgba(244, 63, 94, 0.5)" : 
                           auditData.auditor_verdict === "MODERATE_BIAS_DETECTED" ? "rgba(245, 158, 11, 0.5)" : "rgba(16, 185, 129, 0.5)",
              background: auditData.auditor_verdict === "SEVERE_DISPARATE_IMPACT" ? "rgba(244, 63, 94, 0.08)" : 
                          auditData.auditor_verdict === "MODERATE_BIAS_DETECTED" ? "rgba(245, 158, 11, 0.08)" : "rgba(16, 185, 129, 0.08)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {auditData.auditor_verdict === "SEVERE_DISPARATE_IMPACT" ? (
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(244, 63, 94, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FB7185" }}>
                    <AlertTriangle size={24} />
                  </div>
                ) : auditData.auditor_verdict === "MODERATE_BIAS_DETECTED" ? (
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(245, 158, 11, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FBBF24" }}>
                    <AlertCircle size={24} />
                  </div>
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34D399" }}>
                    <CheckCircle size={24} />
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                    Auditor Verdict: {auditData.auditor_verdict.replace(/_/g, " ")}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Audited {auditData.total_applicants} applicants for <strong>{auditData.company_name}</strong> ({auditData.drive_title}) — Overall Shortlist Rate: {auditData.overall_shortlisting_rate}%
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>EEOC Standard</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent-cyan)" }}>≥ 0.80 Ratio</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Shortlisted</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main)" }}>{auditData.total_shortlisted} / {auditData.total_applicants}</div>
                </div>
              </div>
            </div>

            {/* Disparity Alerts List */}
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              {auditData.disparity_alerts.map((alert, idx) => (
                <div 
                  key={idx} 
                  id={`fairness-alert-${idx}`}
                  style={{ 
                    padding: "0.6rem 0.85rem", 
                    borderRadius: "var(--radius-sm)", 
                    background: "rgba(0, 0, 0, 0.25)", 
                    fontSize: "0.85rem", 
                    marginBottom: "0.4rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  {alert}
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Cohort Breakdown Grid */}
          <div className="grid-cols-2" style={{ marginBottom: "2rem" }}>
            {/* 1. Backlog Disparity Analysis */}
            <div className="glass-panel" style={{ padding: "1.75rem" }} id="backlog-disparity-panel">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <h4 style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Scale size={18} color="#F59E0B" /> Backlog Cohort Shortlisting Rates
                </h4>
                <span className="badge badge-amber">EEOC 80% Rule</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {auditData.backlog_disparity.map((item, idx) => (
                  <div key={idx} style={{ background: "rgba(255, 255, 255, 0.02)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <span style={{ fontWeight: 600 }}>{item.group_name} ({item.shortlisted_candidates}/{item.total_candidates})</span>
                      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                        <span style={{ fontWeight: 700 }}>{item.shortlisting_rate}%</span>
                        <span className={`badge ${item.violates_80_rule ? "badge-rose" : "badge-emerald"}`}>
                          DR: {item.disparity_ratio} {item.violates_80_rule ? "⚠️ VIOLATION" : "✅ PASS"}
                        </span>
                      </div>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${item.shortlisting_rate}%`, 
                          background: item.violates_80_rule ? "linear-gradient(90deg, #F43F5E, #E11D48)" : "linear-gradient(90deg, #10B981, #059669)" 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Department Disparity Analysis */}
            <div className="glass-panel" style={{ padding: "1.75rem" }} id="dept-disparity-panel">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <h4 style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <BarChart3 size={18} color="#06B6D4" /> Department Filter Disparity
                </h4>
                <span className="badge badge-cyan">Academic Parity</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {auditData.department_disparity.map((item, idx) => (
                  <div key={idx} style={{ background: "rgba(255, 255, 255, 0.02)", padding: "0.85rem 1rem", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <span style={{ fontWeight: 600 }}>{item.group_name} ({item.shortlisted_candidates}/{item.total_candidates})</span>
                      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                        <span style={{ fontWeight: 700 }}>{item.shortlisting_rate}%</span>
                        <span className={`badge ${item.violates_80_rule ? "badge-rose" : "badge-emerald"}`}>
                          DR: {item.disparity_ratio} {item.violates_80_rule ? "⚠️ BIAS" : "PASS"}
                        </span>
                      </div>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${item.shortlisting_rate}%`, 
                          background: item.violates_80_rule ? "linear-gradient(90deg, #FB7185, #F43F5E)" : "linear-gradient(90deg, #06B6D4, #0284C7)" 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Differentiator 1 Interactive Feature: Counterfactual Sandbox */}
          <div className="glass-panel" style={{ padding: "2rem", border: "1px solid rgba(99, 102, 241, 0.4)" }} id="counterfactual-sandbox">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <span className="badge badge-indigo">RESEARCH EXTENSION (3B)</span>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Counterfactual Fairness Sensitivity Simulator</h3>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  Simulate: <em>"If this student's department or backlog count were different, would their rank or shortlisting decision change?"</em> Holds all skills and projects strictly invariant.
                </p>
              </div>
            </div>

            <div className="grid-cols-3" style={{ marginBottom: "1.5rem" }}>
              <div>
                <label className="form-label">Select Candidate:</label>
                <select 
                  id="cf-student-select"
                  className="form-select"
                  value={cfStudentId}
                  onChange={(e) => {
                    setCfStudentId(e.target.value);
                    const st = students.find(s => s.id === parseInt(e.target.value));
                    if (st) setCfHypoDept(st.department);
                  }}
                >
                  {students.slice(0, 20).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department}, Backlogs: {s.backlog_count}, CGPA: {s.cgpa})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Hypothetical Backlog Count:</label>
                <select 
                  id="cf-backlog-select"
                  className="form-select"
                  value={cfHypoBacklogs}
                  onChange={(e) => setCfHypoBacklogs(e.target.value)}
                >
                  <option value={0}>0 Backlogs (Clear)</option>
                  <option value={1}>1 Backlog</option>
                  <option value={2}>2 Backlogs</option>
                </select>
              </div>

              <div>
                <label className="form-label">Hypothetical Department:</label>
                <select 
                  id="cf-dept-select"
                  className="form-select"
                  value={cfHypoDept}
                  onChange={(e) => setCfHypoDept(e.target.value)}
                >
                  <option value="CSE">CSE (Computer Science)</option>
                  <option value="IT">IT (Information Tech)</option>
                  <option value="ECE">ECE (Electronics)</option>
                  <option value="MECH">MECH (Mechanical)</option>
                  <option value="CIVIL">CIVIL (Civil)</option>
                </select>
              </div>
            </div>

            <button 
              id="btn-run-counterfactual"
              className="btn btn-primary"
              onClick={handleRunCounterfactual}
              disabled={cfLoading}
              style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem" }}
            >
              {cfLoading ? "Simulating Counterfactual Perturbation..." : "Run Counterfactual Fairness Simulation →"}
            </button>

            {/* Counterfactual Results Display */}
            {cfResult && (
              <div 
                id="cf-result-card"
                style={{ 
                  marginTop: "1.5rem", 
                  padding: "1.5rem", 
                  borderRadius: "var(--radius-lg)", 
                  background: "rgba(15, 23, 42, 0.9)", 
                  border: "1px solid rgba(255, 255, 255, 0.12)" 
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1rem" }}>
                  <div style={{ background: "rgba(244, 63, 94, 0.08)", padding: "1.2rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#FB7185", fontWeight: 700 }}>Original Baseline Profile</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: "0.3rem" }}>{cfResult.student_name}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                      Dept: <strong>{cfResult.original_department}</strong> | Backlogs: <strong>{cfResult.original_backlogs}</strong>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem" }}>
                      <div>Match Score: <strong>{cfResult.original_score}%</strong></div>
                      <div>Rank: <strong>#{cfResult.original_rank}</strong></div>
                      <div>Status: <span className={cfResult.original_shortlisted ? "badge badge-emerald" : "badge badge-rose"}>{cfResult.original_shortlisted ? "SHORTLISTED" : "REJECTED"}</span></div>
                    </div>
                  </div>

                  <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "1.2rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#34D399", fontWeight: 700 }}>Counterfactual Simulated Profile</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: "0.3rem" }}>{cfResult.student_name} (Perturbed)</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                      Dept: <strong>{cfResult.hypothetical_department}</strong> | Backlogs: <strong>{cfResult.hypothetical_backlogs}</strong>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem" }}>
                      <div>Match Score: <strong>{cfResult.hypothetical_score}%</strong></div>
                      <div>Rank: <strong>#{cfResult.hypothetical_rank}</strong></div>
                      <div>Status: <span className={cfResult.hypothetical_shortlisted ? "badge badge-emerald" : "badge badge-rose"}>{cfResult.hypothetical_shortlisted ? "SHORTLISTED" : "REJECTED"}</span></div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "0.85rem 1.2rem", borderRadius: "var(--radius-sm)", background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", fontSize: "0.9rem", color: "#E0E7FF" }}>
                  <strong>Fairness Diagnostic:</strong> {cfResult.bias_detected_message}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
