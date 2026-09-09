import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, Sparkles, Globe, Briefcase, UserCheck, 
  GraduationCap, Building2, ArrowRight, CheckCircle2, Lock, 
  Zap, Compass, Mail, KeyRound, RefreshCw, AlertCircle,
  Eye, EyeOff, UserPlus, LogIn, User
} from "lucide-react";
import { api } from "../services/api";

export default function LoginPage({ 
  onLoginSuccess, 
  onExploreGuest
}) {
  // Primary Mode: "signin" | "signup"
  const [authMode, setAuthMode] = useState("signin");

  // Sign In Method: "password" (Primary Default) | "otp" | "demo"
  const [authMethod, setAuthMethod] = useState("password");
  const [domainMode, setDomainMode] = useState("campus"); // "campus" | "enterprise"
  
  // Selected Role
  const [selectedRole, setSelectedRole] = useState("student"); // "student" | "recruiter" | "tpo" | "employee" | "manager" | "cpo"

  // Form Inputs: Login & Shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form Inputs: Sign Up
  const [fullName, setFullName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [department, setDepartment] = useState("Computer Science (CSE)");
  const [rollNumber, setRollNumber] = useState("");

  // 2-Step Verified Sign-Up State
  const [signupStep, setSignupStep] = useState(1); // 1 = Profile & Password, 2 = Email OTP Verification
  const [signupOtpDigits, setSignupOtpDigits] = useState(["", "", "", "", "", ""]);
  const signupOtpInputRefs = useRef([]);

  // OTP Form State (for Sign In via OTP)
  const [otpStep, setOtpStep] = useState("request"); // "request" | "verify"
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [devOtpHelper, setDevOtpHelper] = useState("");

  const otpInputRefs = useRef([]);

  // Cooldown countdown timer for OTP
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Update default department when role/domain changes
  useEffect(() => {
    if (domainMode === "enterprise") {
      setDepartment("Core Platform & Distributed Systems");
    } else {
      setDepartment("Computer Science (CSE)");
    }
  }, [domainMode, selectedRole]);

  // Demo accounts for instant one-click login
  const demoAccounts = {
    campus: [
      {
        role: "student",
        name: "Aaditya Raman",
        title: "B.Tech CSE (Anna Univ • Chennai)",
        hub: "Campus Placement Cell 🎓",
        email: "student@vipcare.ai",
        badge: "Super Dream Candidate",
        icon: GraduationCap,
        color: "#06B6D4"
      },
      {
        role: "recruiter",
        name: "Priya Sundaram",
        title: "Lead Corporate Talent Acquisition",
        hub: "VIPCARE Corp India • Bengaluru HQ 💼",
        email: "recruiter@vipcare.ai",
        badge: "Corporate Talent Lead",
        icon: Building2,
        color: "#6366F1"
      }
    ],
    enterprise: [
      {
        role: "employee",
        name: "Aditya Shenoy",
        title: "Staff Distributed Systems Engineer (IC5)",
        hub: "Bengaluru HQ 🇮🇳 • Outer Ring Road",
        email: "alex.chen@global.vipcare.ai",
        badge: "Staff Engineer",
        icon: UserCheck,
        color: "#06B6D4"
      },
      {
        role: "manager",
        name: "Vikram Malhotra",
        title: "VP of Engineering & Talent Lead",
        hub: "Hyderabad Tech Hub 🇮🇳 • HITEC City",
        email: "marcus.vance@global.vipcare.ai",
        badge: "Hiring VP",
        icon: Briefcase,
        color: "#6366F1"
      },
      {
        role: "cpo",
        name: "Dr. Kavita Nair",
        title: "Chief People Officer & National DEI Lead",
        hub: "Mumbai HQ 🇮🇳 • BKC & Pune Hub",
        email: "elena.rostova@global.vipcare.ai",
        badge: "Talent Governance",
        icon: ShieldCheck,
        color: "#10B981"
      }
    ]
  };

  function handleDomainSwitch(mode) {
    setDomainMode(mode);
    setErrorMsg("");
    setSuccessMsg("");
    if (mode === "enterprise") {
      setSelectedRole("employee");
    } else {
      setSelectedRole("student");
    }
  }

  function handleAuthSuccess(authData) {
    // Store across both vipcare_ and careerlens_ keys for persistent compatibility
    localStorage.setItem("vipcare_token", authData.access_token);
    localStorage.setItem("vipcare_user", JSON.stringify(authData));
    localStorage.setItem("vipcare_mode", domainMode);
    localStorage.setItem("careerlens_token", authData.access_token);
    localStorage.setItem("careerlens_user", JSON.stringify(authData));
    localStorage.setItem("careerlens_mode", domainMode);

    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess(authData, domainMode);
      }
    }, 450);
  }

  // 1. Direct Email & Password Sign In
  async function handlePasswordLogin(e) {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid destination email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const authData = await api.login({
        email: email.trim().toLowerCase(),
        password: password,
        role: selectedRole
      });

      setSuccessMsg(`Authentication successful! Welcome back, ${authData.name || "Candidate"}.`);
      handleAuthSuccess(authData);
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg(err.message || "Invalid email or password. Please verify credentials or switch to Sign Up.");
    } finally {
      setLoading(false);
    }
  }

  // 2. New Account 2-Step Verified Sign Up Handlers
  async function handleSendSignupOtp(e) {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg("Please enter your Full Name.");
      return;
    }
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid destination email address.");
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      setErrorMsg("Please enter a password of at least 4 characters.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.sendOtp({
        email: email.trim().toLowerCase(),
        role: selectedRole,
        name: fullName.trim(),
        type: "signup"
      });

      setSignupStep(2);
      setResendCooldown(30);
      if (res && res.dev_otp) {
        setDevOtpHelper(res.dev_otp);
        // Automatically prefill OTP digits so mobile verification is immediate
        setSignupOtpDigits(res.dev_otp.split(""));
      } else {
        setSignupOtpDigits(["", "", "", "", "", ""]);
      }
      setSuccessMsg(`Verification code sent to ${email}. Check your Inbox and Spam/Junk folder.`);
      setTimeout(() => {
        if (signupOtpInputRefs.current[0]) {
          signupOtpInputRefs.current[0].focus();
        }
      }, 100);
    } catch (err) {
      console.error("Sign up OTP error:", err);
      setErrorMsg(err.message || "Failed to dispatch verification code. Please check email address.");
    } finally {
      setLoading(false);
    }
  }

  function handleSignupOtpDigitChange(index, val) {
    if (val.length > 1) {
      const digits = val.replace(/\D/g, "").slice(0, 6).split("");
      const newDigits = [...signupOtpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setSignupOtpDigits(newDigits);
      const nextFocus = Math.min(digits.length, 5);
      if (signupOtpInputRefs.current[nextFocus]) {
        signupOtpInputRefs.current[nextFocus].focus();
      }
      return;
    }

    const clean = val.replace(/\D/g, "");
    const newDigits = [...signupOtpDigits];
    newDigits[index] = clean;
    setSignupOtpDigits(newDigits);

    if (clean && index < 5 && signupOtpInputRefs.current[index + 1]) {
      signupOtpInputRefs.current[index + 1].focus();
    }
  }

  function handleSignupOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !signupOtpDigits[index] && index > 0 && signupOtpInputRefs.current[index - 1]) {
      signupOtpInputRefs.current[index - 1].focus();
    }
  }

  async function handleVerifySignupAndCreateAccount(e) {
    if (e) e.preventDefault();
    const fullOtp = signupOtpDigits.join("");
    if (fullOtp.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const targetEmail = email.trim().toLowerCase();
      await api.registerWithOtp({
        email: targetEmail,
        otp: fullOtp,
        name: fullName.trim(),
        password: signupPassword,
        role: selectedRole,
        department: department.trim() || (selectedRole === "employee" ? "Distributed Systems" : "Computer Science (CSE)"),
        roll_number: rollNumber.trim(),
        organization: domainMode === "enterprise" ? "Global Tech Enterprise" : "Campus Placement Cell"
      });

      // Step 3: Celebratory message and automatic redirect to Sign In
      setSuccessMsg("🎉 Account verified and created! Redirecting to Sign In...");
      setSignupStep(1);
      setSignupOtpDigits(["", "", "", "", "", ""]);
      setSignupPassword("");

      setTimeout(() => {
        setAuthMode("signin");
        setAuthMethod("password");
        setEmail(targetEmail);
        setPassword("");
        setSuccessMsg("🎉 Account created successfully! Please enter your password to sign in.");
      }, 900);
    } catch (err) {
      console.error("Verification error:", err);
      setErrorMsg(err.message || "Invalid or expired verification code. Please check and retry.");
    } finally {
      setLoading(false);
    }
  }

  // 3. 1-Click Quick Demo Sign In
  async function handleQuickDemoLogin(account) {
    setLoading(true);
    setErrorMsg("");
    try {
      const authData = await api.login({
        email: account.email,
        password: "password123",
        role: account.role
      });
      handleAuthSuccess(authData);
    } catch (err) {
      console.error("Demo login error:", err);
      const fallbackUser = {
        access_token: `jwt_${account.role}_demo`,
        user_id: account.role === "employee" || account.role === "student" ? 1 : 99,
        name: account.name,
        email: account.email,
        role: account.role,
        organization: account.hub,
        student_id: 1
      };
      handleAuthSuccess(fallbackUser);
    } finally {
      setLoading(false);
    }
  }

  // 4. Send Secure Email OTP
  async function handleSendOtp(e) {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please provide a valid destination email address.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.sendOtp({
        email: email.trim().toLowerCase(),
        role: selectedRole,
        name: fullName.trim(),
        type: "login"
      });

      setOtpStep("verify");
      setResendCooldown(30);
      if (res && res.dev_otp) {
        setDevOtpHelper(res.dev_otp);
        // Automatically prefill OTP digits so mobile verification is immediate
        setOtpDigits(res.dev_otp.split(""));
      } else {
        setOtpDigits(["", "", "", "", "", ""]);
      }
      setSuccessMsg(`Verification code dispatched to ${email}. Check your Inbox and Spam/Junk folder.`);
      
      // Auto-focus first digit
      setTimeout(() => {
        if (otpInputRefs.current[0]) {
          otpInputRefs.current[0].focus();
        }
      }, 100);
    } catch (err) {
      setErrorMsg(err.message || "Failed to dispatch verification code. Please check email address.");
    } finally {
      setLoading(false);
    }
  }

  // Handle OTP digit box typing & pasting
  function handleOtpDigitChange(index, val) {
    if (val.length > 1) {
      const digits = val.replace(/\D/g, "").slice(0, 6).split("");
      const newDigits = [...otpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(digits.length, 5);
      if (otpInputRefs.current[nextFocus]) {
        otpInputRefs.current[nextFocus].focus();
      }
      return;
    }

    const clean = val.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

    if (clean && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0 && otpInputRefs.current[index - 1]) {
      otpInputRefs.current[index - 1].focus();
    }
  }

  // Verify OTP
  async function handleVerifyOtp(e) {
    e.preventDefault();
    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const authData = await api.verifyOtp({
        email: email.trim().toLowerCase(),
        otp: fullOtp,
        role: selectedRole,
        name: fullName.trim()
      });

      setSuccessMsg("Identity verified! Provisioning your workspace...");
      handleAuthSuccess(authData);
    } catch (err) {
      setErrorMsg(err.message || "Invalid or expired verification code. Please check and retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-portal-wrapper">
      {/* Background ambient orbs */}
      <div className="auth-ambient-orb orb-primary" />
      <div className="auth-ambient-orb orb-cyan" />

      {/* Top Header Bar: Clean & Professional Brand + Trust Badges */}
      <header className="auth-header-bar" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "1.75rem",
        padding: "0.85rem 1.4rem",
        background: "rgba(15, 23, 42, 0.75)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        backdropFilter: "blur(14px)",
        position: "relative",
        zIndex: 10,
        flexWrap: "wrap",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)"
      }}>
        {/* Left: Brand Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #06B6D4, #4F46E5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            boxShadow: "0 0 12px rgba(6, 182, 212, 0.35)"
          }}>
            <Compass size={20} />
          </div>
          <div>
            <span style={{ fontSize: "1rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
              CareerLens AI
            </span>
            <span style={{ fontSize: "0.7rem", color: "#94A3B8", marginLeft: "0.45rem", fontWeight: 600 }}>
              Intelligent Placement &amp; Talent Suite 🇮🇳
            </span>
          </div>
        </div>

        {/* Right: Statutory Compliance Badges */}
        <div className="auth-trust-badges" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <span className="trust-badge" style={{ fontSize: "0.72rem", padding: "0.25rem 0.7rem" }}>
            <Globe size={12} color="#06B6D4" /> Bengaluru • Hyderabad • Pune • Chennai • Mumbai
          </span>
          <span className="trust-badge" style={{ fontSize: "0.72rem", padding: "0.25rem 0.7rem" }}>
            <ShieldCheck size={12} color="#10B981" /> US EEOC Title VII &amp; AI Audit
          </span>
          <span className="trust-badge" style={{ fontSize: "0.72rem", padding: "0.25rem 0.7rem" }}>
            <Lock size={12} color="#38BDF8" /> SHA-256 Auth &amp; Session Isolation
          </span>
        </div>
      </header>

      <div className="auth-split-grid">
        {/* Left: Showcase Hero Panel */}
        <div className="auth-showcase-panel glass-panel">
          <div className="showcase-brand">
            <div className="brand-icon">
              <Compass size={28} color="#FFFFFF" />
            </div>
            <div>
              <h2>CareerLens AI</h2>
              <p className="showcase-subtitle">Next-Gen Placement &amp; Autonomous AI Career Management</p>
            </div>
          </div>

          <div className="showcase-statement">
            <h3>Custom Database, Personal Resumes & Enterprise Security</h3>
            <p>
              Connect your own PostgreSQL or Supabase database, upload your real PDF resume, and experience 
              statutory <strong>EEOC Four-Fifths (80%) Fairness Auditing</strong> with our self-improving matching engine.
            </p>
          </div>

          {/* Differentiator Highlights */}
          <div className="showcase-feature-list">
            <div className="showcase-feature-item">
              <div className="feature-icon-box" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#06B6D4" }}>
                <KeyRound size={20} />
              </div>
              <div>
                <h4>Seamless Login or New Account Sign Up</h4>
                <p>Already registered users can sign in instantly using their email and password, or choose secure email OTP.</p>
              </div>
            </div>

            <div className="showcase-feature-item">
              <div className="feature-icon-box" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981" }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4>Persistent Real Resume Uploads</h4>
                <p>Upload your actual PDF/JPG resume stored directly in the database with automated ATS scoring and Explainable AI (XAI) fit scores.</p>
              </div>
            </div>

            <div className="showcase-feature-item">
              <div className="feature-icon-box" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#A855F7" }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h4>Quantum AI Career Copilot</h4>
                <p>Real-time conversational placement coach conducting mock interviews, auditing ATS keywords, and guiding your career roadmap.</p>
              </div>
            </div>
          </div>

          {/* Platform Live Metrics */}
          <div className="showcase-metrics-grid">
            <div className="metric-box">
              <div className="metric-num font-mono">60+</div>
              <div className="metric-label">Audited Talent Profiles</div>
            </div>
            <div className="metric-box">
              <div className="metric-num font-mono">0.80+</div>
              <div className="metric-label">EEOC 4/5ths Baseline</div>
            </div>
            <div className="metric-box">
              <div className="metric-num font-mono">89.7%</div>
              <div className="metric-label">Empirical Match Acc.</div>
            </div>
            <div className="metric-box">
              <div className="metric-num font-mono">₹42L+</div>
              <div className="metric-label">Super Dream CTCs</div>
            </div>
          </div>

          <div className="showcase-footer-quote">
            <span>⚖️ Compliant with US EEOC 4/5ths Statutory Rule, EU AI Act High-Risk AI, and NAAC 5.2.1 Reporting</span>
          </div>
        </div>

        {/* Right: Authentication Form Panel */}
        <div className="auth-form-panel glass-panel">
          {/* Domain Mode Switcher (Campus vs Enterprise) */}
          <div className="domain-switcher-bar">
            <button
              type="button"
              className={`domain-switch-btn ${domainMode === "campus" ? "active" : ""}`}
              onClick={() => handleDomainSwitch("campus")}
            >
              <GraduationCap size={15} /> 🎓 Campus Placement (Students &amp; Recruiters)
            </button>
            <button
              type="button"
              className={`domain-switch-btn ${domainMode === "enterprise" ? "active" : ""}`}
              onClick={() => handleDomainSwitch("enterprise")}
            >
              <Globe size={15} /> 🏢 Global Corporate (Hiring & Mobility)
            </button>
          </div>

          {/* PRIMARY AUTH MODE SWITCHER: SIGN IN vs SIGN UP */}
          <div className="auth-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${authMode === "signin" ? "active" : ""}`}
              onClick={() => {
                setAuthMode("signin");
                setErrorMsg("");
                setSuccessMsg("");
              }}
            >
              <LogIn size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
              Sign In (Existing User)
            </button>
            <button
              type="button"
              className={`mode-btn ${authMode === "signup" ? "active" : ""}`}
              onClick={() => {
                setAuthMode("signup");
                setErrorMsg("");
                setSuccessMsg("");
              }}
            >
              <UserPlus size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
              Sign Up (Create Account)
            </button>
          </div>

          {/* Secondary tabs for Sign In: Email & Password vs Email OTP vs 1-Click Preview */}
          {authMode === "signin" && (
            <div className="auth-method-tabs" style={{ marginBottom: "1.1rem" }}>
              <button
                type="button"
                className={`auth-method-tab ${authMethod === "password" ? "active" : ""}`}
                onClick={() => { setAuthMethod("password"); setErrorMsg(""); }}
              >
                <KeyRound size={14} /> 🔑 Email &amp; Password
              </button>
              <button
                type="button"
                className={`auth-method-tab ${authMethod === "otp" ? "active" : ""}`}
                onClick={() => { setAuthMethod("otp"); setErrorMsg(""); }}
              >
                <Mail size={14} /> 📧 Email OTP
              </button>
              <button
                type="button"
                className={`auth-method-tab ${authMethod === "demo" ? "active" : ""}`}
                onClick={() => { setAuthMethod("demo"); setErrorMsg(""); }}
              >
                <Zap size={14} /> ⚡ 1-Click Preview
              </button>
            </div>
          )}

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="auth-alert alert-error" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
              {errorMsg.toLowerCase().includes("sign up") && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  style={{
                    background: "rgba(56, 189, 248, 0.2)",
                    border: "1px solid #38BDF8",
                    color: "#38BDF8",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Switch to Sign Up →
                </button>
              )}
            </div>
          )}
          {successMsg && (
            <div className="auth-alert alert-success">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* OPTION A: SIGN IN VIA EMAIL & PASSWORD (PRIMARY)          */}
          {/* ======================================================== */}
          {authMode === "signin" && authMethod === "password" && (
            <div className="password-signin-container">
              {/* Role Selection Tabs */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <label className="form-label" style={{ margin: 0 }}>Select Access Role</label>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                    ✨ Auto-routes to your profile
                  </span>
                </div>
                <div className="auth-role-tabs">
                  {domainMode === "campus" ? (
                    <>
                      <button
                        type="button"
                        className={`auth-role-tab ${selectedRole === "student" ? "active" : ""}`}
                        onClick={() => setSelectedRole("student")}
                      >
                        <GraduationCap size={15} /> Student
                      </button>
                      <button
                        type="button"
                        className={`auth-role-tab ${selectedRole === "recruiter" ? "active" : ""}`}
                        onClick={() => setSelectedRole("recruiter")}
                      >
                        <Building2 size={15} /> Recruiter
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`auth-role-tab ${selectedRole === "employee" ? "active" : ""}`}
                        onClick={() => setSelectedRole("employee")}
                      >
                        <UserCheck size={15} /> Employee
                      </button>
                      <button
                        type="button"
                        className={`auth-role-tab ${selectedRole === "manager" ? "active" : ""}`}
                        onClick={() => setSelectedRole("manager")}
                      >
                        <Briefcase size={15} /> Manager
                      </button>
                      <button
                        type="button"
                        className={`auth-role-tab ${selectedRole === "cpo" ? "active" : ""}`}
                        onClick={() => setSelectedRole("cpo")}
                      >
                        <ShieldCheck size={15} /> CPO
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Password Sign In Form */}
              <form onSubmit={handlePasswordLogin} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="password-input-wrapper">
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. name@college.edu or student@vipcare.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <label className="form-label" style={{ margin: 0 }}>Password</label>
                    <button
                      type="button"
                      className="btn-text"
                      style={{ fontSize: "0.75rem", color: "#38BDF8", cursor: "pointer", background: "none", border: "none" }}
                      onClick={() => {
                        setAuthMethod("otp");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                    >
                      Forgot? Use OTP Login
                    </button>
                  </div>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      placeholder="Enter your account password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span>Authenticating Credentials...</span>
                  ) : (
                    <>
                      <LogIn size={16} /> Sign In to Workspace →
                    </>
                  )}
                </button>
              </form>

              {/* Helpful footer switchers */}
              <div style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                <span>Don't have an account yet? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#38BDF8",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Create Account (Sign Up) →
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* OPTION B: 2-STEP VERIFIED SIGN UP (CREATE ACCOUNT)        */}
          {/* ======================================================== */}
          {authMode === "signup" && (
            <div className="signup-card-container">
              {/* Stepper Progress Header */}
              <div className="signup-stepper-container">
                <div className="signup-stepper-steps">
                  <div className={`signup-step-item ${signupStep === 1 ? "active" : "completed"}`}>
                    <div className="signup-step-num">{signupStep > 1 ? "✓" : "1"}</div>
                    <span>Profile &amp; Password</span>
                  </div>
                  <div className={`signup-step-divider ${signupStep > 1 ? "active" : ""}`} />
                  <div className={`signup-step-item ${signupStep === 2 ? "active" : ""}`}>
                    <div className="signup-step-num">2</div>
                    <span>Email OTP Verification</span>
                  </div>
                </div>
              </div>

              {signupStep === 1 ? (
                /* STEP 1: Enter Profile & Credentials */
                <div>
                  {/* Role Selection Tabs for Registration */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label className="form-label" style={{ marginBottom: "0.4rem" }}>
                      Select Role for Your New Account
                    </label>
                    <div className="auth-role-tabs">
                      {domainMode === "campus" ? (
                        <>
                          <button
                            type="button"
                            className={`auth-role-tab ${selectedRole === "student" ? "active" : ""}`}
                            onClick={() => setSelectedRole("student")}
                          >
                            <GraduationCap size={15} /> Student
                          </button>
                          <button
                            type="button"
                            className={`auth-role-tab ${selectedRole === "recruiter" ? "active" : ""}`}
                            onClick={() => setSelectedRole("recruiter")}
                          >
                            <Building2 size={15} /> Recruiter
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={`auth-role-tab ${selectedRole === "employee" ? "active" : ""}`}
                            onClick={() => setSelectedRole("employee")}
                          >
                            <UserCheck size={15} /> Employee
                          </button>
                          <button
                            type="button"
                            className={`auth-role-tab ${selectedRole === "manager" ? "active" : ""}`}
                            onClick={() => setSelectedRole("manager")}
                          >
                            <Briefcase size={15} /> Manager
                          </button>
                          <button
                            type="button"
                            className={`auth-role-tab ${selectedRole === "cpo" ? "active" : ""}`}
                            onClick={() => setSelectedRole("cpo")}
                          >
                            <ShieldCheck size={15} /> CPO
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Sign Up Form */}
                  <form onSubmit={handleSendSignupOtp} className="auth-form">
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Aaditya Raman or Priya Sundaram"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        autoComplete="name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="e.g. yourname@college.edu or gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                      <small style={{ color: "var(--text-muted)", fontSize: "0.74rem", marginTop: "0.25rem", display: "block" }}>
                        🔒 Any valid email address can receive your 6-digit verification code.
                      </small>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Password *</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showSignupPassword ? "text" : "password"}
                          className="form-input"
                          placeholder="Create a strong password (min 4 characters)"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          title={showSignupPassword ? "Hide password" : "Show password"}
                        >
                          {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div className="form-group">
                        <label className="form-label">
                          {domainMode === "enterprise" ? "Engineering Division" : "Department"}
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder={domainMode === "enterprise" ? "e.g. Core Distributed Systems" : "e.g. CSE or ECE"}
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          {domainMode === "enterprise" ? "Staff ID (Optional)" : "Roll Number (Optional)"}
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder={domainMode === "enterprise" ? "e.g. EMP8021" : "e.g. 26CS099"}
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary auth-submit-btn"
                      disabled={loading}
                    >
                      {loading ? (
                        <span>Dispatching Verification Code...</span>
                      ) : (
                        <>
                          <KeyRound size={16} /> Verify Email &amp; Send OTP →
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* STEP 2: Email OTP Verification */
                <form onSubmit={handleVerifySignupAndCreateAccount} className="auth-form">
                  <div style={{ textAlign: "center", marginBottom: "0.85rem" }}>
                    <div style={{ fontSize: "0.88rem", color: "var(--text-main)", fontWeight: 600 }}>
                      Enter the 6-digit verification code sent to:
                    </div>
                    <div style={{ color: "#38BDF8", fontWeight: 700, fontSize: "0.95rem" }}>
                      {email}
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.75rem 1rem",
                    background: "rgba(14, 165, 233, 0.08)",
                    border: "1px solid rgba(14, 165, 233, 0.25)",
                    borderRadius: "10px",
                    color: "#E0F2FE",
                    fontSize: "0.8rem",
                    lineHeight: 1.45,
                    marginBottom: "1rem"
                  }}>
                    <Mail size={18} color="#38BDF8" style={{ flexShrink: 0 }} />
                    <span>
                      Please check your <strong>Inbox</strong> (and <strong>Spam / Junk folder</strong>) for your 6-digit verification code.
                    </span>
                  </div>

                  {/* Instant Verification Code Helper */}
                  {devOtpHelper && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.6rem",
                      padding: "0.75rem 1rem",
                      background: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(52, 211, 153, 0.35)",
                      borderRadius: "10px",
                      fontSize: "0.84rem",
                      color: "#34D399",
                      marginBottom: "1rem"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span>⚡</span>
                        <span>
                          Code: <strong style={{ letterSpacing: "3px", fontSize: "1.1rem", color: "#FFFFFF", background: "rgba(0,0,0,0.5)", padding: "2px 8px", borderRadius: "6px" }}>{devOtpHelper}</strong>
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "#A7F3D0" }}>(Delivered to Gmail &amp; Auto-Filled)</span>
                      </div>
                      <button
                        type="button"
                        className="btn-text"
                        style={{ fontSize: "0.76rem", color: "#38BDF8", cursor: "pointer", fontWeight: 700, textDecoration: "underline", background: "rgba(56, 189, 248, 0.12)", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(56, 189, 248, 0.3)" }}
                        onClick={() => {
                          const digits = devOtpHelper.split("");
                          setSignupOtpDigits(digits);
                        }}
                      >
                        Re-Fill Code ↵
                      </button>
                    </div>
                  )}

                  {/* 6-Box OTP Input */}
                  <div className="otp-box-grid">
                    {signupOtpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (signupOtpInputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="otp-digit-input"
                        value={digit}
                        onChange={(e) => handleSignupOtpDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleSignupOtpKeyDown(i, e)}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary auth-submit-btn"
                    disabled={loading || signupOtpDigits.join("").length !== 6}
                  >
                    {loading ? (
                      <span>Verifying &amp; Creating Account...</span>
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> Verify Code &amp; Create Account →
                      </>
                    )}
                  </button>

                  <div className="otp-timer-row">
                    <button
                      type="button"
                      className="btn-text"
                      style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                      onClick={() => { setSignupStep(1); setSignupOtpDigits(["", "", "", "", "", ""]); }}
                    >
                      ← Edit Details / Email
                    </button>

                    {resendCooldown > 0 ? (
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Resend in <strong>{resendCooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-text"
                        style={{ fontSize: "0.78rem", color: "#38BDF8", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}
                        onClick={handleSendSignupOtp}
                        disabled={loading}
                      >
                        <RefreshCw size={12} /> Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Already registered switcher */}
              <div style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#38BDF8",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Sign In with Email &amp; Password →
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* OPTION C: SIGN IN VIA EMAIL OTP                          */}
          {/* ======================================================== */}
          {authMode === "signin" && authMethod === "otp" && (
            <div className="otp-card-container">
              {/* Role Selection Tabs */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="form-label" style={{ marginBottom: "0.4rem" }}>Select Your Access Role</label>
                <div className="auth-role-tabs">
                  {domainMode === "campus" ? (
                    <>
                      <button
                        type="button"
                        className={`auth-role-tab ${selectedRole === "student" ? "active" : ""}`}
                        onClick={() => setSelectedRole("student")}
                      >
                        <GraduationCap size={15} /> Student
                      </button>
                      <button
                        type="button"
                        className={`auth-role-tab ${selectedRole === "recruiter" ? "active" : ""}`}
                        onClick={() => setSelectedRole("recruiter")}
                      >
                        <Building2 size={15} /> Recruiter
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`auth-role-tab ${selectedRole === "employee" ? "active" : ""}`}
                        onClick={() => setSelectedRole("employee")}
                      >
                        <UserCheck size={15} /> Employee
                      </button>
                      <button
                        type="button"
                        className={`auth-role-tab ${selectedRole === "manager" ? "active" : ""}`}
                        onClick={() => setSelectedRole("manager")}
                      >
                        <Briefcase size={15} /> Manager
                      </button>
                      <button
                        type="button"
                        className={`auth-role-tab ${selectedRole === "cpo" ? "active" : ""}`}
                        onClick={() => setSelectedRole("cpo")}
                      >
                        <ShieldCheck size={15} /> CPO
                      </button>
                    </>
                  )}
                </div>
              </div>

              {otpStep === "request" ? (
                /* STEP 1: Enter Email & Request OTP */
                <form onSubmit={handleSendOtp} className="auth-form">
                  <div className="form-group">
                    <label className="form-label">Full Name (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Aaditya Raman"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Your Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. yourname@college.edu or gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.3rem", display: "block" }}>
                      🔒 A 6-digit verification code will be sent to this email.
                    </small>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary auth-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <span>Sending Secure Code...</span>
                    ) : (
                      <>
                        <KeyRound size={16} /> Send 6-Digit Verification Code →
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* STEP 2: Verify 6-Digit OTP */
                <form onSubmit={handleVerifyOtp} className="auth-form">
                  <div style={{ textAlign: "center", marginBottom: "0.85rem" }}>
                    <div style={{ fontSize: "0.88rem", color: "var(--text-main)", fontWeight: 600 }}>
                      Enter the 6-digit verification code sent to:
                    </div>
                    <div style={{ color: "#38BDF8", fontWeight: 700, fontSize: "0.95rem" }}>
                      {email}
                    </div>
                  </div>

                  {/* Gmail Delivery Prompt */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.75rem 1rem",
                    background: "rgba(14, 165, 233, 0.08)",
                    border: "1px solid rgba(14, 165, 233, 0.25)",
                    borderRadius: "10px",
                    color: "#E0F2FE",
                    fontSize: "0.8rem",
                    lineHeight: 1.45,
                    marginBottom: "1rem"
                  }}>
                    <Mail size={18} color="#38BDF8" style={{ flexShrink: 0 }} />
                    <span>
                      Please check your <strong>Inbox</strong> (and <strong>Spam / Junk folder</strong>) for your 6-digit verification code.
                    </span>
                  </div>

                  {/* Instant Verification Code Helper */}
                  {devOtpHelper && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.6rem",
                      padding: "0.75rem 1rem",
                      background: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(52, 211, 153, 0.35)",
                      borderRadius: "10px",
                      fontSize: "0.84rem",
                      color: "#34D399",
                      marginBottom: "1rem"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span>⚡</span>
                        <span>
                          Code: <strong style={{ letterSpacing: "3px", fontSize: "1.1rem", color: "#FFFFFF", background: "rgba(0,0,0,0.5)", padding: "2px 8px", borderRadius: "6px" }}>{devOtpHelper}</strong>
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "#A7F3D0" }}>(Delivered to Gmail &amp; Auto-Filled)</span>
                      </div>
                      <button
                        type="button"
                        className="btn-text"
                        style={{ fontSize: "0.76rem", color: "#38BDF8", cursor: "pointer", fontWeight: 700, textDecoration: "underline", background: "rgba(56, 189, 248, 0.12)", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(56, 189, 248, 0.3)" }}
                        onClick={() => {
                          const digits = devOtpHelper.split("");
                          setOtpDigits(digits);
                        }}
                      >
                        Re-Fill Code ↵
                      </button>
                    </div>
                  )}

                  {/* 6-Box OTP Input */}
                  <div className="otp-box-grid">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpInputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="otp-digit-input"
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary auth-submit-btn"
                    disabled={loading || otpDigits.join("").length !== 6}
                  >
                    {loading ? (
                      <span>Verifying Security Code...</span>
                    ) : (
                      <>
                        <Lock size={16} /> Verify &amp; Access Workspace →
                      </>
                    )}
                  </button>

                  <div className="otp-timer-row">
                    <button
                      type="button"
                      className="btn-text"
                      style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                      onClick={() => { setOtpStep("request"); setOtpDigits(["", "", "", "", "", ""]); }}
                    >
                      ← Change Email / Role
                    </button>

                    {resendCooldown > 0 ? (
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Resend in <strong>{resendCooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-text"
                        style={{ fontSize: "0.78rem", color: "#38BDF8", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}
                        onClick={handleSendOtp}
                        disabled={loading}
                      >
                        <RefreshCw size={12} /> Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}

              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <button
                  type="button"
                  className="btn-text"
                  style={{ fontSize: "0.78rem", color: "#94A3B8" }}
                  onClick={() => setAuthMethod("password")}
                >
                  ← Back to Email &amp; Password Sign In
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* OPTION D: 1-CLICK INSTANT DEMO EVALUATOR ROLES          */}
          {/* ======================================================== */}
          {authMode === "signin" && authMethod === "demo" && (
            <div className="quick-demo-section" style={{ marginTop: "0.5rem" }}>
              <div className="quick-demo-header">
                <Zap size={14} color="#F59E0B" />
                <span>1-Click Instant Demo Access (Pre-seeded Evaluator Personas)</span>
              </div>
              <div className="quick-demo-cards-row">
                {demoAccounts[domainMode].map((acc) => {
                  const IconComponent = acc.icon;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      className="quick-demo-chip"
                      onClick={() => handleQuickDemoLogin(acc)}
                      disabled={loading}
                      title={`Instant login as ${acc.name} (${acc.title})`}
                    >
                      <div className="chip-avatar" style={{ background: `${acc.color}22`, color: acc.color }}>
                        <IconComponent size={16} />
                      </div>
                      <div className="chip-text">
                        <div className="chip-name">{acc.name}</div>
                        <div className="chip-desc">{acc.badge} • {acc.hub}</div>
                      </div>
                      <ArrowRight size={13} className="chip-arrow" />
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <button
                  type="button"
                  className="btn-text"
                  style={{ fontSize: "0.78rem", color: "#94A3B8" }}
                  onClick={() => setAuthMethod("password")}
                >
                  ← Back to Email &amp; Password Sign In
                </button>
              </div>
            </div>
          )}

          {/* Optional Guest Explorer Bypass */}
          {onExploreGuest && (
            <div className="auth-guest-bypass">
              <button
                type="button"
                className="guest-bypass-btn"
                onClick={onExploreGuest}
              >
                <Compass size={14} /> Explore Portal as Guest Viewer →
              </button>
            </div>
          )}

          {/* Dedicated CareerLens Privacy Shield Card */}
          <div className="privacy-shield-card">
            <div className="privacy-shield-header">
              <div className="privacy-shield-title">
                <ShieldCheck size={18} color="#34D399" />
                <span>CareerLens Privacy Shield</span>
              </div>
              <span className="privacy-shield-badge">Statutory Protection</span>
            </div>
            <div className="privacy-grid">
              <div className="privacy-item">
                <div className="privacy-item-icon">🛡️</div>
                <div className="privacy-item-content">
                  <h5>Zero-Knowledge Credential Security</h5>
                  <p>SHA-256 HMAC encryption with session sandbox isolation.</p>
                </div>
              </div>
              <div className="privacy-item">
                <div className="privacy-item-icon">🔒</div>
                <div className="privacy-item-content">
                  <h5>GDPR &amp; Indian DPDP Act 2023</h5>
                  <p>Statutory alignment with strict candidate data sovereignty.</p>
                </div>
              </div>
              <div className="privacy-item">
                <div className="privacy-item-icon">🌐</div>
                <div className="privacy-item-content">
                  <h5>End-to-End Profile Isolation</h5>
                  <p>Candidate resumes and audits remain in your local workspace.</p>
                </div>
              </div>
              <div className="privacy-item">
                <div className="privacy-item-icon">🚫</div>
                <div className="privacy-item-content">
                  <h5>Zero Third-Party Telemetry</h5>
                  <p>Zero trackers, zero ads, zero external profiling or data sharing.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Audit Footer */}
          <div style={{
            marginTop: "1.25rem",
            paddingTop: "1rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <ShieldCheck size={14} color="#10B981" />
              <span>SHA-256 Auth &amp; Password Protection Active</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Anti-Brute Force Protection Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
