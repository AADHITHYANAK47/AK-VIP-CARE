import React, { useState, useEffect, useRef } from "react";
import {
  X, Building2, User, FileText, CheckCircle2, AlertCircle, Sparkles,
  Plus, Send, ArrowLeft, ChevronRight, Check,
  GraduationCap, Code, Briefcase, Award, UploadCloud, Trash2, Eye
} from "lucide-react";
import { api, formatCompensation, saveUploadedResume, getUploadedResume } from "../services/api";
import confetti from "canvas-confetti";

const STEPS = [
  { id: 1, label: "Personal Info",    icon: User          },
  { id: 2, label: "Academics",        icon: GraduationCap },
  { id: 3, label: "Skills & Projects",icon: Code          },
  { id: 4, label: "Resume Upload",    icon: UploadCloud   },
  { id: 5, label: "Statement",        icon: FileText      },
  { id: 6, label: "Review & Submit",  icon: CheckCircle2  },
];

const LOCATIONS = [
  "Bengaluru HQ 🇮🇳 • Outer Ring Road Tech Hub",
  "Hyderabad Tech Hub 🇮🇳 • HITEC City",
  "Pune Engineering Hub 🇮🇳 • Hinjawadi",
  "Chennai Hub 🇮🇳 • OMR IT Corridor",
  "Delhi-NCR / Gurgaon 🇮🇳 • Cyber City",
  "Mumbai Financial Tech 🇮🇳 • BKC",
  "Hybrid / Remote India",
];

export default function StudentRegistrationPage({
  drive,
  student,
  currency = "INR",
  onSubmitApplication,
  onBack,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* ── Step 1: Personal Info ───────────────────────────────────────── */
  const [fullName, setFullName]         = useState("");
  const [rollNumber, setRollNumber]     = useState("");
  const [email, setEmail]               = useState("");
  const [phone, setPhone]               = useState("");
  const [locationHub, setLocationHub]   = useState(LOCATIONS[0]);

  /* ── Step 2: Academics ───────────────────────────────────────────── */
  const [department, setDepartment]     = useState("");
  const [cgpa, setCgpa]                 = useState("");
  const [backlogs, setBacklogs]         = useState(0);
  const [batchYear, setBatchYear]       = useState("Class of 2026");

  /* ── Step 3: Skills & Projects ───────────────────────────────────── */
  const [skills, setSkills]             = useState([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [projects, setProjects]         = useState([]);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectTech, setNewProjectTech]   = useState("");
  const [githubUrl, setGithubUrl]       = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  /* ── Step 4: Resume Upload ───────────────────────────────────────── */
  const [uploadedFile, setUploadedFile]   = useState(null);
  const [uploadMsg, setUploadMsg]         = useState("");
  const [uploading, setUploading]         = useState(false);
  const [atsScore, setAtsScore]           = useState(0);
  const [dragActive, setDragActive]       = useState(false);
  const fileInputRef = useRef(null);

  /* ── Step 5: Statement ───────────────────────────────────────────── */
  const [statementOfInterest, setStatementOfInterest] = useState("");
  const [affirmationChecked, setAffirmationChecked]   = useState(false);

  const companyName = drive?.company_name || "Target Company";
  const roleTitle   = drive?.title        || "Software Engineer";
  const packageCtc  = drive?.package_ctc  || 18.0;
  const matchScore  = drive?.match_score  ?? 85;

  /* ── Pre-fill from student profile ─────────────────────────────── */
  useEffect(() => {
    if (!student) return;
    setFullName(student.name || "");
    setRollNumber(student.roll_number || "");
    setEmail(student.email || "");
    setPhone("+91 98401 23456");
    setDepartment(student.department || "");
    setCgpa(String(student.cgpa || ""));
    setBacklogs(student.backlog_count || 0);

    const skillList = Array.isArray(student.skills) && student.skills.length > 0
      ? [...student.skills]
      : ["Python", "React", "SQL", "Docker"];
    setSkills(skillList);

    const projList = Array.isArray(student.projects) && student.projects.length > 0
      ? [...student.projects]
      : [{ title: "Final Year Capstone Project", tech: skillList.slice(0, 3) }];
    setProjects(projList);

    setGithubUrl(`https://github.com/${(student.name || "candidate").toLowerCase().replace(/\s+/g, "")}`);
    setStatementOfInterest(
      `I am excited to apply for the ${roleTitle} role at ${companyName}. My expertise in ${skillList.slice(0, 3).join(", ")} directly aligns with your requirements, and I am committed to contributing meaningfully to your team.`
    );

    // Pre-load resume if already stored
    const savedResume = getUploadedResume(student.id);
    if (student.resume_file_data) {
      setUploadedFile({
        name: student.resume_file_name || "Resume.pdf",
        size: "Stored in Database",
        type: student.resume_file_type || "application/pdf",
        isImage: student.resume_file_type?.startsWith("image/") || false,
        dataUrl: student.resume_file_data,
      });
      setAtsScore(student.ats_score || 0);
    } else if (savedResume) {
      setUploadedFile(savedResume);
    }
  }, [student, drive]);

  /* ── Resume upload helpers ──────────────────────────────────────── */
  function processFile(file) {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImg = file.type.startsWith("image/") || /\.(jpg|jpeg|png)$/i.test(file.name);
    if (!isPdf && !isImg) {
      setUploadMsg("⚠️ Only PDF or JPG/PNG image files are accepted.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileData = {
        name: file.name,
        size: (file.size / 1024).toFixed(0) + " KB",
        type: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
        isImage: !!isImg,
        dataUrl: e.target.result,
        uploadedAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      };
      setUploadedFile(fileData);
      if (student?.id) saveUploadedResume(student.id, fileData);

      try {
        setUploading(true);
        setUploadMsg(`⏳ Uploading "${file.name}" and running ATS analysis...`);
        const res = await api.uploadResume(student.id, {
          file_name: file.name,
          file_data: e.target.result,
          file_type: fileData.type,
        });
        const score = res.ats_score || 0;
        setAtsScore(score);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setUploadMsg(`✅ Resume "${file.name}" uploaded! ATS Score: ${score}% — Recruiter Ready.`);
      } catch (err) {
        setUploadMsg(`✅ Resume stored locally. (Sync: ${err.message})`);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e) {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  }

  function handleDragOver(e)  { e.preventDefault(); setDragActive(true);  }
  function handleDragLeave(e) { e.preventDefault(); setDragActive(false); }
  function handleDrop(e) {
    e.preventDefault(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  }

  function handleRemoveResume() {
    setUploadedFile(null);
    setAtsScore(0);
    setUploadMsg("Resume removed. Upload again before submitting.");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /* ── Skills & Projects helpers ──────────────────────────────────── */
  function handleAddSkill() {
    const t = newSkillInput.trim();
    if (t && !skills.includes(t)) setSkills([...skills, t]);
    setNewSkillInput("");
  }

  function handleAddProject() {
    const t = newProjectTitle.trim();
    if (!t) return;
    const techArr = newProjectTech.split(",").map(s => s.trim()).filter(Boolean);
    setProjects([...projects, { title: t, tech: techArr }]);
    setNewProjectTitle(""); setNewProjectTech("");
  }

  /* ── Step validation ────────────────────────────────────────────── */
  function canProceed() {
    if (currentStep === 1) return fullName.trim() && email.trim() && phone.trim();
    if (currentStep === 2) return department.trim() && cgpa;
    if (currentStep === 3) return skills.length > 0;
    if (currentStep === 4) return true; // resume optional but encouraged
    if (currentStep === 5) return statementOfInterest.trim().length > 30;
    return affirmationChecked;
  }

  /* ── Final submit ───────────────────────────────────────────────── */
  async function handleFinalSubmit() {
    if (!affirmationChecked) {
      setErrorMsg("⚠️ Please tick the certification checkbox to proceed.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");

    const payload = {
      submittedAt:         new Date().toISOString(),
      driveId:             drive?.drive_id || drive?.id,
      company_name:        companyName,
      role:                roleTitle,
      package_ctc:         packageCtc,
      match_score:         matchScore,
      fullName:            fullName.trim(),
      rollNumber:          rollNumber.trim(),
      email:               email.trim(),
      phone:               phone.trim(),
      locationHub,
      department,
      cgpa:                parseFloat(cgpa) || 8.0,
      backlogs:            parseInt(backlogs, 10) || 0,
      batchYear,
      skills,
      projects,
      githubUrl:           githubUrl.trim(),
      portfolioUrl:        portfolioUrl.trim(),
      statementOfInterest: statementOfInterest.trim(),
      hasUploadedResume:   Boolean(uploadedFile),
      resumeFileName:      uploadedFile?.name || "Academic_Resume.pdf",
      atsScore:            atsScore || student?.ats_score || 0,
      certifiedTrue:       true,
    };

    try {
      if (onSubmitApplication) await onSubmitApplication(payload);
      confetti({ particleCount: 130, spread: 90, origin: { y: 0.5 } });
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     SUCCESS SCREEN
  ═══════════════════════════════════════════════════════════════════ */
  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "1.5rem", padding: "2rem", textAlign: "center",
        background: "radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.1) 0%, transparent 70%)"
      }}>
        <div style={{
          width: 90, height: 90, borderRadius: "50%",
          background: "linear-gradient(135deg,#10B981,#06B6D4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 50px rgba(16,185,129,0.5)"
        }}>
          <CheckCircle2 size={44} color="#fff" />
        </div>

        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#fff" }}>Registration Submitted! 🎉</h1>
        <p style={{ fontSize: "1rem", color: "var(--text-muted)", maxWidth: 480, lineHeight: 1.7 }}>
          Your Student Details Form for{" "}
          <strong style={{ color: "#34D399" }}>{companyName}</strong> —{" "}
          <strong style={{ color: "var(--accent-cyan)" }}>{roleTitle}</strong>{" "}
          has been successfully submitted. The recruiter will review your profile shortly.
        </p>

        <div style={{
          display: "flex", gap: "1.25rem", flexWrap: "wrap", justifyContent: "center",
          padding: "1.1rem 1.75rem",
          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: "var(--radius-md)"
        }}>
          {[
            { label: "AI Fit Score",  value: `${Math.round(matchScore)}%`,                color: "#34D399" },
            { label: "Package",       value: formatCompensation(packageCtc, currency),     color: "#38BDF8" },
            { label: "Skills Listed", value: skills.length,                                color: "#A855F7" },
            { label: "Resume",        value: uploadedFile ? "✓ Uploaded" : "Not uploaded", color: uploadedFile ? "#34D399" : "#FBBF24" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", minWidth: 90 }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={onBack}
          style={{ padding: "0.75rem 2rem", fontSize: "0.95rem", fontWeight: 700 }}>
          <ArrowLeft size={16} style={{ marginRight: "0.4rem" }} /> Back to Dashboard
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════
     MAIN PAGE
  ═══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>

      {/* ── Top Back Bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-secondary" onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
          <ArrowLeft size={16} /> Back to Drives
        </button>
        <div style={{ flex: 1 }}>
          <span className="badge badge-emerald" style={{ fontSize: "0.75rem", marginRight: "0.5rem" }}>
            <Building2 size={12} style={{ marginRight: "0.3rem" }} /> VIPCARE Company Registration
          </span>
          <span className="badge badge-cyan" style={{ fontSize: "0.75rem" }}>
            AI Fit: {Math.round(matchScore)}%
          </span>
        </div>
      </div>

      {/* ── Company Header Card ── */}
      <div className="glass-panel" style={{
        padding: "1.5rem 2rem", marginBottom: "2rem",
        borderLeft: "4px solid #10B981",
        background: "linear-gradient(135deg,rgba(16,185,129,0.07) 0%,rgba(6,182,212,0.04) 100%)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: "0.3rem" }}>
              Register & Apply — {companyName}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Role: <strong style={{ color: "var(--accent-cyan)" }}>{roleTitle}</strong>&nbsp;•&nbsp;
              Package: <strong style={{ color: "#34D399" }}>{formatCompensation(packageCtc, currency)}</strong>&nbsp;•&nbsp;
              Drive Date: <strong>{drive?.drive_date || "Upcoming"}</strong>
            </p>
          </div>
          <div className={`score-circle ${matchScore >= 75 ? "score-circle-high" : matchScore >= 50 ? "score-circle-mid" : "score-circle-low"}`}
            style={{ width: 64, height: 64, fontSize: "1.1rem" }}>
            {Math.round(matchScore)}%
          </div>
        </div>
      </div>

      {/* ── Step Progress Bar ── */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "2.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isDone   = currentStep > step.id;
          const isActive = currentStep === step.id;
          return (
            <React.Fragment key={step.id}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", minWidth: 72 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isDone ? "linear-gradient(135deg,#10B981,#06B6D4)"
                    : isActive ? "linear-gradient(135deg,#6366F1,#8B5CF6)"
                    : "rgba(255,255,255,0.06)",
                  border: isActive ? "2px solid #818CF8" : isDone ? "2px solid #10B981" : "2px solid rgba(255,255,255,0.1)",
                  color: (isDone || isActive) ? "#fff" : "var(--text-dim)",
                  fontWeight: 800,
                  transition: "all 0.3s ease",
                  boxShadow: isActive ? "0 0 20px rgba(99,102,241,0.4)" : isDone ? "0 0 12px rgba(16,185,129,0.3)" : "none"
                }}>
                  {isDone ? <Check size={18} /> : <StepIcon size={17} />}
                </div>
                <span style={{
                  fontSize: "0.68rem", fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#C7D2FE" : isDone ? "#34D399" : "var(--text-dim)",
                  whiteSpace: "nowrap", textAlign: "center"
                }}>
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, minWidth: 16,
                  background: isDone ? "linear-gradient(90deg,#10B981,#06B6D4)" : "rgba(255,255,255,0.08)",
                  margin: "0 0.2rem", marginBottom: "1.25rem", transition: "background 0.3s"
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ═══════════════════ STEP CONTENT ═══════════════════ */}
      <div className="glass-panel" style={{ padding: "2rem 2.25rem", minHeight: 360 }}>

        {/* STEP 1 — Personal Info */}
        {currentStep === 1 && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <User size={20} color="#38BDF8" /> Candidate Identification & Contact
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "1.25rem" }}>
              <div>
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Aaditya Raman" />
              </div>
              <div>
                <label className="form-label">Roll Number / Student ID</label>
                <input type="text" className="form-input" value={rollNumber} onChange={e => setRollNumber(e.target.value)} placeholder="e.g. 21CS042" />
              </div>
              <div>
                <label className="form-label">University Email *</label>
                <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" />
              </div>
              <div>
                <label className="form-label">Mobile / WhatsApp *</label>
                <input type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Preferred Location / Tech Hub</label>
                <select className="form-input" value={locationHub} onChange={e => setLocationHub(e.target.value)}>
                  {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Academics */}
        {currentStep === 2 && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <GraduationCap size={20} color="#34D399" /> Academic Profile & Placement Standing
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: "1.25rem" }}>
              <div>
                <label className="form-label">Department / Branch *</label>
                <input type="text" className="form-input" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Computer Science (CSE)" />
              </div>
              <div>
                <label className="form-label">Academic CGPA *</label>
                <div style={{ position: "relative" }}>
                  <input type="number" step="0.01" min="0" max="10" className="form-input"
                    value={cgpa} onChange={e => setCgpa(e.target.value)} placeholder="8.50" />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#34D399", fontWeight: 700 }}>/ 10.0</span>
                </div>
              </div>
              <div>
                <label className="form-label">Active Backlogs</label>
                <input type="number" min="0" className="form-input" value={backlogs} onChange={e => setBacklogs(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Graduation Batch</label>
                <input type="text" className="form-input" value={batchYear} onChange={e => setBatchYear(e.target.value)} placeholder="Class of 2026" />
              </div>
            </div>
            {drive && (
              <div style={{
                marginTop: "1.5rem", padding: "1rem 1.25rem",
                background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: "var(--radius-sm)", fontSize: "0.85rem"
              }}>
                <div style={{ fontWeight: 700, color: "#A5B4FC", marginBottom: "0.35rem" }}>Drive Eligibility Requirements</div>
                <span style={{ color: "var(--text-muted)" }}>
                  Min CGPA: <strong style={{ color: "#C7D2FE" }}>{drive.min_cgpa || 7.0}</strong>&nbsp;•&nbsp;
                  Max Backlogs: <strong style={{ color: "#C7D2FE" }}>{drive.max_backlogs ?? 0}</strong>&nbsp;•&nbsp;
                  Depts: <strong style={{ color: "#C7D2FE" }}>{(drive.eligible_departments || ["CSE","IT","ECE"]).join(", ")}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — Skills & Projects */}
        {currentStep === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Award size={20} color="#A855F7" /> Technical Skills *
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                {skills.map((sk, i) => (
                  <span key={i} className="badge badge-cyan"
                    style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                    <Sparkles size={11} /> {sk}
                    <button type="button" onClick={() => setSkills(skills.filter(s => s !== sk))}
                      style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <input type="text" className="form-input" placeholder="Add skill (e.g. Kubernetes, AWS)"
                  value={newSkillInput} onChange={e => setNewSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddSkill(); } }} />
                <button type="button" className="btn btn-secondary" onClick={handleAddSkill} style={{ whiteSpace: "nowrap" }}>
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Briefcase size={20} color="#F59E0B" /> Highlighted Projects
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem" }}>
                {projects.map((p, i) => (
                  <div key={i} style={{
                    background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "var(--radius-sm)", padding: "0.75rem 1rem",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start"
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{p.title}</div>
                      {p.tech?.length > 0 && (
                        <div style={{ fontSize: "0.77rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                          {Array.isArray(p.tech) ? p.tech.join(", ") : p.tech}
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => setProjects(projects.filter((_, pi) => pi !== i))}
                      style={{ background: "none", border: "none", color: "#FB7185", cursor: "pointer" }}>
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.6rem", alignItems: "flex-end" }}>
                <div>
                  <label className="form-label" style={{ fontSize: "0.78rem" }}>Project Title</label>
                  <input type="text" className="form-input" placeholder="e.g. E-Commerce API" value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "0.78rem" }}>Technologies (comma-sep)</label>
                  <input type="text" className="form-input" placeholder="React, Node.js, SQL" value={newProjectTech} onChange={e => setNewProjectTech(e.target.value)} />
                </div>
                <button type="button" className="btn btn-secondary" onClick={handleAddProject} style={{ alignSelf: "flex-end" }}>
                  <Plus size={14} /> Add
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.25rem" }}>
                <div>
                  <label className="form-label" style={{ fontSize: "0.8rem" }}>GitHub / GitLab URL</label>
                  <input type="url" className="form-input" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/username" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "0.8rem" }}>Portfolio URL (optional)</label>
                  <input type="url" className="form-input" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder="https://myportfolio.dev" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Resume Upload ─────────────────────────────────────────── */}
        {currentStep === 4 && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <UploadCloud size={20} color="#38BDF8" /> Upload Your Resume
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Upload your PDF or JPG resume. Our AI will instantly calculate your <strong style={{ color: "#34D399" }}>ATS Score</strong> and flag keyword matches for <strong style={{ color: "var(--accent-cyan)" }}>{companyName}</strong>.
            </p>

            {/* Drop Zone */}
            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? "#38BDF8" : "rgba(56,189,248,0.3)"}`,
                  borderRadius: "var(--radius-md)",
                  padding: "3rem 2rem",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragActive ? "rgba(56,189,248,0.06)" : "rgba(255,255,255,0.02)",
                  transition: "all 0.2s ease",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem"
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(56,189,248,0.12)", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <UploadCloud size={28} color="#38BDF8" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.3rem" }}>
                    Drag & Drop your Resume here
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    or <span style={{ color: "#38BDF8", textDecoration: "underline" }}>click to browse</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
                    Supported: PDF, JPG, PNG • Max 10 MB
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              /* Resume Uploaded Card */
              <div style={{
                border: "1px solid rgba(16,185,129,0.35)",
                borderRadius: "var(--radius-md)",
                padding: "1.25rem 1.5rem",
                background: "rgba(16,185,129,0.06)",
                display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap"
              }}>
                {/* Thumbnail */}
                {uploadedFile.isImage ? (
                  <img src={uploadedFile.dataUrl} alt="resume"
                    style={{ width: 56, height: 72, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)" }} />
                ) : (
                  <div style={{
                    width: 56, height: 72, borderRadius: 6,
                    background: "rgba(56,189,248,0.15)", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: "0.2rem"
                  }}>
                    <FileText size={22} color="#38BDF8" />
                    <span style={{ fontSize: "0.6rem", color: "#38BDF8", fontWeight: 700 }}>PDF</span>
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {uploadedFile.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {uploadedFile.size} • Uploaded {uploadedFile.uploadedAt || "Just now"}
                  </div>
                  {atsScore > 0 && (
                    <div style={{ marginTop: "0.4rem" }}>
                      <span className="badge badge-emerald" style={{ fontSize: "0.75rem" }}>
                        <CheckCircle2 size={12} style={{ marginRight: "0.25rem" }} />
                        ATS Score: {atsScore}%
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {uploadedFile.dataUrl && (
                    <a href={uploadedFile.dataUrl} target="_blank" rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <Eye size={14} /> Preview
                    </a>
                  )}
                  <button type="button" className="btn btn-secondary" onClick={handleRemoveResume}
                    style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem", color: "#FB7185", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            )}

            {/* Upload status message */}
            {uploadMsg && (
              <div style={{
                marginTop: "1rem", padding: "0.75rem 1rem",
                background: uploadMsg.startsWith("⚠") ? "rgba(244,63,94,0.1)" : "rgba(16,185,129,0.08)",
                border: `1px solid ${uploadMsg.startsWith("⚠") ? "rgba(244,63,94,0.3)" : "rgba(16,185,129,0.25)"}`,
                borderRadius: "var(--radius-sm)", fontSize: "0.85rem",
                color: uploadMsg.startsWith("⚠") ? "#FDA4AF" : "#34D399",
                display: "flex", alignItems: "center", gap: "0.5rem"
              }}>
                {uploading && <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>}
                {uploadMsg}
              </div>
            )}

            {/* ATS Score progress bar */}
            {atsScore > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>ATS Match Score</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 800, color: atsScore >= 70 ? "#34D399" : atsScore >= 50 ? "#FBBF24" : "#FB7185" }}>
                    {atsScore}%
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{
                    width: `${atsScore}%`,
                    background: atsScore >= 70 ? "linear-gradient(90deg,#10B981,#06B6D4)" : atsScore >= 50 ? "linear-gradient(90deg,#F59E0B,#EF4444)" : "linear-gradient(90deg,#EF4444,#DC2626)"
                  }} />
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.3rem" }}>
                  {atsScore >= 70 ? "🟢 Excellent ATS match! You are highly visible to recruiters." : atsScore >= 50 ? "🟡 Good — add more relevant keywords from the job description." : "🔴 Low match — update your resume with the required skills."}
                </p>
              </div>
            )}

            {/* Skip note */}
            <p style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: "var(--text-dim)", textAlign: "center" }}>
              Resume upload is <strong>strongly recommended</strong> but not mandatory. You can skip and proceed to the next step.
            </p>
          </div>
        )}

        {/* STEP 5 — Statement of Purpose */}
        {currentStep === 5 && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles size={20} color="var(--accent-cyan)" /> Statement of Purpose / Motivation
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Why do you want to join <strong style={{ color: "#34D399" }}>{companyName}</strong> for the <strong style={{ color: "var(--accent-cyan)" }}>{roleTitle}</strong> role?
            </p>
            <textarea
              className="form-textarea"
              rows={8}
              value={statementOfInterest}
              onChange={e => setStatementOfInterest(e.target.value)}
              placeholder={`Share your passion for ${roleTitle} at ${companyName}...`}
              style={{ fontSize: "0.92rem", lineHeight: 1.7 }}
            />
            <div style={{
              marginTop: "0.5rem", display: "flex", justifyContent: "space-between",
              fontSize: "0.78rem", color: statementOfInterest.length < 30 ? "#FB7185" : "#34D399"
            }}>
              <span>{statementOfInterest.length} characters</span>
              <span>{statementOfInterest.length < 30 ? "Minimum 30 characters required" : "✓ Good length"}</span>
            </div>
          </div>
        )}

        {/* STEP 6 — Review & Submit */}
        {currentStep === 6 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={20} color="#34D399" /> Review Your Application
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: "1rem" }}>
              {[
                { label: "Candidate",    value: fullName,   sub: `${rollNumber} • ${email}` },
                { label: "Academic",     value: `CGPA: ${cgpa}`, sub: `${department} • ${batchYear} • ${backlogs} Backlogs` },
                { label: "Location",     value: locationHub.split("•")[0].trim(), sub: phone },
                { label: "Target Role",  value: roleTitle,  sub: `${companyName} — ${formatCompensation(packageCtc, currency)}` },
                { label: "Resume",       value: uploadedFile ? `✓ ${uploadedFile.name}` : "Not uploaded", sub: atsScore > 0 ? `ATS Score: ${atsScore}%` : "Upload recommended" },
              ].map(c => (
                <div key={c.label} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "var(--radius-sm)", padding: "0.9rem 1.1rem"
                }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>{c.label}</div>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.value}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{c.sub}</div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>SKILLS ({skills.length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {skills.map((s, i) => <span key={i} className="badge badge-cyan" style={{ fontSize: "0.78rem" }}>{s}</span>)}
              </div>
            </div>

            {/* Statement preview */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>STATEMENT OF PURPOSE</div>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.7 }}>{statementOfInterest}</p>
            </div>

            {/* Error */}
            {errorMsg && (
              <div style={{
                background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.35)",
                color: "#FDA4AF", borderRadius: "var(--radius-sm)", padding: "0.75rem 1rem",
                fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem"
              }}>
                <AlertCircle size={16} color="#FB7185" /> {errorMsg}
              </div>
            )}

            {/* Declaration */}
            <div style={{
              background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: "var(--radius-sm)", padding: "1.1rem"
            }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer", fontSize: "0.85rem", color: "#E2E8F0" }}>
                <input
                  type="checkbox" checked={affirmationChecked} onChange={e => setAffirmationChecked(e.target.checked)}
                  style={{ marginTop: "0.2rem", accentColor: "#10B981", width: 16, height: 16 }}
                />
                <span>
                  <strong style={{ color: "#34D399" }}>Statutory Certification:</strong> I certify that all academic
                  credentials, skills, project details, and resume submitted for{" "}
                  <strong>{companyName}</strong> are true and accurate, subject to institutional verification
                  by the placement cell and corporate talent acquisition team.
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation Buttons ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", gap: "1rem" }}>
        <button type="button" className="btn btn-secondary"
          onClick={() => currentStep === 1 ? onBack() : setCurrentStep(s => s - 1)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.25rem" }}>
          <ArrowLeft size={16} /> {currentStep === 1 ? "Cancel" : "Previous"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Step {currentStep} of {STEPS.length}</span>

          {currentStep < STEPS.length ? (
            <button type="button" className="btn btn-primary"
              disabled={!canProceed()}
              onClick={() => setCurrentStep(s => s + 1)}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.65rem 1.5rem", fontWeight: 700,
                opacity: canProceed() ? 1 : 0.45
              }}>
              Next Step <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" className="btn btn-primary"
              disabled={isSubmitting || !affirmationChecked}
              onClick={handleFinalSubmit}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.65rem 1.75rem", fontWeight: 700,
                background: "linear-gradient(135deg,#10B981,#06B6D4)",
                opacity: affirmationChecked ? 1 : 0.45
              }}>
              {isSubmitting ? "Submitting..." : <><Send size={16} /> Submit Registration &amp; Apply</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
