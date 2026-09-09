import React, { useState } from "react";
import Navbar from "./components/Navbar";
import LoginPage from "./components/LoginPage";
import EmployeeDashboard from "./components/EmployeeDashboard";
import HiringManagerDashboard from "./components/HiringManagerDashboard";
import CpoDashboard from "./components/CpoDashboard";
import StudentDashboard from "./components/StudentDashboard";
import RecruiterDashboard from "./components/RecruiterDashboard";
import TpoDashboard from "./components/TpoDashboard";
import FairnessAuditDashboard from "./components/FairnessAuditDashboard";
import FeedbackLoopDashboard from "./components/FeedbackLoopDashboard";
import AIChatbotModal from "./components/AIChatbotModal";
import DatabaseConfigModal from "./components/DatabaseConfigModal";
import SmtpConfigModal from "./components/SmtpConfigModal";

export default function App() {
  const [isDbConfigOpen, setIsDbConfigOpen] = useState(false);
  const [isAIChatbotOpen, setIsAIChatbotOpen] = useState(false);
  const [isSmtpConfigOpen, setIsSmtpConfigOpen] = useState(false);
  // Session & Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("vipcare_user") || localStorage.getItem("careerlens_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Operating Domain: "enterprise" (Employees) | "campus" (Students)
  const [operatingMode, setOperatingMode] = useState(() => {
    return localStorage.getItem("vipcare_mode") || localStorage.getItem("careerlens_mode") || "enterprise";
  });

  // Multi-Currency: "INR" (Default) | "USD" | "EUR" | "GBP"
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("vipcare_currency") || localStorage.getItem("careerlens_currency") || "INR";
  });

  // Active Dashboard Tab
  const [activeTab, setActiveTab] = useState(() => {
    const savedMode = localStorage.getItem("vipcare_mode") || localStorage.getItem("careerlens_mode") || "enterprise";
    return savedMode === "enterprise" ? "employee" : "student";
  });

  // Guest Explorer bypass state
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Sync mode changes to storage and update active tab
  function handleSetOperatingMode(mode) {
    setOperatingMode(mode);
    localStorage.setItem("vipcare_mode", mode);
    localStorage.setItem("careerlens_mode", mode);
    
    // Smoothly remap the active tab
    if (mode === "enterprise") {
      if (activeTab === "student") setActiveTab("employee");
      else if (activeTab === "recruiter") setActiveTab("manager");
      else if (activeTab === "tpo") setActiveTab("cpo");
    } else {
      if (activeTab === "employee") setActiveTab("student");
      else if (activeTab === "manager") setActiveTab("recruiter");
      else if (activeTab === "cpo") setActiveTab("tpo");
    }
  }

  // Sync currency changes to storage
  function handleSetCurrency(curr) {
    setCurrency(curr);
    localStorage.setItem("vipcare_currency", curr);
    localStorage.setItem("careerlens_currency", curr);
  }

  // Handle successful login or registration
  function handleLoginSuccess(user, mode) {
    setCurrentUser(user);
    if (mode) {
      setOperatingMode(mode);
      localStorage.setItem("vipcare_mode", mode);
      localStorage.setItem("careerlens_mode", mode);
    }
    setIsGuestMode(false);

    // Route to user's dedicated dashboard
    const role = (user.role || "").toLowerCase();
    if (role === "employee") {
      setActiveTab("employee");
    } else if (role === "manager") {
      setActiveTab("manager");
    } else if (role === "cpo" || role === "compliance") {
      setActiveTab("cpo");
    } else if (role === "student") {
      setActiveTab("student");
    } else if (role === "recruiter") {
      setActiveTab("recruiter");
    } else if (role === "tpo") {
      setActiveTab("tpo");
    } else {
      setActiveTab("fairness");
    }
  }

  // Handle Logout
  function handleLogout() {
    localStorage.removeItem("vipcare_token");
    localStorage.removeItem("vipcare_user");
    localStorage.removeItem("careerlens_token");
    localStorage.removeItem("careerlens_user");
    setCurrentUser(null);
    setIsGuestMode(false);
  }

  // Handle Quick Switch Persona from Navbar dropdown (for instant viva presentation)
  function handleSwitchPersona(role, targetTab) {
    let mockUser;

    if (role === "employee") {
      mockUser = {
        name: "Aditya Shenoy",
        role: "employee",
        email: "alex.chen@global.careerlens.ai",
        organization: "Bengaluru HQ 🇮🇳 • Outer Ring Road Tech Hub",
        student_id: 1,
        access_token: "jwt_employee_demo"
      };
    } else if (role === "manager") {
      mockUser = {
        name: "Vikram Malhotra",
        role: "manager",
        email: "marcus.vance@global.careerlens.ai",
        organization: "Hyderabad Tech Hub 🇮🇳 • HITEC City",
        access_token: "jwt_manager_demo"
      };
    } else if (role === "cpo") {
      mockUser = {
        name: "Dr. Kavita Nair",
        role: "cpo",
        email: "elena.rostova@global.careerlens.ai",
        organization: "Mumbai HQ 🇮🇳 • BKC & Pune Hub",
        access_token: "jwt_cpo_demo"
      };
    } else if (role === "student") {
      mockUser = {
        name: "Aaditya Raman",
        role: "student",
        email: "student@careerlens.ai",
        organization: "Anna University Campus Placement Cell (Chennai)",
        student_id: 1,
        access_token: "jwt_student_demo"
      };
    } else if (role === "recruiter") {
      mockUser = {
        name: "Priya Sundaram",
        role: "recruiter",
        email: "recruiter@careerlens.ai",
        organization: "Fintech Corp India (Bengaluru / Hyderabad)",
        access_token: "jwt_recruiter_demo"
      };
    } else {
      mockUser = {
        name: "Dr. K. Balaji",
        role: "tpo",
        email: "tpo@careerlens.ai",
        organization: "Anna University Placement Directorate (Chennai)",
        access_token: "jwt_tpo_demo"
      };
    }

    const isCamp = role === "student" || role === "recruiter" || role === "tpo";
    const nextMode = isCamp ? "campus" : "enterprise";
    setOperatingMode(nextMode);
    localStorage.setItem("vipcare_mode", nextMode);
    localStorage.setItem("careerlens_mode", nextMode);

    setCurrentUser(mockUser);
    localStorage.setItem("vipcare_user", JSON.stringify(mockUser));
    localStorage.setItem("vipcare_token", mockUser.access_token);
    localStorage.setItem("careerlens_user", JSON.stringify(mockUser));
    localStorage.setItem("careerlens_token", mockUser.access_token);
    if (targetTab) {
      setActiveTab(targetTab);
    }
  }

  // If user is not logged in and not exploring as guest, show the International Login Portal
  if (!currentUser && !isGuestMode) {
    return (
      <div className="app-container" id="vipcare-root">
        <LoginPage 
          onLoginSuccess={handleLoginSuccess}
          onExploreGuest={() => {
            setIsGuestMode(true);
            setActiveTab("fairness");
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-container" id="vipcare-root">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        operatingMode={operatingMode} 
        setOperatingMode={handleSetOperatingMode}
        currency={currency}
        setCurrency={handleSetCurrency}
        onLogout={handleLogout}
        onOpenLogin={() => setIsGuestMode(false)}
        onSwitchPersona={handleSwitchPersona}
        onOpenAICopilot={() => setIsAIChatbotOpen(true)}
      />

      <main id="main-content-view">
        {/* Dedicated Enterprise Dashboards */}
        {activeTab === "employee" && (
          <EmployeeDashboard 
            currentUser={currentUser}
            currency={currency} 
          />
        )}
        {activeTab === "manager" && (
          <HiringManagerDashboard 
            currentUser={currentUser}
            currency={currency} 
          />
        )}
        {activeTab === "cpo" && (
          <CpoDashboard 
            currentUser={currentUser}
            currency={currency} 
          />
        )}

        {/* Dedicated Campus Dashboards */}
        {activeTab === "student" && (
          <StudentDashboard 
            currentUser={currentUser}
          />
        )}
        {activeTab === "recruiter" && (
          <RecruiterDashboard 
            currentUser={currentUser}
          />
        )}
        {activeTab === "tpo" && (
          <TpoDashboard 
            currentUser={currentUser}
          />
        )}

        {/* Shared AI Differentiator Engines */}
        {activeTab === "fairness" && (
          <FairnessAuditDashboard 
            operatingMode={operatingMode} 
          />
        )}
        {activeTab === "feedback" && (
          <FeedbackLoopDashboard />
        )}
      </main>

      {/* Global Modals: Database Settings & Quantum AI Copilot */}
      <DatabaseConfigModal 
        isOpen={isDbConfigOpen} 
        onClose={() => setIsDbConfigOpen(false)} 
      />

      <AIChatbotModal 
        currentUser={currentUser}
        operatingMode={operatingMode}
        activeTab={activeTab}
        isOpen={isAIChatbotOpen}
        onClose={() => setIsAIChatbotOpen(false)}
      />

      <SmtpConfigModal
        isOpen={isSmtpConfigOpen}
        onClose={() => setIsSmtpConfigOpen(false)}
      />

      {/* Global Enterprise Footer & Statutory Compliance Cheatsheet */}
      <footer style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid var(--border-subtle)", color: "var(--text-dim)", fontSize: "0.82rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <strong style={{ color: "var(--text-muted)" }}>VIPCARE</strong> — {operatingMode === "enterprise" ? "Global Internal Talent Mobility & Statutory AI Compliance Platform" : "Institutional Placement & Career Management System"}
        </div>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <span>⚖️ US EEOC Title VII (4/5ths Rule)</span>
          <span>🇪🇺 EU AI Act High-Risk AI (Articles 9 & 10)</span>
          <span>🇬🇧 UK Equality Act 2010</span>
          <span>🔄 Continuous ML Recalibration</span>
        </div>
      </footer>
    </div>
  );
}
