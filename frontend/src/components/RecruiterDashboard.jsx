import React, { useState, useEffect, useCallback } from "react";
import { 
  Briefcase, Plus, Users, CheckCircle, XCircle, Search, 
  HelpCircle, Sparkles, Filter, ChevronDown, Award, FileText, Eye, FileCheck, RefreshCw
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../services/api";
import StudentDetailsModal from "./StudentDetailsModal";
import ResumeViewerModal from "./ResumeViewerModal";

export default function RecruiterDashboard({ currentUser }) {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Post drive modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [newDrive, setNewDrive] = useState({
    company_name: "Fintech Corp Global",
    title: "Backend Platform Engineer",
    role_description: "Build robust distributed payment APIs with Go/Python and Docker.",
    package_ctc: 22.0,
    min_cgpa: 7.0,
    max_backlogs: 0,
    eligible_departments: ["CSE", "IT", "ECE"],
    required_skills: ["Python", "SQL", "Docker"],
    preferred_skills: ["System Design", "Redis"],
    drive_date: "2026-05-15",
    status: "OPEN"
  });

  // Outcome Logging Modal
  const [loggingCandidate, setLoggingCandidate] = useState(null);
  const [outcomeResult, setOutcomeResult] = useState("SELECTED");
  const [failureCategory, setFailureCategory] = useState("NONE");
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [submittingOutcome, setSubmittingOutcome] = useState(false);
  const [outcomeMsg, setOutcomeMsg] = useState("");

  // Inspecting candidate student details & resume
  const [inspectingCandidate, setInspectingCandidate] = useState(null);
  const [previewingResumeCandidate, setPreviewingResumeCandidate] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Define loadDrives BEFORE the useEffect that references it
  const loadDrives = useCallback(async (forceSelectNewest = false) => {
    try {
      setRefreshing(true);
      const data = await api.getDrives();
      setDrives(data);
      setLastRefreshed(new Date());
      if (data.length > 0) {
        setSelectedDriveId(prev => {
          if (!prev || forceSelectNewest) return data[0].id;
          const stillExists = data.find(d => d.id === parseInt(prev));
          return stillExists ? prev : data[0].id;
        });
      }
    } catch (err) {
      console.error("Failed to load drives", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDrives();
    // Auto-refresh drives every 30 seconds so newly registered companies appear
    const interval = setInterval(() => loadDrives(), 30000);
    return () => clearInterval(interval);
  }, [loadDrives]);

  useEffect(() => {
    if (selectedDriveId) {
      loadRankedCandidates(selectedDriveId);
    }
  }, [selectedDriveId]);

  async function loadRankedCandidates(driveId) {
    try {
      setLoading(true);
      const data = await api.getRankedCandidates(driveId);
      setRankedCandidates(data);
    } catch (err) {
      console.error("Failed to load ranked candidates", err);
    } finally {
      setLoading(false);
    }
  }


  async function handleCreateDrive(e) {
    e.preventDefault();
    try {
      const created = await api.createDrive(newDrive);
      confetti({ particleCount: 40, spread: 50 });
      setShowPostModal(false);
      await loadDrives(true); // force-select newest drive
    } catch (err) {
      alert(`Error creating drive: ${err.message}`);
    }
  }

  async function handleLogOutcomeSubmit(e) {
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
        feedback_notes: feedbackNotes || (outcomeResult === "SELECTED" ? "Strong algorithmic foundation & technical depth" : `Candidate rejected in ${failureCategory} evaluation`)
      });

      confetti({ particleCount: 60, spread: 60 });
      setOutcomeMsg(`✅ Outcome recorded! Candidate marked as ${outcomeResult}. Model weights will recalibrate on next retrain cycle.`);
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

  const selectedDrive = drives.find(d => d.id === parseInt(selectedDriveId));
  const filteredCandidates = rankedCandidates.filter(c => 
    c.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const recruiterName = currentUser?.name || "Priya Sundaram";

  return (
    <div id="recruiter-dashboard-container">
      {/* Top Header */}
      <div className="hero-banner">
        <div>
          <span className="badge badge-indigo" style={{ marginBottom: "0.4rem" }}>CAMPUS RECRUITER PORTAL</span>
          <h2 className="hero-title">{recruiterName}'s Candidate Evaluation & Outcome Logger</h2>
          <p className="hero-subtitle">
            Review graduating students ranked by the Explainable AI (XAI) matching engine.
            Log real interview decisions (*Selected / Rejected / Technical Gap*) to continuously train the self-improving model.
          </p>
          {lastRefreshed && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.3rem" }}>
              🕐 Last updated: {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              &nbsp;•&nbsp; {drives.length} drive{drives.length !== 1 ? "s" : ""} available &nbsp;•&nbsp; Auto-refreshes every 30s
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => loadDrives(true)}
            disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={() => setShowPostModal(true)}
            style={{ whiteSpace: "nowrap" }}
          >
            <Plus size={16} /> Post Campus Drive
          </button>
        </div>
      </div>

      {/* Drive Controls Bar */}
      <div className="glass-panel" style={{ padding: "1.25rem 1.75rem", marginBottom: "1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: "280px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            Campus Drive:
          </label>
          <select 
            className="form-select"
            value={selectedDriveId || ""}
            onChange={(e) => setSelectedDriveId(e.target.value)}
            style={{ fontWeight: 600 }}
          >
            {drives.map(d => (
              <option key={d.id} value={d.id}>
                {d.company_name} — {d.title} (₹{d.package_ctc} LPA)
              </option>
            ))}
          </select>
        </div>

        <div style={{ position: "relative", minWidth: "280px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search candidates by name, skill, dept..."
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
            <Users size={18} color="var(--primary)" /> Campus Candidates Ranked Leaderboard
          </h3>
          <span className="badge badge-cyan">{filteredCandidates.length} Student Profiles Ranked</span>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Ranking student cohort with multi-factor explainable AI engine...
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-dim)" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Rank</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Candidate</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Academic Credentials</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Match Score</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Explainable AI (XAI) Attribution</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Eligibility</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((c) => (
                  <tr key={c.student_id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <td style={{ padding: "1rem", fontWeight: 800, color: c.rank <= 5 ? "#34D399" : "inherit" }}>
                      #{c.rank}
                    </td>

                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{c.student_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.roll_number} • {c.gender}</div>
                      {c.has_applied && (
                        <span className="badge badge-emerald" style={{ fontSize: "0.68rem", marginTop: "0.3rem", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                          ✓ Form Registered
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "1rem" }}>
                      <div>Dept: <strong>{c.department}</strong></div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        CGPA: {c.cgpa} | Backlogs: <strong style={{ color: c.backlog_count > 0 ? "#FB7185" : "#34D399" }}>{c.backlog_count}</strong>
                      </div>
                    </td>

                    <td style={{ padding: "1rem" }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: c.match_score >= 70 ? "#34D399" : c.match_score >= 50 ? "#FBBF24" : "#FB7185" }}>
                        {c.match_score.toFixed(1)}%
                      </span>
                    </td>

                    <td style={{ padding: "1rem", maxWidth: "340px" }}>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-main)", marginBottom: "0.25rem" }}>
                        Skills: <strong>{c.explanation.matched_skills.join(", ") || "None"}</strong>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                        +{c.explanation.cgpa_contribution.toFixed(0)} pts CGPA • +{c.explanation.project_contribution.toFixed(0)} pts Projects • -{c.explanation.backlog_penalty_deduction.toFixed(0)} pts Backlogs
                      </div>
                    </td>

                    <td style={{ padding: "1rem" }}>
                      <span className={`badge ${c.is_eligible ? "badge-emerald" : "badge-rose"}`}>
                        {c.is_eligible ? "ELIGIBLE" : "FILTERED"}
                      </span>
                    </td>

                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--accent-cyan)", borderColor: "rgba(56, 189, 248, 0.35)" }}
                          onClick={() => setInspectingCandidate(c)}
                          title="Inspect Student Details Form (Academic, Contact, Projects, Statement)"
                        >
                          <FileText size={13} /> View Student Form
                        </button>
                        {c.resume_file_data && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: "0.78rem", padding: "0.35rem 0.65rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                            onClick={() => setPreviewingResumeCandidate(c)}
                            title="View PDF resume document"
                          >
                            <Eye size={13} /> Resume
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
                          onClick={() => {
                            setLoggingCandidate(c);
                            setOutcomeResult("SELECTED");
                            setFeedbackNotes("");
                          }}
                        >
                          Log Outcome
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Outcome Logging Modal */}
      {loggingCandidate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Log Campus Interview Outcome</h3>
              <button className="modal-close-btn" onClick={() => setLoggingCandidate(null)}>✕</button>
            </div>

            {outcomeMsg ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#34D399", fontSize: "1.1rem" }}>
                {outcomeMsg}
              </div>
            ) : (
              <form onSubmit={handleLogOutcomeSubmit}>
                <div style={{ marginBottom: "1.2rem", background: "rgba(255, 255, 255, 0.03)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{loggingCandidate.student_name}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {loggingCandidate.department} • CGPA {loggingCandidate.cgpa} • Match Score {loggingCandidate.match_score}%
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Interview Decision:</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <button
                      type="button"
                      className={`btn ${outcomeResult === "SELECTED" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setOutcomeResult("SELECTED")}
                      style={{ padding: "0.75rem" }}
                    >
                      <CheckCircle size={16} /> HIRED / OFFERED
                    </button>
                    <button
                      type="button"
                      className={`btn ${outcomeResult === "REJECTED" ? "btn-danger" : "btn-secondary"}`}
                      onClick={() => setOutcomeResult("REJECTED")}
                      style={{ padding: "0.75rem" }}
                    >
                      <XCircle size={16} /> REJECTED
                    </button>
                  </div>
                </div>

                {outcomeResult === "REJECTED" && (
                  <div className="form-group">
                    <label className="form-label">Primary Failure Category:</label>
                    <select
                      className="form-select"
                      value={failureCategory}
                      onChange={(e) => setFailureCategory(e.target.value)}
                    >
                      <option value="TECHNICAL">Technical Coding / DSA Gap</option>
                      <option value="COMMUNICATION">Verbal Communication & Soft Skills</option>
                      <option value="CULTURAL_FIT">General Aptitude & Problem Solving</option>
                      <option value="SKILL_GAP">Missing Required Core Stack</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Recruiter Feedback Notes:</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Provide constructive candidate feedback for the continuous feedback loop..."
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
                    {submittingOutcome ? "Saving Decision..." : "Commit Outcome to Feedback Engine"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Post Drive Modal */}
      {showPostModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Post New Campus Placement Drive</h3>
              <button className="modal-close-btn" onClick={() => setShowPostModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateDrive}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newDrive.company_name}
                    onChange={(e) => setNewDrive({ ...newDrive, company_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Role Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newDrive.title}
                    onChange={(e) => setNewDrive({ ...newDrive, title: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={newDrive.role_description}
                  onChange={(e) => setNewDrive({ ...newDrive, role_description: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Package CTC (LPA ₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={newDrive.package_ctc}
                    onChange={(e) => setNewDrive({ ...newDrive, package_ctc: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min CGPA Required</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={newDrive.min_cgpa}
                    onChange={(e) => setNewDrive({ ...newDrive, min_cgpa: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Backlogs Allowed</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newDrive.max_backlogs}
                    onChange={(e) => setNewDrive({ ...newDrive, max_backlogs: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newDrive.required_skills.join(", ")}
                  onChange={(e) => setNewDrive({ ...newDrive, required_skills: e.target.value.split(",").map(s => s.trim()) })}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPostModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Drive →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Details Form Modal for Recruiter Review */}
      {inspectingCandidate && (
        <StudentDetailsModal
          isOpen={Boolean(inspectingCandidate)}
          readOnly={true}
          currency="INR"
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
              { title: "Academic Capstone Project", tech: inspectingCandidate.skills.slice(0, 3) }
            ],
            githubUrl: inspectingCandidate.form_details?.githubUrl || "https://github.com/candidate",
            portfolioUrl: inspectingCandidate.form_details?.portfolioUrl || "",
            statementOfInterest: inspectingCandidate.form_details?.statementOfInterest || "Registered candidate seeking placement consideration for this role.",
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

      {/* Resume Document Viewer Modal */}
      {previewingResumeCandidate && (
        <ResumeViewerModal
          candidate={{
            student_id: previewingResumeCandidate.student_id,
            id: previewingResumeCandidate.student_id,
            student_name: previewingResumeCandidate.student_name,
            department: previewingResumeCandidate.department,
            cgpa: previewingResumeCandidate.cgpa,
            match_score: previewingResumeCandidate.match_score,
            explanation: previewingResumeCandidate.explanation
          }}
          currency="INR"
          onClose={() => setPreviewingResumeCandidate(null)}
        />
      )}
    </div>
  );
}
