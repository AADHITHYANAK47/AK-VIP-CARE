import React, { useState } from "react";
import { 
  X, Building2, Briefcase, DollarSign, Award, 
  Calendar, CheckCircle2, AlertCircle, Plus, Sparkles, Send
} from "lucide-react";
import { api } from "../services/api";

const ALL_DEPTS = ["CSE", "IT", "ECE", "MECH", "CIVIL", "EEE", "Data Science", "AI & ML"];

export default function RegisterCompanyModal({
  isOpen,
  onClose,
  onCompanyCreated,
  registeredByRole = "student"
}) {
  if (!isOpen) return null;

  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [packageCtc, setPackageCtc] = useState("18.0");
  const [minCgpa, setMinCgpa] = useState("7.0");
  const [maxBacklogs, setMaxBacklogs] = useState("0");
  const [eligibleDepartments, setEligibleDepartments] = useState(["CSE", "IT", "ECE"]);
  const [requiredSkillsInput, setRequiredSkillsInput] = useState("Python, React, SQL, Git, REST API");
  const [driveDate, setDriveDate] = useState("2026-10-25");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function toggleDept(dept) {
    if (eligibleDepartments.includes(dept)) {
      if (eligibleDepartments.length > 1) {
        setEligibleDepartments(eligibleDepartments.filter(d => d !== dept));
      }
    } else {
      setEligibleDepartments([...eligibleDepartments, dept]);
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!companyName.trim() || !title.trim()) {
      setErrorMsg("⚠️ Please enter Company Name and Role Title.");
      return;
    }

    const ctcNum = parseFloat(packageCtc);
    if (isNaN(ctcNum) || ctcNum <= 0) {
      setErrorMsg("⚠️ Please enter a valid CTC in LPA.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const parsedSkills = requiredSkillsInput
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      company_name: companyName.trim(),
      title: title.trim(),
      role_description: roleDescription.trim() || `Official campus placement requisition registered via VIPCARE for ${title.trim()} position.`,
      package_ctc: ctcNum,
      min_cgpa: parseFloat(minCgpa) || 6.0,
      max_backlogs: parseInt(maxBacklogs, 10) || 0,
      eligible_departments: eligibleDepartments,
      required_skills: parsedSkills.length > 0 ? parsedSkills : ["Python", "FastAPI", "React", "Docker"],
      preferred_skills: ["System Design", "Microservices", "Cloud"],
      drive_date: driveDate || "Immediate Registration",
      status: "OPEN"
    };

    try {
      const createdDrive = await api.createDrive(payload);
      if (onCompanyCreated) {
        onCompanyCreated(createdDrive);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to register company drive.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content glass-panel" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: "760px", 
          maxHeight: "90vh", 
          overflowY: "auto", 
          padding: "2rem 2.25rem",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "1.25rem", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
              <span className="badge badge-emerald" style={{ fontSize: "0.75rem" }}>
                <Building2 size={13} style={{ marginRight: "0.3rem" }} />
                VIPCARE Company Registration
              </span>
              <span className="badge badge-indigo" style={{ fontSize: "0.75rem", textTransform: "capitalize" }}>
                Initiated by {registeredByRole}
              </span>
            </div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
              Register Company for Placement Drives
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.3rem", margin: 0 }}>
              Add a new company profile &amp; recruitment requisition. Candidates can immediately access the Student Details Form and apply.
            </p>
          </div>

          <button 
            type="button" 
            className="btn-icon" 
            onClick={onClose} 
            title="Close Form"
            style={{ color: "var(--text-muted)", padding: "0.4rem", borderRadius: "50%", background: "rgba(255, 255, 255, 0.05)" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{ 
            background: "rgba(244, 63, 94, 0.12)", 
            border: "1px solid rgba(244, 63, 94, 0.35)", 
            color: "#FDA4AF", 
            borderRadius: "var(--radius-sm)", 
            padding: "0.75rem 1rem", 
            marginBottom: "1.25rem", 
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <AlertCircle size={16} color="#FB7185" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            <div>
              <label className="form-label" style={{ fontSize: "0.82rem" }}>Company Name *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. VIPCARE Cloud, Google India, Microsoft..." 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.82rem" }}>Job Title / Role *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Software Development Engineer (SDE-1)" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.82rem" }}>Compensation (₹ LPA CTC) *</label>
              <div style={{ position: "relative" }}>
                <input 
                  type="number" 
                  step="0.5" 
                  min="3.0"
                  className="form-input" 
                  placeholder="18.0" 
                  value={packageCtc}
                  onChange={(e) => setPackageCtc(e.target.value)}
                  required
                />
                <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#34D399", fontWeight: 700 }}>
                  LPA
                </span>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.82rem" }}>Target Drive / Assessment Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={driveDate}
                onChange={(e) => setDriveDate(e.target.value)}
              />
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#38BDF8", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Award size={15} /> Academic Eligibility Criteria
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Minimum CGPA Cutoff</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="5.0" 
                  max="10.0" 
                  className="form-input" 
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Max Active Backlogs Allowed</label>
                <input 
                  type="number" 
                  min="0" 
                  max="10" 
                  className="form-input" 
                  value={maxBacklogs}
                  onChange={(e) => setMaxBacklogs(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                Eligible Academic Departments (Click to toggle)
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {ALL_DEPTS.map((dept) => {
                  const isSelected = eligibleDepartments.includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleDept(dept)}
                      className={`badge ${isSelected ? "badge-emerald" : "badge-indigo"}`}
                      style={{ 
                        cursor: "pointer", 
                        padding: "0.35rem 0.75rem", 
                        fontSize: "0.78rem",
                        border: isSelected ? "1px solid #10B981" : "1px solid rgba(255, 255, 255, 0.1)",
                        opacity: isSelected ? 1 : 0.55
                      }}
                    >
                      {isSelected ? "✓ " : "+ "}{dept}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Required Skills */}
          <div>
            <label className="form-label" style={{ fontSize: "0.82rem" }}>
              Required Technical Skills (Comma-separated)
            </label>
            <input 
              type="text" 
              className="form-input" 
              value={requiredSkillsInput}
              onChange={(e) => setRequiredSkillsInput(e.target.value)}
              placeholder="e.g. Python, React, Docker, Kubernetes, AWS, SQL"
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              VIPCARE AI uses these skills to calculate Explainable AI (XAI) fit scores and ATS evaluations.
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="form-label" style={{ fontSize: "0.82rem" }}>
              Role &amp; Responsibilities Description
            </label>
            <textarea 
              className="form-textarea" 
              rows={3}
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder="Describe the key responsibilities, team culture, and expectations for candidates..."
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "1.25rem" }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              style={{ padding: "0.6rem 1.25rem", fontSize: "0.85rem" }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitting}
              style={{ padding: "0.6rem 1.5rem", fontSize: "0.85rem", fontWeight: 700 }}
            >
              {isSubmitting ? "Registering Company..." : (
                <>
                  <Building2 size={15} style={{ marginRight: "0.4rem" }} />
                  Register Company &amp; Launch Drive
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
