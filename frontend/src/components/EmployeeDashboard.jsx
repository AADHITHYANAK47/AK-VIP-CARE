import React, { useState, useEffect, useRef } from "react";
import { 
  UserCheck, Briefcase, Globe, Award, Target, Mic, FileText, 
  TrendingUp, Sparkles, ChevronRight, CheckCircle2, ShieldCheck,
  Building2, Cpu, Rocket, Zap, BookOpen, Users, Compass, Check,
  UploadCloud, Trash2, Eye, FileCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import { api, formatCompensation, saveUploadedResume, getUploadedResume } from "../services/api";
import CareerRoadmapModal from "./CareerRoadmapModal";
import MockInterviewModal from "./MockInterviewModal";
import ResumeViewerModal from "./ResumeViewerModal";
import StudentDetailsModal from "./StudentDetailsModal";
import RegisterCompanyModal from "./RegisterCompanyModal";
import StudentRegistrationPage from "./StudentRegistrationPage";

export default function EmployeeDashboard({ currentUser, currency = "INR" }) {
  const [studentData, setStudentData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Sub-Navigation Tab: "gigs" | "ladder" | "upskilling" | "mobility"
  const [activeSubTab, setActiveSubTab] = useState("gigs");

  // Requisitions Hub Filter
  const [selectedHub, setSelectedHub] = useState("all");

  // Registration Page navigation (replaces modal for apply flow)
  const [registrationPageDrive, setRegistrationPageDrive] = useState(null);
  const [selectedRegisterDrive, setSelectedRegisterDrive] = useState(null);
  const [isRegisterCompanyModalOpen, setIsRegisterCompanyModalOpen] = useState(false);
  const [viewingApplicationForm, setViewingApplicationForm] = useState(null);
  const [isViewFormModalOpen, setIsViewFormModalOpen] = useState(false);

  // Technical Portfolio & RFC parser state
  const [portfolioText, setPortfolioText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseMsg, setParseMsg] = useState("");

  // PDF / JPG File Upload State
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewingPortfolio, setPreviewingPortfolio] = useState(false);
  const [uploadMode, setUploadMode] = useState("file"); // "file" | "text"
  const fileInputRef = useRef(null);

  // Innovation Gigs Marketplace state
  const [joinedGigs, setJoinedGigs] = useState([]);
  const innovationGigs = [
    {
      id: "gig-envoy",
      title: "Multi-Region Envoy Edge Mesh Optimization",
      squad: "Core Edge Mesh Squad (Bengaluru HQ 🇮🇳)",
      lead: "Priya Venkatesh, VP Eng",
      timeCommitment: "5 hrs / week",
      duration: "6 Weeks",
      skills: ["Envoy", "Go", "Distributed Tracing", "gRPC"],
      description: "Assist in rolling out zero-downtime canary routing across Bengaluru and Mumbai edge points of presence.",
      reward: "IC6 Systems Architecture Endorsement"
    },
    {
      id: "gig-redis",
      title: "Real-Time ML Feature Store on Redis Enterprise",
      squad: "Continuous ML Calibration Squad (Hyderabad R&D Center 🇮🇳)",
      lead: "AI Platform Team",
      timeCommitment: "6 hrs / week",
      duration: "4 Weeks",
      skills: ["Redis", "Python", "Kafka", "Feature Store"],
      description: "Build high-throughput caching layer for Explainable AI (XAI) feature attribution vectors with sub-10ms SLAs.",
      reward: "AI Engineering Badge & Co-Authorship"
    },
    {
      id: "gig-ebpf",
      title: "Kernel-Level Observability with eBPF & Cilium",
      squad: "Cloud Infrastructure (Pune Tech Hub 🇮🇳)",
      lead: "Infrastructure Lead",
      timeCommitment: "4 hrs / week",
      duration: "8 Weeks",
      skills: ["eBPF", "Kubernetes", "Linux Kernel", "Go"],
      description: "Instrument microservices with non-intrusive eBPF probes to catch distributed deadlock conditions across cross-cloud nodes.",
      reward: "Principal Systems Architecture Credit"
    }
  ];

  // Mentorship Network state
  const [requestedMentors, setRequestedMentors] = useState([]);
  const mentorList = [
    {
      id: "mentor-priya",
      name: "Priya Venkatesh",
      title: "VP of Engineering & Platform Lead",
      hub: "Bengaluru HQ 🇮🇳 • Outer Ring Road",
      expertise: ["Distributed Systems", "IC6 Staff+ Mentorship", "Cloud Architecture"],
      availability: "2 Slots Open (Bi-Weekly)"
    },
    {
      id: "mentor-kavita",
      name: "Dr. Kavita Nair",
      title: "Chief People Officer & National DEI Lead",
      hub: "Mumbai HQ 🇮🇳 • BKC & Pune Hub",
      expertise: ["Statutory AI Compliance", "Executive Talent Mobility", "Org Design"],
      availability: "1 Slot Open (Monthly)"
    },
    {
      id: "mentor-rajesh",
      name: "Rajesh Natarajan",
      title: "Principal Infrastructure Architect (IC7)",
      hub: "Chennai Tech Hub 🇮🇳 • OMR IT Corridor",
      expertise: ["Kubernetes Infrastructure", "Fault Tolerance", "Multi-Region Clouds"],
      availability: "3 Slots Open (Weekly)"
    }
  ];

  // Modals
  const [selectedRoadmapDrive, setSelectedRoadmapDrive] = useState(null);
  const [selectedMockDrive, setSelectedMockDrive] = useState(null);

  useEffect(() => {
    loadEmployeeData();
  }, [currentUser]);

  async function loadEmployeeData() {
    try {
      setLoading(true);
      const empId = currentUser?.student_id || 1;
      
      const [emp, recsData, appsData] = await Promise.all([
        api.getStudent(empId),
        api.getStudentRecommendations(empId),
        api.getStudentApplications(empId)
      ]);

      setStudentData(emp);
      setRecommendations(recsData);
      setApplications(appsData);
      setPortfolioText(emp.resume_text || "");

      // Load persistent uploaded resume (PDF / JPG)
      const savedDoc = getUploadedResume(empId);
      if (savedDoc) {
        setUploadedFile(savedDoc);
      }
    } catch (err) {
      console.error("Failed to load employee data", err);
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelected(file) {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImg = file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png)$/i);
    
    if (!isPdf && !isImg) {
      alert("⚠️ Invalid file format! Please upload an official PDF (.pdf) or image (.jpg, .png) portfolio document.");
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
        uploadedAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      };

      saveUploadedResume(studentData.id, fileData);
      setUploadedFile(fileData);
      confetti({ particleCount: 45, spread: 60 });
      setParseMsg(`✅ Successfully uploaded "${file.name}"! Technical portfolio is ready for Engineering Director and Staff Review.`);

      try {
        const updated = await api.updateStudent(studentData.id, {
          profile_strength: Math.min(100, (studentData.profile_strength || 80) + 8)
        });
        setStudentData(updated);
      } catch (err) {
        console.warn("Could not update profile strength", err);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveFile() {
    if (window.confirm("Remove uploaded portfolio document? You can upload a replacement PDF or JPG at any time.")) {
      localStorage.removeItem(`careerlens_resume_${studentData.id}`);
      setUploadedFile(null);
      setParseMsg("Portfolio removed. You can upload an updated version anytime.");
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }

  async function handleParsePortfolio() {
    if (!portfolioText.trim()) return;
    try {
      setParsing(true);
      setParseMsg("");
      const parsed = await api.parseResume(portfolioText);
      const updated = await api.updateStudent(studentData.id, {
        skills: Array.from(new Set([...studentData.skills, ...parsed.skills])),
        profile_strength: Math.min(100, studentData.profile_strength + 10),
        resume_text: portfolioText
      });
      setStudentData(updated);
      setParseMsg(`✨ Extracted ${parsed.skills.length} architecture competencies & updated promotion readiness!`);
      const newRecs = await api.getStudentRecommendations(studentData.id);
      setRecommendations(newRecs);
    } catch (err) {
      setParseMsg(`Failed to extract competencies: ${err.message}`);
    } finally {
      setParsing(false);
    }
  }

  async function handleApplyMobility(driveId) {
    const targetDrive = recommendations.find(r => r.drive_id === driveId);
    if (targetDrive) {
      // Navigate to full registration page instead of modal
      setRegistrationPageDrive(targetDrive);
    } else {
      try {
        const res = await api.applyToDrive(studentData.id, driveId);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        alert(`🎉 ${res.message}! Fit Score: ${res.match_score}%`);
        const apps = await api.getStudentApplications(studentData.id);
        setApplications(apps);
      } catch (err) {
        alert(`Internal mobility request failed: ${err.message}`);
      }
    }
  }

  async function handleApplyWithDetails(formPayload) {
    try {
      const driveId = formPayload.driveId;
      await api.applyToDrive(studentData.id, driveId, formPayload);
      const apps = await api.getStudentApplications(studentData.id);
      setApplications(apps);
      const newRecs = await api.getStudentRecommendations(studentData.id);
      setRecommendations(newRecs);
      setRegistrationPageDrive(null);
      setSelectedRegisterDrive(null);
    } catch (err) {
      throw err; // Let StudentRegistrationPage display the error
    }
  }

  async function handleCompanyCreated(createdDrive) {
    setIsRegisterCompanyModalOpen(false);
    try {
      const newRecs = await api.getStudentRecommendations(studentData.id);
      setRecommendations(newRecs);
    } catch (e) {
      console.error("Error refreshing requisitions", e);
    }
    const driveForPage = {
      ...createdDrive,
      drive_id: createdDrive.drive_id || createdDrive.id,
      match_score: createdDrive.match_score ?? 80,
    };
    setRegistrationPageDrive(driveForPage);
  }

  function handleJoinGig(gigId) {
    if (joinedGigs.includes(gigId)) return;
    setJoinedGigs([...joinedGigs, gigId]);
    confetti({ particleCount: 40, spread: 50 });
    alert("🚀 Successfully joined innovation sprint! Project lead notified and calendar invite dispatched.");
  }

  function handleRequestMentor(mentorId) {
    if (requestedMentors.includes(mentorId)) return;
    setRequestedMentors([...requestedMentors, mentorId]);
    alert("🤝 Mentorship request submitted! You will receive an intro email within 24 hours.");
  }

  if (loading || !studentData) {
    return (
      <div className="glass-panel" style={{ padding: "3.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        Loading employee profile, IC level matrix, and global internal mobility requisitions...
      </div>
    );
  }

  // ── Full-page registration flow ──
  if (registrationPageDrive) {
    return (
      <StudentRegistrationPage
        drive={registrationPageDrive}
        student={studentData}
        currency={currency}
        onSubmitApplication={handleApplyWithDetails}
        onBack={() => setRegistrationPageDrive(null)}
      />
    );
  }

  const employeeName = currentUser?.name || "Alex Chen";
  const employeeTitle = "Staff Distributed Systems Engineer (IC5)";
  const employeeHub = currentUser?.organization || "San Francisco Hub 🇺🇸 • Core Platform";

  // Filter recommendations by Hub
  const filteredRecs = recommendations.filter(r => {
    if (selectedHub === "all") return true;
    return r.company_name.toLowerCase().includes(selectedHub.toLowerCase());
  });

  return (
    <div id="employee-dashboard-container">
      {/* Employee Executive Profile Banner */}
      <div className="glass-panel" style={{ padding: "2rem 2.25rem", marginBottom: "1.75rem", borderLeft: "4px solid var(--accent-cyan)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ width: 68, height: 68, borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, #06B6D4, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", fontWeight: 800, color: "#FFFFFF", boxShadow: "0 4px 18px rgba(6, 182, 212, 0.3)" }}>
              {employeeName.charAt(0)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>{employeeName}</h2>
                <span className="badge badge-cyan">{employeeTitle}</span>
                <span className="badge badge-indigo">{employeeHub}</span>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "0.4rem" }}>
                Performance Rating: <strong style={{ color: "#34D399" }}>4.85 / 5.0 (Exceeds Expectations)</strong> | 
                Tenure: <strong>3.4 Years</strong> | 
                Career Target: <strong style={{ color: "var(--accent-purple)" }}>Principal Architect (IC6)</strong> | 
                Squad: <strong>Distributed Edge Mesh</strong>
              </p>
            </div>
          </div>

          {/* Internal Mobility Readiness Gauge */}
          <div style={{ minWidth: "280px", background: "rgba(0, 0, 0, 0.25)", padding: "1.1rem 1.4rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
                Internal Mobility Readiness
              </span>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#34D399" }}>
                92% (Qualified)
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: "92%", background: "linear-gradient(90deg, #10B981, #06B6D4)" }} />
            </div>
            <p style={{ fontSize: "0.74rem", color: "var(--text-dim)", marginTop: "0.45rem" }}>
              Eligible for global squad lateral transfer &amp; IC6 promotion cycle.
            </p>
          </div>
        </div>

        {/* Enterprise Core Competencies */}
        <div style={{ marginTop: "1.4rem", display: "flex", flexWrap: "wrap", gap: "0.45rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginRight: "0.3rem", fontWeight: 600 }}>Verified Competencies:</span>
          {studentData.skills.map((s, idx) => (
            <span key={idx} className="badge badge-indigo" style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Specialized Employee Sub-Navigation Tabs */}
      <div className="dashboard-subnav" id="employee-subnav">
        <button
          type="button"
          className={`subnav-btn ${activeSubTab === "gigs" ? "active" : ""}`}
          onClick={() => setActiveSubTab("gigs")}
        >
          <Rocket size={16} /> Requisitions &amp; 20% Innovation Gigs
        </button>
        <button
          type="button"
          className={`subnav-btn ${activeSubTab === "ladder" ? "active" : ""}`}
          onClick={() => setActiveSubTab("ladder")}
        >
          <Target size={16} /> Career Ladder &amp; IC Level Matrix
        </button>
        <button
          type="button"
          className={`subnav-btn ${activeSubTab === "upskilling" ? "active" : ""}`}
          onClick={() => setActiveSubTab("upskilling")}
        >
          <Sparkles size={16} /> Skill Gap &amp; Enterprise Upskilling
        </button>
        <button
          type="button"
          className={`subnav-btn ${activeSubTab === "mobility" ? "active" : ""}`}
          onClick={() => setActiveSubTab("mobility")}
        >
          <TrendingUp size={16} /> Mobility Pipeline &amp; Mentorship ({applications.length})
        </button>
      </div>

      {/* =========================================================================
          SUB-VIEW 1: REQUISITIONS & 20% INNOVATION GIGS
          ========================================================================= */}
      {activeSubTab === "gigs" && (
        <div>
          {/* Global Hub Selector */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`btn ${selectedHub === "all" ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                onClick={() => setSelectedHub("all")}
              >
                All Tech Hubs
              </button>
              <button
                type="button"
                className={`btn ${selectedHub === "Bengaluru" ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                onClick={() => setSelectedHub("Bengaluru")}
              >
                Bengaluru HQ 🇮🇳
              </button>
              <button
                type="button"
                className={`btn ${selectedHub === "Hyderabad" ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                onClick={() => setSelectedHub("Hyderabad")}
              >
                Hyderabad Hub 🇮🇳
              </button>
              <button
                type="button"
                className={`btn ${selectedHub === "Pune" ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                onClick={() => setSelectedHub("Pune")}
              >
                Pune Hub 🇮🇳
              </button>
              <button
                type="button"
                className={`btn ${selectedHub === "Chennai" ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                onClick={() => setSelectedHub("Chennai")}
              >
                Chennai Hub 🇮🇳
              </button>
            </div>

            <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
              Viewing compensation in: <strong>{currency}</strong>
            </div>
          </div>

          {/* Requisitions Grid */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Globe size={18} color="var(--accent-cyan)" /> Open Global Engineering Requisitions
              </h3>

              <button
                type="button"
                className="btn btn-primary"
                style={{
                  fontSize: "0.82rem",
                  padding: "0.45rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  background: "linear-gradient(135deg, #10B981, #06B6D4)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  border: "none",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)"
                }}
                onClick={() => setIsRegisterCompanyModalOpen(true)}
              >
                <Building2 size={15} /> + Register New Company / Requisition
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
              {filteredRecs.map((d) => (
                <div 
                  key={d.drive_id} 
                  className="glass-panel glass-panel-interactive" 
                  style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                  id={`emp-req-${d.drive_id}`}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <h4 style={{ fontSize: "1.15rem", fontWeight: 700 }}>{d.title}</h4>
                          <span className={`badge ${d.is_eligible ? "badge-emerald" : "badge-rose"}`}>
                            {d.is_eligible ? "QUALIFIED" : "LEVEL MISMATCH"}
                          </span>
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                          <strong>{d.company_name}</strong> • 
                          <span style={{ color: "var(--accent-emerald)", fontWeight: 700, margin: "0 0.4rem" }}>
                            {formatCompensation(d.package_ctc, currency)}
                          </span> • 
                          Target Effective: {d.drive_date || "Immediate"}
                        </div>
                      </div>

                      {/* Fit Score Badge */}
                      <div className={`score-circle ${d.match_score >= 75 ? "score-circle-high" : d.match_score >= 50 ? "score-circle-mid" : "score-circle-low"}`}>
                        {d.match_score.toFixed(0)}%
                      </div>
                    </div>

                    {/* XAI Attribution Explanation */}
                    <div style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.3)", fontSize: "0.82rem", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Verified Competency Overlap: {d.explanation.matched_skills.join(", ") || "None"}</span>
                        <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{d.explanation.skill_match_percentage}% Match</span>
                      </div>
                      {d.explanation.missing_skills.length > 0 && (
                        <div style={{ color: "#FB7185", marginTop: "0.2rem" }}>
                          Target Competencies for Role: {d.explanation.missing_skills.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", paddingTop: "0.5rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: "0.45rem 1rem", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700 }}
                      onClick={() => setSelectedRegisterDrive(d)}
                    >
                      <FileText size={13} /> Register for Requisition &amp; Apply
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: "0.45rem 0.85rem", fontSize: "0.82rem", color: "var(--accent-cyan)" }}
                      onClick={() => setSelectedRoadmapDrive(d)}
                    >
                      <Target size={13} /> Promotion Roadmap
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: "0.45rem 0.85rem", fontSize: "0.82rem" }}
                      onClick={() => setSelectedMockDrive(d)}
                    >
                      <Mic size={13} /> Mock Calibration Panel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 20% Innovation Gigs Marketplace */}
          <div>
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Zap size={20} color="#F59E0B" />
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Internal 20% Innovation Gigs Marketplace</h3>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                Contribute 4–6 hours/week to cross-squad high-impact initiatives. Earn IC6 promotions credits and direct executive endorsements.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
              {innovationGigs.map((gig) => {
                const isJoined = joinedGigs.includes(gig.id);
                return (
                  <div key={gig.id} className="gig-card">
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                        <span className="badge badge-purple" style={{ fontSize: "0.72rem" }}>{gig.timeCommitment} • {gig.duration}</span>
                        <span className="badge badge-indigo" style={{ fontSize: "0.72rem" }}>{gig.reward}</span>
                      </div>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0.4rem 0" }}>{gig.title}</h4>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                        🏢 {gig.squad} • Lead: <strong>{gig.lead}</strong>
                      </div>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-main)", lineHeight: 1.5, marginBottom: "1rem" }}>
                        {gig.description}
                      </p>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1.25rem" }}>
                        {gig.skills.map((sk, idx) => (
                          <span key={idx} className="badge badge-cyan" style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`btn ${isJoined ? "btn-secondary" : "btn-primary"}`}
                      style={{ width: "100%", fontSize: "0.82rem" }}
                      onClick={() => handleJoinGig(gig.id)}
                      disabled={isJoined}
                    >
                      {isJoined ? "✓ Joined Sprint Team" : "Join Innovation Sprint →"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 2: CAREER LADDER & IC LEVEL MATRIX
          ========================================================================= */}
      {activeSubTab === "ladder" && (
        <div>
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Compass size={20} color="var(--primary)" /> Engineering IC Track &amp; Leveling Matrix
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Compare your current scope against company-wide leveling expectations across System Architecture, Operational Rigor, and Influence.
            </p>
          </div>

          {/* 5-Step Career Ladder */}
          <div className="ic-ladder-track">
            <div className="ic-ladder-card">
              <div className="ic-level-tag">IC3</div>
              <div className="ic-title">Software Engineer</div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Executes tasks independently with high code quality and test coverage.
              </p>
              <div style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "#34D399" }}>✓ Completed (Tenure Yr 1)</div>
            </div>

            <div className="ic-ladder-card">
              <div className="ic-level-tag">IC4</div>
              <div className="ic-title">Senior Engineer</div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Owns microservice subsystems end-to-end, on-call rotations, and sprint goals.
              </p>
              <div style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "#34D399" }}>✓ Completed (Tenure Yr 2)</div>
            </div>

            <div className="ic-ladder-card current">
              <div className="ic-level-tag" style={{ color: "#38BDF8" }}>IC5 (CURRENT)</div>
              <div className="ic-title" style={{ color: "#38BDF8" }}>Staff Engineer</div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-main)" }}>
                Multi-team architecture lead, sets technical roadmap, drives 99.99% SLAs, mentors seniors.
              </p>
              <div style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "#34D399", fontWeight: 700 }}>
                ★ Active Role (3.4 yrs tenure)
              </div>
            </div>

            <div className="ic-ladder-card" style={{ borderColor: "rgba(168, 85, 247, 0.4)" }}>
              <div className="ic-level-tag" style={{ color: "var(--accent-purple)" }}>IC6 (TARGET)</div>
              <div className="ic-title">Principal Architect</div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Company-wide tech strategy, distributed consensus RFCs, industry patents, technical evangelism.
              </p>
              <div style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "var(--accent-purple)", fontWeight: 700 }}>
                🎯 Target Q4 Promotion Cycle
              </div>
            </div>

            <div className="ic-ladder-card">
              <div className="ic-level-tag">IC7 / Fellow</div>
              <div className="ic-title">Distinguished Fellow</div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Transformative multi-year technology bets shaping entire industry ecosystems.
              </p>
              <div style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "var(--text-dim)" }}>
                Executive Track
              </div>
            </div>
          </div>

          {/* 4 Pillars Competency Benchmark & Promotion Checklist */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.75rem" }}>
            {/* Left: 4 Pillars Benchmark */}
            <div className="glass-panel" style={{ padding: "1.75rem" }}>
              <h4 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1.25rem", color: "var(--accent-cyan)" }}>
                IC6 Principal Competency Alignment
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                    <span>1. Distributed Systems Architecture</span>
                    <strong style={{ color: "#34D399" }}>94% (Qualified)</strong>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: "94%", background: "#10B981" }} /></div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
                    Global Edge Mesh and Raft consensus implementations verified.
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                    <span>2. Operational Rigor &amp; Incident Leadership</span>
                    <strong style={{ color: "#38BDF8" }}>90% (Qualified)</strong>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: "90%", background: "#06B6D4" }} /></div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
                    Zero Sev-1 outages across 14 months of Edge Mesh service.
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                    <span>3. Influence &amp; Technical Mentorship</span>
                    <strong style={{ color: "#A855F7" }}>95% (Exceeds)</strong>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: "95%", background: "#A855F7" }} /></div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
                    Mentored 4 Senior Engineers toward Staff promotion packets.
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                    <span>4. Cross-Org Strategic Vision &amp; RFCs</span>
                    <strong style={{ color: "#FBBF24" }}>88% (In Progress)</strong>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: "88%", background: "#F59E0B" }} /></div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
                    Draft RFC for Cross-Cloud Consistency Engine currently under review.
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Promotion Readiness Checklist */}
            <div className="glass-panel" style={{ padding: "1.75rem" }}>
              <h4 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1.25rem", color: "#34D399" }}>
                IC6 Promotion Readiness Checklist
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.75rem", background: "rgba(16, 185, 129, 0.08)", borderRadius: "var(--radius-sm)" }}>
                  <CheckCircle2 size={18} color="#34D399" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Lead Multi-Region Architecture RFC</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>RFC-112 completed and ratified by London &amp; SF tech committees.</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.75rem", background: "rgba(16, 185, 129, 0.08)", borderRadius: "var(--radius-sm)" }}>
                  <CheckCircle2 size={18} color="#34D399" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Publish or File Enterprise Technical Patent</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Patent US11283921B2 (Distributed Transaction Consistency) granted.</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.75rem", background: "rgba(245, 158, 11, 0.08)", borderRadius: "var(--radius-sm)" }}>
                  <Target size={18} color="#F59E0B" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Drive Cross-Cloud Federation Proof of Concept</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Targeted completion in current sprint (20% Innovation Gig).</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.75rem", background: "rgba(16, 185, 129, 0.08)", borderRadius: "var(--radius-sm)" }}>
                  <CheckCircle2 size={18} color="#34D399" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Sponsor 3 Senior Engineers to Staff Level</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>All 3 direct mentees passed IC5 promotional committees.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 3: SKILL GAP & ENTERPRISE UPSKILLING
          ========================================================================= */}
      {activeSubTab === "upskilling" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.75rem" }}>
          {/* Left: Recommended Internal Academy Masterclasses */}
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BookOpen size={20} color="var(--accent-cyan)" /> Curated Enterprise Upskilling
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Internal Masterclasses designed to bridge technical gaps between Staff (IC5) and Principal (IC6).
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span className="badge badge-cyan">4 Modules • Self-Paced</span>
                  <span style={{ fontSize: "0.75rem", color: "#34D399", fontWeight: 700 }}>Recommended for IC6</span>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: 800 }}>Advanced Distributed Consensus: Raft &amp; Paxos Internals</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                  Covers split-brain mitigation, log compaction, dynamic cluster membership, and zero-loss partition tolerance.
                </p>
                <div style={{ marginTop: "0.75rem" }}>
                  <button className="btn btn-primary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}>
                    Start Masterclass →
                  </button>
                </div>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span className="badge badge-purple">Live Workshop • Berlin Hub</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-purple)", fontWeight: 700 }}>Interactive Lab</span>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: 800 }}>Kernel Observability with eBPF &amp; Cilium Service Mesh</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                  Hands-on instrumentation of Linux kernel socket layers to trace microservice latency without sidecar proxies.
                </p>
                <div style={{ marginTop: "0.75rem" }}>
                  <button className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}>
                    Reserve Workshop Seat
                  </button>
                </div>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span className="badge badge-indigo">Statutory Governance</span>
                  <span style={{ fontSize: "0.75rem", color: "#67E8F9", fontWeight: 700 }}>Joint Compliance Session</span>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: 800 }}>EU AI Act Articles 9 &amp; 10 Technical Risk Architecture</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                  Learn continuous validation patterns for machine learning feature attribution models under statutory audits.
                </p>
                <div style={{ marginTop: "0.75rem" }}>
                  <button className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}>
                    Watch Recording
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Technical Portfolio PDF/JPG Uploader & Parser */}
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                <FileText size={18} color="var(--accent-cyan)" /> Technical Portfolio &amp; Resume
              </h3>
              <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-sm)", padding: "0.2rem" }}>
                <button
                  type="button"
                  className={`btn ${uploadMode === "file" ? "btn-primary" : "btn-secondary"}`}
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem", border: "none" }}
                  onClick={() => setUploadMode("file")}
                >
                  📁 PDF / JPG File
                </button>
                <button
                  type="button"
                  className={`btn ${uploadMode === "text" ? "btn-primary" : "btn-secondary"}`}
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem", border: "none" }}
                  onClick={() => setUploadMode("text")}
                >
                  ✍️ Plain Text
                </button>
              </div>
            </div>

            {uploadMode === "file" ? (
              <div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                  Upload your comprehensive Staff/Principal technical portfolio, patent artifacts, or resume in <strong>PDF</strong> or <strong>JPG/PNG</strong> format for Engineering Leadership review.
                </p>

                {uploadedFile ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="file-preview-card">
                      <div className="file-preview-left">
                        {uploadedFile.isImage ? (
                          <img src={uploadedFile.dataUrl} alt="Thumbnail" className="file-thumb-preview" />
                        ) : (
                          <div className="file-type-badge-icon file-type-pdf">PDF</div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text-main)" }}>
                            {uploadedFile.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            {uploadedFile.size} • Uploaded {uploadedFile.uploadedAt} • <span style={{ color: "#34D399", fontWeight: 700 }}>✓ Verified Portfolio</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                          onClick={() => setPreviewingPortfolio(true)}
                          title="Inspect document in high fidelity viewer"
                        >
                          <Eye size={14} /> View Document
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: "0.78rem", padding: "0.4rem 0.6rem" }}
                          onClick={handleRemoveFile}
                          title="Remove uploaded document"
                        >
                          <Trash2 size={14} color="#FB7185" />
                        </button>
                      </div>
                    </div>

                    <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "var(--radius-sm)", padding: "0.85rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      <span style={{ color: "#34D399", fontWeight: 700 }}>Engineering Leadership Ready: </span>
                      Directors &amp; Hiring Managers can inspect your complete system designs, patents, and benchmark metrics with Explainable AI attribution.
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                        Want to replace with a newer version?
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Upload Replacement File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Drag and Drop Zone */}
                    <div
                      className={`resume-dropzone ${dragActive ? "drag-active" : ""}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="dropzone-icon-wrap">
                        <UploadCloud size={28} />
                      </div>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.35rem" }}>
                        Drag &amp; Drop Technical Portfolio
                      </h4>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.85rem" }}>
                        or click to browse from your device
                      </p>
                      <div style={{ display: "inline-flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                        <span className="badge badge-rose" style={{ fontSize: "0.7rem" }}>.PDF Document</span>
                        <span className="badge badge-cyan" style={{ fontSize: "0.7rem" }}>.JPG / .PNG Image</span>
                        <span className="badge badge-indigo" style={{ fontSize: "0.7rem" }}>Max 10 MB</span>
                      </div>
                    </div>

                    <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                        No PDF handy? Test with 1-click sample:
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
                        onClick={() => {
                          const samplePayload = {
                            name: `${currentUser?.name?.replace(/\s+/g, "_") || "Alex_Chen"}_Staff_Portfolio.pdf`,
                            size: "420 KB",
                            type: "application/pdf",
                            isImage: false,
                            dataUrl: null,
                            uploadedAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          };
                          saveUploadedResume(studentData.id, samplePayload);
                          setUploadedFile(samplePayload);
                          confetti({ particleCount: 35, spread: 50 });
                          setParseMsg("✅ Sample Staff Engineer portfolio loaded successfully!");
                        }}
                      >
                        Load Staff Engineer Portfolio PDF Sample
                      </button>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  Paste internal architecture contributions, patents, microservices deployed, and leadership notes.
                </p>

                <textarea
                  className="form-textarea"
                  rows={8}
                  value={portfolioText}
                  onChange={(e) => setPortfolioText(e.target.value)}
                  placeholder="Paste internal architecture contributions, patents, microservices deployed, and leadership notes..."
                />

                <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                    onClick={() => setPortfolioText(
                      `Alex Chen | Staff Distributed Systems Engineer (IC5)\nSkills: Go, Kubernetes, gRPC, Distributed Consensus, Envoy, Python, Kafka, System Design, Terraform, Distributed Tracing, eBPF\nTenure: 3.4 years | Performance: Exceeds Expectations (4.85/5.0)\nProjects:\n- Global Multi-Region Edge Mesh servicing 1.2M req/sec with Go and Envoy\n- Zero-Downtime Data Migration pipeline with Apache Kafka and Raft consensus\n- Mentored 4 Senior Engineers toward Staff level promotions\nPatents: US11283921B2 Distributed Transaction Consistency in Cross-Cloud Networks`
                    )}
                  >
                    Load Staff Engineer Bio
                  </button>

                  <button 
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: "0.85rem" }}
                    onClick={handleParsePortfolio}
                    disabled={parsing}
                  >
                    {parsing ? "Extracting Competencies..." : "Parse & Update Competencies →"}
                  </button>
                </div>
              </div>
            )}

            {parseMsg && (
              <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#34D399", padding: "0.5rem 0.75rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "var(--radius-sm)" }}>
                {parseMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 4: MOBILITY PIPELINE & PEER MENTORSHIP
          ========================================================================= */}
      {activeSubTab === "mobility" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1.75rem" }}>
          {/* Left: Mobility Progression Tracker */}
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingUp size={20} color="#10B981" /> Internal Mobility Progression Tracker
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Live lifecycle: Request Submitted ➔ Manager Calibration ➔ Architecture Calibration Panel ➔ Transfer Approval.
            </p>

            {applications.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic", padding: "2rem", textAlign: "center" }}>
                No active transfer requests yet. Navigate to <strong>Requisitions &amp; Gigs</strong> to submit a mobility transfer!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {applications.map((a) => {
                  const isOffered = a.status === "OFFERED";
                  const isShortlisted = a.status === "SHORTLISTED";
                  const isRejected = a.status === "REJECTED";

                  return (
                    <div 
                      key={a.application_id} 
                      style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.35rem" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <div>
                          <span style={{ fontWeight: 800, fontSize: "1.05rem" }}>{a.company_name}</span>
                          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>({a.role})</span>
                        </div>
                        <span className={`badge ${isOffered ? "badge-emerald" : isShortlisted ? "badge-indigo" : isRejected ? "badge-rose" : "badge-amber"}`}>
                          {isOffered ? "TRANSFER APPROVED" : a.status}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "1rem" }}>
                        Target Compensation: {formatCompensation(a.package_ctc, currency)} • Competency Fit: {a.match_score.toFixed(0)}%
                      </div>

                      {/* 4-Stage Corporate Mobility Pipeline */}
                      <div className="pipeline-stepper-5" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                        <div className="pipeline-step-node">
                          <div className="step-circle completed">✓</div>
                          <span className="step-label">Submitted</span>
                        </div>
                        <div className="pipeline-step-node">
                          <div className={`step-circle ${isShortlisted || isOffered ? "completed" : "active"}`}>
                            {isShortlisted || isOffered ? "✓" : "2"}
                          </div>
                          <span className={`step-label ${isShortlisted || isOffered ? "" : "active"}`}>Manager Calibration</span>
                        </div>
                        <div className="pipeline-step-node">
                          <div className={`step-circle ${isOffered ? "completed" : isShortlisted ? "active" : ""}`}>
                            {isOffered ? "✓" : "3"}
                          </div>
                          <span className={`step-label ${isShortlisted ? "active" : ""}`}>Architecture Panel</span>
                        </div>
                        <div className="pipeline-step-node">
                          <div className={`step-circle ${isOffered ? "completed" : isRejected ? "step-circle-rejected" : ""}`}>
                            {isOffered ? "🎉" : isRejected ? "✕" : "4"}
                          </div>
                          <span className={`step-label ${isOffered ? "active" : ""}`}>
                            {isOffered ? "Transfer Approved" : isRejected ? "Calibration Deferred" : "Final Decision"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Peer Mentorship Network */}
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={18} color="var(--primary)" /> Peer Mentorship Network
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Connect with Senior VPs and Principal Architects across international hubs for career calibration.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {mentorList.map((mentor) => {
                const isRequested = requestedMentors.includes(mentor.id);
                return (
                  <div key={mentor.id} style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{mentor.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)" }}>{mentor.title}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>{mentor.hub}</div>
                      </div>
                      <span className="badge badge-emerald" style={{ fontSize: "0.68rem" }}>{mentor.availability}</span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", margin: "0.6rem 0" }}>
                      {mentor.expertise.map((exp, idx) => (
                        <span key={idx} className="badge badge-indigo" style={{ fontSize: "0.68rem" }}>{exp}</span>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={`btn ${isRequested ? "btn-secondary" : "btn-primary"}`}
                      style={{ fontSize: "0.75rem", padding: "0.3rem 0.75rem", width: "100%", marginTop: "0.4rem" }}
                      onClick={() => handleRequestMentor(mentor.id)}
                      disabled={isRequested}
                    >
                      {isRequested ? "✓ Mentorship Requested" : "Request Mentorship Slot"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedRoadmapDrive && (
        <CareerRoadmapModal
          studentId={studentData.id}
          driveId={selectedRoadmapDrive.drive_id}
          onClose={() => setSelectedRoadmapDrive(null)}
        />
      )}

      {selectedMockDrive && (
        <MockInterviewModal
          drive={selectedMockDrive}
          onClose={() => setSelectedMockDrive(null)}
        />
      )}

      {/* Technical Portfolio & Resume Viewer Modal */}
      {previewingPortfolio && (
        <ResumeViewerModal
          candidate={{
            student_id: studentData.id,
            id: studentData.id,
            student_name: currentUser?.name || studentData.name,
            department: studentData.department,
            cgpa: studentData.cgpa,
            match_score: studentData.profile_strength || 88,
            explanation: {
              matched_skills: studentData.skills,
              missing_skills: []
            }
          }}
          currency={currency}
          onClose={() => setPreviewingPortfolio(false)}
        />
      )}

      {/* Student/Candidate Details Form Modal */}
      {selectedRegisterDrive && (
        <StudentDetailsModal
          isOpen={Boolean(selectedRegisterDrive)}
          drive={selectedRegisterDrive}
          student={studentData}
          currency={currency}
          onSubmitApplication={handleApplyWithDetails}
          onClose={() => setSelectedRegisterDrive(null)}
        />
      )}

      {/* Register New Company / Requisition Modal */}
      {isRegisterCompanyModalOpen && (
        <RegisterCompanyModal
          isOpen={isRegisterCompanyModalOpen}
          registeredByRole="employee"
          onCompanyCreated={handleCompanyCreated}
          onClose={() => setIsRegisterCompanyModalOpen(false)}
        />
      )}
    </div>
  );
}

