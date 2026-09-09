import React, { useState, useEffect } from "react";
import { 
  X, Building2, User, Mail, Phone, MapPin, Award, BookOpen, 
  Briefcase, FileText, CheckCircle2, AlertCircle, Sparkles, 
  ExternalLink, Plus, Trash2, Send, ShieldCheck, Flame, Star, Check
} from "lucide-react";
import { formatCompensation } from "../services/api";

export default function StudentDetailsModal({
  isOpen,
  onClose,
  drive,
  student,
  onSubmitApplication,
  readOnly = false,
  initialFormData = null,
  currency = "INR"
}) {
  if (!isOpen || (!drive && !initialFormData)) return null;

  const companyName = drive?.company_name || initialFormData?.company_name || "Target Company";
  const roleTitle = drive?.title || initialFormData?.role || "Software Engineer";
  const packageCtc = drive?.package_ctc || initialFormData?.package_ctc || 18.0;
  const matchScore = drive?.match_score ?? initialFormData?.match_score ?? 85;

  // Form state pre-populated with student data or initialFormData
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [locationHub, setLocationHub] = useState("Bengaluru HQ 🇮🇳");
  const [department, setDepartment] = useState("Computer Science (CSE)");
  const [cgpa, setCgpa] = useState("8.5");
  const [backlogs, setBacklogs] = useState(0);
  const [batchYear, setBatchYear] = useState("Class of 2026");
  const [skills, setSkills] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [projects, setProjects] = useState([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [statementOfInterest, setStatementOfInterest] = useState("");
  const [affirmationChecked, setAffirmationChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Initialize or re-populate when modal opens
  useEffect(() => {
    if (initialFormData) {
      // Viewing a previously submitted application form
      setFullName(initialFormData.fullName || initialFormData.name || student?.name || "");
      setRollNumber(initialFormData.rollNumber || initialFormData.roll_number || student?.roll_number || "");
      setEmail(initialFormData.email || student?.email || "");
      setPhone(initialFormData.phone || "+91 98765 43210");
      setLocationHub(initialFormData.locationHub || "Bengaluru HQ 🇮🇳");
      setDepartment(initialFormData.department || student?.department || "CSE");
      setCgpa(String(initialFormData.cgpa || student?.cgpa || "8.5"));
      setBacklogs(initialFormData.backlogs ?? student?.backlog_count ?? 0);
      setBatchYear(initialFormData.batchYear || "Class of 2026");
      setSkills(Array.isArray(initialFormData.skills) ? initialFormData.skills : (student?.skills || []));
      setProjects(Array.isArray(initialFormData.projects) ? initialFormData.projects : (student?.projects || []));
      setGithubUrl(initialFormData.githubUrl || "https://github.com/candidate");
      setPortfolioUrl(initialFormData.portfolioUrl || "");
      setStatementOfInterest(initialFormData.statementOfInterest || "I am enthusiastic about this position at " + companyName + " and look forward to contributing with scalable software architecture and engineering excellence.");
      setAffirmationChecked(true);
    } else if (student) {
      // Filling out a fresh registration form
      setFullName(student.name || "");
      setRollNumber(student.roll_number || "");
      setEmail(student.email || "");
      setPhone("+91 98401 23456");
      setLocationHub("Bengaluru HQ 🇮🇳");
      setDepartment(student.department || "Computer Science (CSE)");
      setCgpa(String(student.cgpa || "8.45"));
      setBacklogs(student.backlog_count || 0);
      setBatchYear("Class of 2026");
      setSkills(Array.isArray(student.skills) && student.skills.length > 0 ? [...student.skills] : ["Python", "FastAPI", "React", "Docker", "SQL"]);
      setProjects(Array.isArray(student.projects) && student.projects.length > 0 ? [...student.projects] : [
        { title: "Distributed High-Throughput API Gateway", tech: ["Python", "FastAPI", "Redis"] },
        { title: "Real-time Candidate Analytics Dashboard", tech: ["React", "PostgreSQL", "Docker"] }
      ]);
      setGithubUrl("https://github.com/" + (student.name ? student.name.toLowerCase().replace(/\s+/g, "") : "candidate"));
      setPortfolioUrl("");
      setStatementOfInterest(`I am excited to register for ${companyName} for the ${roleTitle} role. My core strengths in ${student.skills?.slice(0, 3).join(", ") || "full-stack development"} align directly with the requirements of this drive.`);
      setAffirmationChecked(false);
    }
    setErrorMsg("");
  }, [student, drive, initialFormData, isOpen, companyName, roleTitle]);

  function handleAddSkill(e) {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setNewSkillInput("");
  }

  function handleRemoveSkill(skillToRemove) {
    if (readOnly) return;
    setSkills(skills.filter((s) => s !== skillToRemove));
  }

  async function handleSubmitForm(e) {
    e.preventDefault();
    if (readOnly) return;

    if (!affirmationChecked) {
      setErrorMsg("⚠️ Please certify that the academic and professional details provided are accurate.");
      return;
    }

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg("⚠️ Please provide full name, email, and mobile contact number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const formDataPayload = {
      submittedAt: new Date().toISOString(),
      driveId: drive?.drive_id || drive?.id,
      company_name: companyName,
      role: roleTitle,
      package_ctc: packageCtc,
      match_score: matchScore,
      fullName: fullName.trim(),
      rollNumber: rollNumber.trim(),
      email: email.trim(),
      phone: phone.trim(),
      locationHub,
      department,
      cgpa: parseFloat(cgpa) || 8.0,
      backlogs: parseInt(backlogs, 10) || 0,
      batchYear,
      skills,
      projects,
      githubUrl: githubUrl.trim(),
      portfolioUrl: portfolioUrl.trim(),
      statementOfInterest: statementOfInterest.trim(),
      hasUploadedResume: Boolean(student?.resume_file_data || student?.resume_file_name),
      resumeFileName: student?.resume_file_name || "Official_Academic_Resume.pdf",
      atsScore: student?.ats_score || 85,
      certifiedTrue: true
    };

    try {
      if (onSubmitApplication) {
        await onSubmitApplication(formDataPayload);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit student registration form.");
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
          maxWidth: "840px", 
          maxHeight: "92vh", 
          overflowY: "auto", 
          padding: "2rem 2.25rem",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)"
        }}
      >
        {/* Header with Company Details & Live Match Pill */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "1.25rem", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
              <span className="badge badge-indigo" style={{ fontSize: "0.75rem" }}>
                <Building2 size={13} style={{ marginRight: "0.3rem" }} />
                {readOnly ? "Registered Candidate Form" : "VIPCARE Company Registration"}
              </span>
              <span className="badge badge-emerald" style={{ fontSize: "0.75rem" }}>
                CTC: {formatCompensation(packageCtc, currency)}
              </span>
              <span className="badge badge-cyan" style={{ fontSize: "0.75rem" }}>
                <Sparkles size={12} style={{ marginRight: "0.25rem" }} /> AI Fit: {Math.round(matchScore)}%
              </span>
            </div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
              {readOnly ? "Student Details Form Review" : `Register & Apply for ${companyName}`}
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.3rem", margin: 0 }}>
              Target Role: <strong style={{ color: "var(--accent-cyan)" }}>{roleTitle}</strong> • Verified Candidate Profile &amp; Academic Credentials
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

        <form onSubmit={handleSubmitForm} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* SECTION 1: Personal Identification & Contact */}
          <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#38BDF8", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <User size={16} /> 1. Candidate Identification &amp; Contact Details
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <div>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Candidate Full Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  disabled={readOnly}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Student Roll Number / EMP ID *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={rollNumber} 
                  onChange={(e) => setRollNumber(e.target.value)} 
                  disabled={readOnly}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>University / Corporate Email *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={readOnly}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Mobile Contact / WhatsApp *</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  disabled={readOnly}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Preferred Location / Tech Hub</label>
                <select 
                  className="form-input" 
                  value={locationHub} 
                  onChange={(e) => setLocationHub(e.target.value)}
                  disabled={readOnly}
                >
                  <option value="Bengaluru HQ 🇮🇳">Bengaluru HQ 🇮🇳 • Outer Ring Road Tech Hub</option>
                  <option value="Hyderabad Tech Hub 🇮🇳">Hyderabad Tech Hub 🇮🇳 • HITEC City</option>
                  <option value="Pune Engineering Hub 🇮🇳">Pune Engineering Hub 🇮🇳 • Hinjawadi</option>
                  <option value="Chennai Hub 🇮🇳">Chennai Hub 🇮🇳 • OMR IT Corridor</option>
                  <option value="Delhi-NCR / Gurgaon 🇮🇳">Delhi-NCR / Gurgaon 🇮🇳 • Cyber City</option>
                  <option value="Mumbai Financial Tech 🇮🇳">Mumbai Financial Tech 🇮🇳 • BKC</option>
                  <option value="Hybrid / Remote India">Hybrid / Remote India</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Academic Profile & Placement Standing */}
          <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#34D399", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BookOpen size={16} /> 2. Academic Profile &amp; Placement Standing
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
              <div>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Department / Branch</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)} 
                  disabled={readOnly}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Academic CGPA / Score</label>
                <div style={{ position: "relative" }}>
                  <input 
                    type="number" 
                    step="0.01" 
                    max="10.0" 
                    min="0" 
                    className="form-input" 
                    value={cgpa} 
                    onChange={(e) => setCgpa(e.target.value)} 
                    disabled={readOnly}
                  />
                  <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#34D399", fontWeight: 700 }}>
                    / 10.0
                  </span>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Active Standing Backlogs</label>
                <input 
                  type="number" 
                  min="0" 
                  className="form-input" 
                  value={backlogs} 
                  onChange={(e) => setBacklogs(e.target.value)} 
                  disabled={readOnly}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Graduation Batch</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={batchYear} 
                  onChange={(e) => setBatchYear(e.target.value)} 
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Verified Technical Skills */}
          <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#A855F7", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Award size={16} /> 3. Verified Technical Competencies &amp; Skills
            </h3>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
              {skills.map((skill, idx) => (
                <span 
                  key={idx} 
                  className="badge badge-cyan" 
                  style={{ 
                    fontSize: "0.8rem", 
                    padding: "0.35rem 0.75rem", 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "0.4rem" 
                  }}
                >
                  <Sparkles size={11} /> {skill}
                  {!readOnly && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSkill(skill)}
                      style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }}
                      title="Remove skill"
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {!readOnly && (
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Add another skill (e.g. Kubernetes, AWS, TypeScript)..." 
                  value={newSkillInput} 
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  style={{ fontSize: "0.85rem" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill(e);
                    }
                  }}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleAddSkill}
                  style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem", whiteSpace: "nowrap" }}
                >
                  <Plus size={14} /> Add Skill
                </button>
              </div>
            )}
          </div>

          {/* SECTION 4: Projects & Portfolio Links */}
          <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#F59E0B", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Briefcase size={16} /> 4. Highlighted Projects &amp; Code Repositories
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
              {projects.map((proj, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    background: "rgba(0, 0, 0, 0.25)", 
                    border: "1px solid rgba(255, 255, 255, 0.06)", 
                    borderRadius: "var(--radius-sm)", 
                    padding: "0.75rem 1rem" 
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#F1F5F9" }}>
                    {proj.title || `Project #${idx + 1}`}
                  </div>
                  {proj.tech && (
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      Technologies: {Array.isArray(proj.tech) ? proj.tech.join(", ") : proj.tech}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              <div>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>GitHub / GitLab Profile URL</label>
                <input 
                  type="url" 
                  className="form-input" 
                  value={githubUrl} 
                  onChange={(e) => setGithubUrl(e.target.value)} 
                  disabled={readOnly}
                  placeholder="https://github.com/username"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Portfolio / Live Demo URL (Optional)</label>
                <input 
                  type="url" 
                  className="form-input" 
                  value={portfolioUrl} 
                  onChange={(e) => setPortfolioUrl(e.target.value)} 
                  disabled={readOnly}
                  placeholder="https://myportfolio.dev"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: Resume & ATS Score Verification */}
          <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#38BDF8", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={16} /> 5. Attached Resume &amp; ATS Score Verification
            </h3>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", background: "rgba(14, 165, 233, 0.08)", border: "1px solid rgba(14, 165, 233, 0.25)", borderRadius: "var(--radius-sm)", padding: "0.85rem 1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: "8px", background: "rgba(56, 189, 248, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38BDF8" }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#F1F5F9" }}>
                    {student?.resume_file_name || initialFormData?.resumeFileName || "Official_Academic_Resume.pdf"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Verified PDF Stored Permanently in Database • Recruiter Ready
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="badge badge-emerald" style={{ fontSize: "0.78rem" }}>
                  <CheckCircle2 size={13} style={{ marginRight: "0.25rem" }} />
                  ATS Match: {student?.ats_score || initialFormData?.atsScore || 85}%
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 6: Statement of Purpose / Why Join This Company */}
          <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#F1F5F9", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles size={16} color="var(--accent-cyan)" /> 6. Statement of Purpose / Motivation
            </h3>
            <label className="form-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Why do you want to register and join {companyName} for this requisition?
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              value={statementOfInterest}
              onChange={(e) => setStatementOfInterest(e.target.value)}
              disabled={readOnly}
              placeholder={`Share your technical interests, domain passion, and why you are excited to contribute to ${companyName}...`}
            />
          </div>

          {/* SECTION 7: Declaration Affirmation */}
          {!readOnly ? (
            <div style={{ background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer", fontSize: "0.82rem", color: "#E2E8F0" }}>
                <input 
                  type="checkbox" 
                  checked={affirmationChecked} 
                  onChange={(e) => setAffirmationChecked(e.target.checked)}
                  style={{ marginTop: "0.2rem", accentColor: "#10B981" }}
                  required
                />
                <span>
                  <strong style={{ color: "#34D399" }}>Statutory Candidate Certification:</strong> I certify that the academic credentials (CGPA, backlogs), technical projects, and resume submitted for <strong>{companyName}</strong> are true, authentic, and subject to institutional verification by the placement cell and corporate talent acquisition.
                </span>
              </label>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "#34D399" }}>
              <ShieldCheck size={16} /> Certified authentic application on file with VIPCARE Placement &amp; Talent Engine.
            </div>
          )}

          {/* Modal Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "1.25rem" }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              style={{ padding: "0.6rem 1.25rem", fontSize: "0.85rem" }}
            >
              {readOnly ? "Close" : "Cancel"}
            </button>

            {!readOnly && (
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSubmitting}
                style={{ padding: "0.6rem 1.5rem", fontSize: "0.85rem", fontWeight: 700 }}
              >
                {isSubmitting ? (
                  "Submitting Student Details..."
                ) : (
                  <>
                    <Send size={15} style={{ marginRight: "0.4rem" }} />
                    Submit Registration &amp; Apply for {companyName}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
