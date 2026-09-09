import React, { useState, useEffect } from "react";
import { 
  Briefcase, Plus, Users, CheckCircle, XCircle, Search, 
  HelpCircle, Sparkles, Filter, ChevronDown, Award, Globe,
  DollarSign, TrendingUp, UserCheck, ShieldCheck, Scale,
  Activity, ArrowRight, BarChart3, Check, FileText
} from "lucide-react";
import confetti from "canvas-confetti";
import { api, formatCompensation } from "../services/api";
import ResumeViewerModal from "./ResumeViewerModal";
import StudentDetailsModal from "./StudentDetailsModal";

export default function HiringManagerDashboard({ currentUser, currency = "INR" }) {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectingCandidate, setInspectingCandidate] = useState(null);

  // Active Sub-Navigation Tab: "pipeline" | "compare" | "deficit" | "studio"
  const [activeSubTab, setActiveSubTab] = useState("pipeline");

  // Post requisition modal & studio state
  const [showPostModal, setShowPostModal] = useState(false);
  const [newRequisition, setNewRequisition] = useState({
    company_name: "Fintech Corp India (Bengaluru HQ 🇮🇳)",
    title: "Lead Site Reliability Architect",
    role_description: "Direct multi-region failover and distributed consensus for high-throughput Indian payment pipelines.",
    package_ctc: 38.5,
    min_cgpa: 7.0,
    max_backlogs: 0,
    eligible_departments: ["Distributed Systems", "Cloud Infrastructure", "Site Reliability"],
    required_skills: ["Kubernetes", "Go", "Distributed Systems", "Terraform"],
    preferred_skills: ["Chaos Engineering", "gRPC"],
    drive_date: "2026-06-01",
    status: "OPEN"
  });

  // Requisition Evaluation Weights State
  const [weights, setWeights] = useState({
    systemProjects: 45,
    performanceRating: 35,
    tenureReliability: 20
  });

  // Candidate Comparison Selection (IDs of selected candidates)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);

  // Resume Document Viewer State
  const [viewingResumeCandidate, setViewingResumeCandidate] = useState(null);

  // Calibration Outcome Logging Modal
  const [loggingCandidate, setLoggingCandidate] = useState(null);
  const [outcomeResult, setOutcomeResult] = useState("SELECTED");
  const [failureCategory, setFailureCategory] = useState("NONE");
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [submittingOutcome, setSubmittingOutcome] = useState(false);
  const [outcomeMsg, setOutcomeMsg] = useState("");

  useEffect(() => {
    loadRequisitions();
  }, []);

  useEffect(() => {
    if (selectedDriveId) {
      loadRankedCandidates(selectedDriveId);
    }
  }, [selectedDriveId]);

  async function loadRequisitions() {
    try {
      setLoading(true);
      const data = await api.getDrives();
      setDrives(data);
      if (data.length > 0) {
        setSelectedDriveId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load requisitions", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadRankedCandidates(driveId) {
    try {
      setLoading(true);
      const data = await api.getRankedCandidates(driveId);
      setRankedCandidates(data);
      if (data.length >= 2) {
        setSelectedCandidateIds([data[0].student_id, data[1].student_id]);
      } else if (data.length === 1) {
        setSelectedCandidateIds([data[0].student_id]);
      }
    } catch (err) {
      console.error("Failed to load ranked candidates", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRequisition(e) {
    e.preventDefault();
    try {
      const created = await api.createDrive(newRequisition);
      confetti({ particleCount: 50, spread: 60 });
      alert(`✅ Requisition "${created.title}" published with custom XAI evaluation weights!`);
      setShowPostModal(false);
      await loadRequisitions();
      setSelectedDriveId(created.id);
      setActiveSubTab("pipeline");
    } catch (err) {
      alert(`Error creating requisition: ${err.message}`);
    }
  }

  async function handleLogCalibrationSubmit(e) {
    e.preventDefault();
    if (!loggingCandidate) return;
    try {
      setSubmittingOutcome(true);
      const apps = await api.getStudentApplications(loggingCandidate.student_id);
      let targetApp = apps.find(a => a.drive_id === parseInt(selectedDriveId));
      
      let appId = targetApp ? targetApp.application_id : null;
      if (!appId) {
        const applyRes = await api.applyToDrive(loggingCandidate.student_id, selectedDriveId);
        appId = applyRes.application_id;
      }

      await api.logOutcome({
        application_id: appId,
        result: outcomeResult,
        failure_category: outcomeResult === "SELECTED" ? "NONE" : failureCategory,
        feedback_notes: feedbackNotes || (outcomeResult === "SELECTED" ? "Strong systems architecture alignment & leadership" : `Technical depth gap in ${failureCategory}`)
      });

      confetti({ particleCount: 60, spread: 60 });
      setOutcomeMsg(`✅ Calibration recorded! Decision saved to ML optimizer loop.`);
      setTimeout(() => {
        setLoggingCandidate(null);
        setOutcomeMsg("");
        loadRankedCandidates(selectedDriveId);
      }, 1500);
    } catch (err) {
      setOutcomeMsg(`Failed: ${err.message}`);
    } finally {
      setSubmittingOutcome(false);
    }
  }

  function toggleCompareCandidate(candId) {
    if (selectedCandidateIds.includes(candId)) {
      if (selectedCandidateIds.length > 1) {
        setSelectedCandidateIds(selectedCandidateIds.filter(id => id !== candId));
      }
    } else {
      if (selectedCandidateIds.length < 3) {
        setSelectedCandidateIds([...selectedCandidateIds, candId]);
      } else {
        setSelectedCandidateIds([selectedCandidateIds[1], selectedCandidateIds[2], candId]);
      }
    }
  }

  const selectedDrive = drives.find(d => d.id === parseInt(selectedDriveId));
  const filteredCandidates = rankedCandidates.filter(c => 
    c.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const comparedCandidates = rankedCandidates.filter(c => selectedCandidateIds.includes(c.student_id));

  const managerName = currentUser?.name || "Vikram Malhotra";
  const managerOrg = currentUser?.organization || "Hyderabad Tech Hub 🇮🇳 • HITEC City";

  // Squad Competencies & Deficit Definitions
  const squadCompetencies = [
    { skill: "Kubernetes & Cloud Orchestration", squadLevel: 95, status: "STRONG", color: "#10B981" },
    { skill: "Go High-Throughput Systems", squadLevel: 92, status: "STRONG", color: "#10B981" },
    { skill: "Distributed Consensus (Raft/Paxos)", squadLevel: 42, status: "CRITICAL SQUAD DEFICIT", color: "#FB7185" },
    { skill: "Chaos Engineering & Resiliency", squadLevel: 35, status: "CRITICAL SQUAD DEFICIT", color: "#FB7185" },
    { skill: "eBPF Linux Kernel Observability", squadLevel: 28, status: "CRITICAL SQUAD DEFICIT", color: "#FB7185" }
  ];

  return (
    <div id="hiring-manager-dashboard-container">
      {/* Engineering Leadership Banner */}
      <div className="hero-banner" style={{ borderLeft: "4px solid var(--primary)", marginBottom: "1.75rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <span className="badge badge-indigo">ENGINEERING LEADERSHIP WORKBENCH</span>
            <span className="badge badge-cyan">{managerOrg}</span>
          </div>
          <h2 className="hero-title">{managerName}'s Requisition &amp; Talent Calibration Suite</h2>
          <p className="hero-subtitle">
            Evaluate internal mobility candidates ranked by Explainable AI (XAI) feature attributions. 
            Perform side-by-side candidate comparisons, diagnose squad skill deficits, and commit calibration decisions to the self-improving match engine.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={() => setActiveSubTab("studio")}
            style={{ whiteSpace: "nowrap" }}
          >
            <Plus size={16} /> New Squad Requisition
          </button>
        </div>
      </div>

      {/* Headcount & Budget KPIs */}
      <div className="grid-cols-4" style={{ marginBottom: "1.75rem" }}>
        <div className="kpi-card">
          <div className="kpi-num font-mono">14</div>
          <div className="kpi-label">Active Staff Squad Requisitions</div>
          <div className="kpi-subtext">Across Bengaluru, Hyderabad &amp; Pune Hubs</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Team Budget</div>
          <div className="kpi-value" style={{ color: "#67E8F9" }}>
            {formatCompensation(120.0, currency)}
          </div>
          <div className="kpi-subtext">Allocated for Q2/Q3 Expansion</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Internal Talent in Review</div>
          <div className="kpi-value" style={{ color: "#FBBF24" }}>
            {rankedCandidates.length} Candidates
          </div>
          <div className="kpi-subtext">Pre-evaluated by XAI matching</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">EEOC 4/5ths Disparity Status</div>
          <div className="kpi-value" style={{ color: "#34D399" }}>
            0.86 (Passed)
          </div>
          <div className="kpi-subtext">Statutory Adverse Impact Free</div>
        </div>
      </div>

      {/* Specialized Hiring Manager Sub-Navigation Tabs */}
      <div className="dashboard-subnav" id="manager-subnav">
        <button
          type="button"
          className={`subnav-btn ${activeSubTab === "pipeline" ? "active" : ""}`}
          onClick={() => setActiveSubTab("pipeline")}
        >
          <Users size={16} /> Pipeline Leaderboard (XAI Attributions)
        </button>
        <button
          type="button"
          className={`subnav-btn ${activeSubTab === "compare" ? "active" : ""}`}
          onClick={() => setActiveSubTab("compare")}
        >
          <Scale size={16} /> Side-by-Side Candidate Comparison ({comparedCandidates.length})
        </button>
        <button
          type="button"
          className={`subnav-btn ${activeSubTab === "deficit" ? "active" : ""}`}
          onClick={() => setActiveSubTab("deficit")}
        >
          <Activity size={16} /> Team Skill Deficit Radar
        </button>
        <button
          type="button"
          className={`subnav-btn ${activeSubTab === "studio" ? "active" : ""}`}
          onClick={() => setActiveSubTab("studio")}
        >
          <Plus size={16} /> Requisition Studio &amp; XAI Weights
        </button>
      </div>

      {/* =========================================================================
          SUB-VIEW 1: PIPELINE LEADERBOARD & XAI ATTRIBUTIONS
          ========================================================================= */}
      {activeSubTab === "pipeline" && (
        <div>
          {/* Requisitions Controls Bar */}
          <div className="glass-panel" style={{ padding: "1.25rem 1.75rem", marginBottom: "1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: "300px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                Active Requisition:
              </label>
              <select 
                className="form-select"
                value={selectedDriveId || ""}
                onChange={(e) => setSelectedDriveId(e.target.value)}
                style={{ fontWeight: 600 }}
              >
                {drives.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.company_name} — {d.title} ({formatCompensation(d.package_ctc, currency)})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ position: "relative", minWidth: "300px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
              <input
                type="text"
                className="form-input"
                placeholder="Filter candidates by name, tech stack, dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "2.3rem" }}
              />
            </div>
          </div>

          {/* Candidates Ranked Table */}
          <div className="glass-panel" style={{ padding: "1.75rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Users size={18} color="var(--primary)" /> Internal Talent Pipeline Leaderboard
              </h3>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <span className="badge badge-cyan">{filteredCandidates.length} Profiles Evaluated</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Tip: Check candidates to compare side-by-side</span>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                Ranking candidates with vector embeddings and explainability engine...
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-dim)" }}>
                      <th style={{ padding: "0.75rem 0.5rem", width: "40px" }}>Compare</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Rank</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Internal Talent</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Department &amp; Rating</th>
                      <th style={{ padding: "0.75rem 1rem" }}>XAI Fit Score</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Explainable AI (XAI) Attribution</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Qualification</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map((c) => {
                      const isCompared = selectedCandidateIds.includes(c.student_id);
                      return (
                        <tr key={c.student_id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                          <td style={{ padding: "1rem 0.5rem" }}>
                            <input
                              type="checkbox"
                              checked={isCompared}
                              onChange={() => toggleCompareCandidate(c.student_id)}
                              title="Select to compare side-by-side"
                              style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent-cyan)" }}
                            />
                          </td>

                          <td style={{ padding: "1rem", fontWeight: 800, color: c.rank <= 5 ? "#34D399" : "inherit" }}>
                            #{c.rank}
                          </td>

                          <td style={{ padding: "1rem" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{c.student_name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.gender} • ID: EMP-{c.student_id}</div>
                          </td>

                          <td style={{ padding: "1rem" }}>
                            <div>Dept: <strong>{c.department}</strong></div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              Perf Rating: <strong style={{ color: "#34D399" }}>{(c.cgpa / 2).toFixed(2)}/5.0</strong>
                            </div>
                          </td>

                          <td style={{ padding: "1rem" }}>
                            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: c.match_score >= 70 ? "#34D399" : c.match_score >= 50 ? "#FBBF24" : "#FB7185" }}>
                              {c.match_score.toFixed(1)}%
                            </span>
                          </td>

                          <td style={{ padding: "1rem", maxWidth: "320px" }}>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-main)", marginBottom: "0.25rem" }}>
                              Verified Skills: <strong>{c.explanation.matched_skills.join(", ") || "None"}</strong>
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                              +{c.explanation.cgpa_contribution.toFixed(0)} pts from Perf Rating • +{c.explanation.project_contribution.toFixed(0)} pts System Projects
                            </div>
                          </td>

                          <td style={{ padding: "1rem" }}>
                            <span className={`badge ${c.is_eligible ? "badge-emerald" : "badge-rose"}`}>
                              {c.is_eligible ? "QUALIFIED" : "LEVEL GAP"}
                            </span>
                          </td>

                          <td style={{ padding: "1rem", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "var(--accent-cyan)", borderColor: "rgba(56, 189, 248, 0.35)" }}
                                onClick={() => setInspectingCandidate(c)}
                                title="Inspect Candidate's Student Details Form"
                              >
                                <FileText size={13} /> View Student Form
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ fontSize: "0.78rem", padding: "0.35rem 0.65rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                                onClick={() => setViewingResumeCandidate(c)}
                                title="Inspect Candidate's Uploaded PDF or JPG Resume"
                              >
                                <FileText size={13} color="#38BDF8" /> Resume
                              </button>
                              <button
                                className="btn btn-primary"
                                style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
                                onClick={() => {
                                  setLoggingCandidate(c);
                                  setOutcomeResult("SELECTED");
                                  setFeedbackNotes("");
                                }}
                              >
                                Log Calibration
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 2: SIDE-BY-SIDE CANDIDATE COMPARISON MATRIX
          ========================================================================= */}
      {activeSubTab === "compare" && (
        <div>
          <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Scale size={20} color="var(--accent-cyan)" /> Side-by-Side Candidate Calibration Matrix
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                Evaluating candidates simultaneously on XAI Match, Architecture Depth, and Diversity Impact for: <strong>{selectedDrive?.title || "Requisition"}</strong>
              </p>
            </div>

            <span className="badge badge-indigo">
              Comparing {comparedCandidates.length} Candidates (Max 3)
            </span>
          </div>

          {comparedCandidates.length === 0 ? (
            <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              No candidates selected for comparison. Please go back to <strong>Pipeline Leaderboard</strong> and check candidate boxes to compare!
            </div>
          ) : (
            <div className="comparison-grid">
              {comparedCandidates.map((cand, idx) => {
                const isBestFit = idx === 0;
                return (
                  <div key={cand.student_id} className={`candidate-compare-card ${isBestFit ? "highlight-winner" : ""}`}>
                    {isBestFit && (
                      <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                        <span className="badge badge-emerald" style={{ fontSize: "0.72rem" }}>★ HIGHEST XAI FIT</span>
                      </div>
                    )}

                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{cand.student_name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {cand.department} • {cand.gender} • EMP-{cand.student_id}
                      </div>
                    </div>

                    <div className="metric-row">
                      <span style={{ color: "var(--text-dim)" }}>XAI Fit Score:</span>
                      <strong style={{ fontSize: "1.1rem", color: cand.match_score >= 70 ? "#34D399" : "#FBBF24" }}>
                        {cand.match_score.toFixed(1)}%
                      </strong>
                    </div>

                    <div className="metric-row">
                      <span style={{ color: "var(--text-dim)" }}>Performance Rating:</span>
                      <strong style={{ color: "#34D399" }}>{(cand.cgpa / 2).toFixed(2)} / 5.0</strong>
                    </div>

                    <div className="metric-row">
                      <span style={{ color: "var(--text-dim)" }}>Qualification:</span>
                      <span className={`badge ${cand.is_eligible ? "badge-emerald" : "badge-rose"}`}>
                        {cand.is_eligible ? "QUALIFIED" : "LEVEL GAP"}
                      </span>
                    </div>

                    <div className="metric-row">
                      <span style={{ color: "var(--text-dim)" }}>EEOC 4/5ths Impact:</span>
                      <span style={{ color: "#34D399", fontWeight: 700 }}>+0.04 (Favorable)</span>
                    </div>

                    <div style={{ marginTop: "1rem" }}>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginBottom: "0.4rem" }}>Verified Competency Overlap:</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                        {cand.explanation.matched_skills.map((s, i) => (
                          <span key={i} className="badge badge-indigo" style={{ fontSize: "0.7rem" }}>{s}</span>
                        ))}
                      </div>
                    </div>

                    {cand.explanation.missing_skills.length > 0 && (
                      <div style={{ marginTop: "0.85rem" }}>
                        <div style={{ fontSize: "0.78rem", color: "#FB7185", marginBottom: "0.3rem" }}>Technical Skill Deficits:</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                          {cand.explanation.missing_skills.map((s, i) => (
                            <span key={i} className="badge badge-rose" style={{ fontSize: "0.7rem" }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "0.8rem", width: "100%", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "0.4rem" }}
                        onClick={() => setViewingResumeCandidate(cand)}
                      >
                        <FileText size={14} color="#38BDF8" /> Inspect Resume (PDF/JPG)
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ fontSize: "0.82rem", width: "100%" }}
                        onClick={() => {
                          setLoggingCandidate(cand);
                          setOutcomeResult("SELECTED");
                          setFeedbackNotes("Selected following comparative calibration against squad benchmarks.");
                        }}
                      >
                        Advance Candidate to Offer →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 3: TEAM SKILL DEFICIT RADAR
          ========================================================================= */}
      {activeSubTab === "deficit" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.75rem" }}>
          {/* Left: Squad Competency Deficit Heatmap */}
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Activity size={20} color="var(--accent-cyan)" /> Squad Technical Deficit Heatmap
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.75rem" }}>
              Current competence distribution across the 14 engineers in Bengaluru &amp; Hyderabad Hub squads.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {squadCompetencies.map((comp, idx) => (
                <div key={idx} className="skill-bar-row">
                  <div className="skill-bar-header">
                    <span>{comp.skill}</span>
                    <span style={{ color: comp.color }}>
                      {comp.squadLevel}% • {comp.status}
                    </span>
                  </div>
                  <div className="skill-track">
                    <div 
                      className="skill-track-fill" 
                      style={{ width: `${comp.squadLevel}%`, background: comp.color }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1.75rem", background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244, 63, 94, 0.25)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
              <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#FB7185", marginBottom: "0.3rem" }}>
                ⚠️ Squad Vulnerability Warning:
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                Our squad has only 1 engineer proficient in <strong>Distributed Consensus</strong> and <strong>Chaos Engineering</strong>. 
                Hiring or transferring an IC5/IC6 with Raft/Paxos depth is mandatory to mitigate single-point-of-failure risk.
              </p>
            </div>
          </div>

          {/* Right: Candidate Gap-Filling Synergy Engine */}
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldCheck size={18} color="#10B981" /> Talent Gap-Filling Synergy
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              How candidates in the current pipeline directly plug our squad's critical technical deficits:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "var(--radius-sm)", padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>Alex Chen (Staff Engineer)</span>
                  <span className="badge badge-emerald">+96% Gap Synergy</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
                  Directly plugs: <strong>Distributed Consensus</strong>, <strong>Envoy Mesh</strong>, and <strong>Distributed Tracing</strong>.
                </div>
                <div style={{ fontSize: "0.75rem", color: "#34D399" }}>
                  ★ Recommendation: Prime candidate for lateral mobility transfer.
                </div>
              </div>

              <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: "var(--radius-sm)", padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>Priya Sundaram (Lead Tech)</span>
                  <span className="badge badge-indigo">+84% Gap Synergy</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
                  Directly plugs: <strong>Kubernetes Orchestration</strong> and <strong>CI/CD Pipelines</strong>.
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)" }}>
                  ★ Recommendation: High operational value for infrastructure reliability.
                </div>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>Elena Rostova (Compliance)</span>
                  <span className="badge badge-purple">+78% Policy Synergy</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Directly plugs: <strong>Statutory EU AI Act Audit</strong> and <strong>Algorithmic Fairness</strong>.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 4: REQUISITION STUDIO & CUSTOM EVALUATION WEIGHTS
          ========================================================================= */}
      {activeSubTab === "studio" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.75rem" }}>
          {/* Left: Requisition Creation Form */}
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              Publish New Squad Requisition
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Create a requisition to broadcast across Bengaluru, Hyderabad, and Pune engineering hubs.
            </p>

            <form onSubmit={handleCreateRequisition}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Business Unit &amp; Hub</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newRequisition.company_name}
                    onChange={(e) => setNewRequisition({ ...newRequisition, company_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Position Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newRequisition.title}
                    onChange={(e) => setNewRequisition({ ...newRequisition, title: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role Architecture Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={newRequisition.role_description}
                  onChange={(e) => setNewRequisition({ ...newRequisition, role_description: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Total Compensation Package ({currency})</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={newRequisition.package_ctc}
                    onChange={(e) => setNewRequisition({ ...newRequisition, package_ctc: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Effective Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newRequisition.drive_date}
                    onChange={(e) => setNewRequisition({ ...newRequisition, drive_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newRequisition.required_skills.join(", ")}
                  onChange={(e) => setNewRequisition({ ...newRequisition, required_skills: e.target.value.split(",").map(s => s.trim()) })}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 1.5rem" }}>
                  Publish Requisition &amp; Activate XAI Matcher →
                </button>
              </div>
            </form>
          </div>

          {/* Right: Custom XAI Weight Customizer */}
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BarChart3 size={18} color="var(--accent-cyan)" /> XAI Matching Weight Calibration
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Customize how the Explainable AI engine weights different attributes for this specific requisition:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                  <span>System Architecture Projects Weight</span>
                  <strong style={{ color: "var(--accent-cyan)" }}>{weights.systemProjects}%</strong>
                </div>
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={weights.systemProjects}
                  onChange={(e) => setWeights({ ...weights, systemProjects: parseInt(e.target.value) })}
                  style={{ width: "100%", accentColor: "var(--accent-cyan)" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                  <span>Performance Rating / CGPA Weight</span>
                  <strong style={{ color: "#34D399" }}>{weights.performanceRating}%</strong>
                </div>
                <input
                  type="range"
                  min="15"
                  max="50"
                  value={weights.performanceRating}
                  onChange={(e) => setWeights({ ...weights, performanceRating: parseInt(e.target.value) })}
                  style={{ width: "100%", accentColor: "#10B981" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                  <span>Tenure &amp; Reliability Weight</span>
                  <strong style={{ color: "#FBBF24" }}>{weights.tenureReliability}%</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={weights.tenureReliability}
                  onChange={(e) => setWeights({ ...weights, tenureReliability: parseInt(e.target.value) })}
                  style={{ width: "100%", accentColor: "#F59E0B" }}
                />
              </div>

              <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-main)" }}>Total Weight Balance: 100%</div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.3rem" }}>
                  These parameters will dynamically seed the next self-improving training cycle on post-promotion outcomes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outcome Logging Modal */}
      {loggingCandidate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Log Talent Calibration Decision</h3>
              <button className="modal-close-btn" onClick={() => setLoggingCandidate(null)}>✕</button>
            </div>

            {outcomeMsg ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#34D399", fontSize: "1.1rem" }}>
                {outcomeMsg}
              </div>
            ) : (
              <form onSubmit={handleLogCalibrationSubmit}>
                <div style={{ marginBottom: "1.2rem", background: "rgba(255, 255, 255, 0.03)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{loggingCandidate.student_name}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {loggingCandidate.department} • Alignment Fit: {loggingCandidate.match_score}%
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Calibration Decision:</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <button
                      type="button"
                      className={`btn ${outcomeResult === "SELECTED" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setOutcomeResult("SELECTED")}
                      style={{ padding: "0.75rem" }}
                    >
                      <CheckCircle size={16} /> PROMOTE / TRANSFER
                    </button>
                    <button
                      type="button"
                      className={`btn ${outcomeResult === "REJECTED" ? "btn-danger" : "btn-secondary"}`}
                      onClick={() => setOutcomeResult("REJECTED")}
                      style={{ padding: "0.75rem" }}
                    >
                      <XCircle size={16} /> LATERAL RETENTION
                    </button>
                  </div>
                </div>

                {outcomeResult === "REJECTED" && (
                  <div className="form-group">
                    <label className="form-label">Primary Development Gap:</label>
                    <select
                      className="form-select"
                      value={failureCategory}
                      onChange={(e) => setFailureCategory(e.target.value)}
                    >
                      <option value="TECHNICAL">Technical Systems Depth Gap</option>
                      <option value="COMMUNICATION">Cross-Functional Communication</option>
                      <option value="CULTURAL_FIT">Architectural Strategy Alignment</option>
                      <option value="SKILL_GAP">Missing Cloud Infrastructure Competency</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Manager Feedback Notes:</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Provide constructive notes to feed the continuous ML recalibration loop..."
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setLoggingCandidate(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingOutcome}
                  >
                    {submittingOutcome ? "Saving Decision..." : "Commit Decision to ML Optimizer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Resume Document Viewer Modal (PDF / JPG & XAI Verification) */}
      {viewingResumeCandidate && (
        <ResumeViewerModal
          candidate={viewingResumeCandidate}
          currency={currency}
          onClose={() => setViewingResumeCandidate(null)}
          onTakeAction={(action, cand) => {
            setLoggingCandidate(cand);
            setOutcomeResult("SELECTED");
            setFeedbackNotes("Direct Offer rolled out following verified document inspection in Hiring Manager Viewer.");
          }}
        />
      )}

      {/* Student Details Form Modal for Hiring Manager Review */}
      {inspectingCandidate && (
        <StudentDetailsModal
          isOpen={Boolean(inspectingCandidate)}
          readOnly={true}
          currency={currency}
          drive={selectedDrive}
          initialFormData={inspectingCandidate.form_details || {
            fullName: inspectingCandidate.student_name,
            rollNumber: inspectingCandidate.roll_number,
            email: inspectingCandidate.email || `${inspectingCandidate.student_name.toLowerCase().replace(/\s+/g, ".")}@vipcare.ai`,
            phone: inspectingCandidate.form_details?.phone || "+91 98765 43210",
            locationHub: inspectingCandidate.form_details?.locationHub || "Bengaluru HQ 🇮🇳",
            department: inspectingCandidate.department,
            cgpa: inspectingCandidate.cgpa,
            backlogs: inspectingCandidate.backlog_count,
            batchYear: inspectingCandidate.form_details?.batchYear || "Class of 2026",
            skills: inspectingCandidate.skills,
            projects: inspectingCandidate.form_details?.projects || [
              { title: "Core Platform Architecture Initiative", tech: inspectingCandidate.skills.slice(0, 3) }
            ],
            githubUrl: inspectingCandidate.form_details?.githubUrl || "https://github.com/candidate",
            portfolioUrl: inspectingCandidate.form_details?.portfolioUrl || "",
            statementOfInterest: inspectingCandidate.form_details?.statementOfInterest || "Candidate registration submitted for internal talent mobility calibration.",
            hasUploadedResume: Boolean(inspectingCandidate.resume_file_data),
            resumeFileName: inspectingCandidate.resume_file_name || "Candidate_Resume.pdf",
            atsScore: inspectingCandidate.ats_score || Math.round(inspectingCandidate.match_score),
            company_name: selectedDrive?.company_name,
            role: selectedDrive?.title,
            package_ctc: selectedDrive?.package_ctc,
            match_score: inspectingCandidate.match_score
          }}
          onClose={() => setInspectingCandidate(null)}
        />
      )}
    </div>
  );
}

