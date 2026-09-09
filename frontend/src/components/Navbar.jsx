import React, { useState } from "react";
import { 
  ShieldCheck, Sparkles, Activity, Globe, Compass, 
  User, LogOut, ChevronDown, Repeat, DollarSign,
  GraduationCap, Briefcase, UserCheck, Check, Building2,
  Menu, X
} from "lucide-react";
import { currencyRates } from "../services/api";

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  operatingMode, 
  setOperatingMode,
  currency,
  setCurrency,
  onLogout,
  onOpenLogin,
  onSwitchPersona,
  onOpenAICopilot
}) {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isEnterprise = operatingMode === "enterprise";

  const personas = isEnterprise ? [
    { role: "employee", label: "Aditya Shenoy (Staff Engineer - Bengaluru HQ 🇮🇳)", icon: UserCheck, tab: "employee" },
    { role: "manager", label: "Vikram Malhotra (VP Eng - Hyderabad Hub 🇮🇳)", icon: Briefcase, tab: "manager" },
    { role: "cpo", label: "Dr. Kavita Nair (CPO - Mumbai HQ 🇮🇳)", icon: ShieldCheck, tab: "cpo" },
  ] : [
    { role: "student", label: "Aaditya Raman (Student - Anna Univ 🇮🇳)", icon: GraduationCap, tab: "student" },
    { role: "recruiter", label: "Priya Sundaram (Recruiter - Fintech Corp India)", icon: Briefcase, tab: "recruiter" },
  ];

  const userRole = (currentUser?.role || (isEnterprise ? "employee" : "student")).toLowerCase();

  // Dynamic branding based on role
  let brandTitle = "VIPCARE Enterprise";
  let brandSubtitle = "Global Internal Talent Mobility & Regulatory AI Audit";

  if (userRole === "student") {
    brandTitle = "VIPCARE Campus";
    brandSubtitle = "Institutional Placement & AI Career Academy";
  } else if (userRole === "manager") {
    brandTitle = "VIPCARE Enterprise";
    brandSubtitle = "Engineering Leadership & Talent Calibration Workbench";
  } else if (userRole === "recruiter") {
    brandTitle = "VIPCARE Campus";
    brandSubtitle = "Corporate Campus Recruitment & Outcome Engine";
  } else if (userRole === "tpo") {
    brandTitle = "VIPCARE Campus";
    brandSubtitle = "Institutional Training & Placement Directorate";
  } else if (userRole === "cpo") {
    brandTitle = "VIPCARE Enterprise";
    brandSubtitle = "Global DEI, Statutory Governance & Executive HR Suite";
  }

  // Render role-isolated navigation tabs
  const renderRoleTabs = () => (
    <>
      {userRole === "student" && (
        <button
          id="nav-tab-student"
          type="button"
          className={`role-tab-btn ${activeTab === "student" ? "active" : ""}`}
          onClick={() => { setActiveTab("student"); setIsMobileMenuOpen(false); }}
        >
          <span>🎓</span> Student Placement Portal
        </button>
      )}

      {userRole === "employee" && (
        <button
          id="nav-tab-employee"
          type="button"
          className={`role-tab-btn ${activeTab === "employee" ? "active" : ""}`}
          onClick={() => { setActiveTab("employee"); setIsMobileMenuOpen(false); }}
        >
          <span>👩‍💼</span> Employee Mobility Hub
        </button>
      )}

      {userRole === "manager" && (
        <button
          id="nav-tab-manager"
          type="button"
          className={`role-tab-btn ${activeTab === "manager" ? "active" : ""}`}
          onClick={() => { setActiveTab("manager"); setIsMobileMenuOpen(false); }}
        >
          <span>👔</span> Hiring Manager Workbench
        </button>
      )}

      {userRole === "recruiter" && (
        <button
          id="nav-tab-recruiter"
          type="button"
          className={`role-tab-btn ${activeTab === "recruiter" ? "active" : ""}`}
          onClick={() => { setActiveTab("recruiter"); setIsMobileMenuOpen(false); }}
        >
          <span>💼</span> Recruiter Portal
        </button>
      )}

      {userRole === "tpo" && (
        <button
          id="nav-tab-tpo"
          type="button"
          className={`role-tab-btn ${activeTab === "tpo" ? "active" : ""}`}
          onClick={() => { setActiveTab("tpo"); setIsMobileMenuOpen(false); }}
        >
          <span>🏛️</span> TPO Executive Suite
        </button>
      )}

      {userRole === "cpo" && (
        <button
          id="nav-tab-cpo"
          type="button"
          className={`role-tab-btn ${activeTab === "cpo" ? "active" : ""}`}
          onClick={() => { setActiveTab("cpo"); setIsMobileMenuOpen(false); }}
        >
          <span>🌐</span> CPO Executive Suite
        </button>
      )}

      {/* AI Differentiator Engines */}
      <button
        id="nav-tab-fairness"
        type="button"
        className={`role-tab-btn differentiator ${activeTab === "fairness" ? "active" : ""}`}
        onClick={() => { setActiveTab("fairness"); setIsMobileMenuOpen(false); }}
      >
        <ShieldCheck size={16} /> {isEnterprise ? "EEOC & EU AI Act Audit" : "Fairness & Bias Audit"}
      </button>
      <button
        id="nav-tab-feedback"
        type="button"
        className={`role-tab-btn differentiator-purple ${activeTab === "feedback" ? "active" : ""}`}
        onClick={() => { setActiveTab("feedback"); setIsMobileMenuOpen(false); }}
      >
        <Sparkles size={16} /> Self-Improving Match Engine
      </button>
    </>
  );

  return (
    <header className="navbar" id="app-header">
      {/* Top Main Row */}
      <div className="navbar-main-row">
        {/* Brand Header */}
        <div className="brand-logo">
          <div className="brand-icon">
            <Compass size={22} color="#FFFFFF" />
          </div>
          <div className="brand-text">
            <h1>{brandTitle}</h1>
            <span className="brand-subtitle-desktop">{brandSubtitle}</span>
          </div>
        </div>

        {/* Center Role Navigation Tabs (Desktop View Only) */}
        <div className="role-tabs role-tabs-desktop" id="role-navigation-tabs">
          {renderRoleTabs()}
        </div>

        {/* Right Controls: Desktop View Only */}
        <div className="nav-controls-right navbar-desktop-controls">
          {/* Multi-Currency Dropdown */}
          <div className="currency-dropdown-container">
            <button
              type="button"
              className="nav-action-btn currency-btn"
              onClick={() => { setShowCurrencyMenu(!showCurrencyMenu); setShowPersonaMenu(false); }}
              title="Switch Global Currency"
            >
              <DollarSign size={14} />
              <span>{currency}</span>
              <ChevronDown size={12} />
            </button>

            {showCurrencyMenu && (
              <div className="dropdown-panel currency-menu glass-panel">
                <div className="dropdown-title">Select Global Currency</div>
                {Object.keys(currencyRates).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    className={`dropdown-item ${currency === curr ? "active" : ""}`}
                    onClick={() => {
                      setCurrency(curr);
                      setShowCurrencyMenu(false);
                    }}
                  >
                    <span className="font-mono">{currencyRates[curr].symbol}</span>
                    <span>{currencyRates[curr].label}</span>
                    {currency === curr && <Check size={14} style={{ marginLeft: "auto" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantum AI Copilot Trigger Button in Navbar */}
          <button
            type="button"
            className="nav-action-btn"
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.35rem", 
              color: "#FFFFFF", 
              background: "linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(99, 102, 241, 0.4))", 
              border: "1px solid rgba(56, 189, 248, 0.45)",
              boxShadow: "0 0 12px rgba(6, 182, 212, 0.25)"
            }}
            onClick={onOpenAICopilot}
            title="VIPCARE Quantum AI Copilot (Alt+C)"
          >
            <Sparkles size={13} color="#38BDF8" />
            <span style={{ fontWeight: 700 }}>AI Copilot</span>
            <span style={{ fontSize: "0.62rem", padding: "0.08rem 0.32rem", borderRadius: "8px", background: "rgba(255,255,255,0.18)", color: "#E0F2FE", fontWeight: 800 }}>LIVE</span>
          </button>

          {/* Operating Domain Toggle (Enterprise vs Campus) */}
          <button
            type="button"
            className="nav-action-btn mode-switch-pill"
            onClick={() => {
              const nextMode = isEnterprise ? "campus" : "enterprise";
              setOperatingMode(nextMode);
            }}
            title="Toggle between Enterprise Employee & Campus Academy modes"
          >
            <Repeat size={13} />
            <span>{isEnterprise ? "🏢 Enterprise" : "🎓 Campus"}</span>
          </button>

          {/* User Session Profile or Sign In Button */}
          {currentUser ? (
            <div className="user-profile-container">
              <button
                type="button"
                className="user-profile-btn"
                onClick={() => { setShowPersonaMenu(!showPersonaMenu); setShowCurrencyMenu(false); }}
                title="Account & Quick Persona Switcher"
              >
                <div className="user-avatar-circle">
                  {currentUser.name ? currentUser.name.charAt(0) : "U"}
                </div>
                <div className="user-info-text">
                  <span className="user-display-name">{currentUser.name.split(" ")[0]}</span>
                  <span className="user-role-tag">{currentUser.role}</span>
                </div>
                <ChevronDown size={12} />
              </button>

              {showPersonaMenu && (
                <div className="dropdown-panel persona-menu glass-panel">
                  <div className="persona-menu-header">
                    <div className="persona-menu-name">{currentUser.name}</div>
                    <div className="persona-menu-email">{currentUser.email}</div>
                    <div className="badge badge-emerald" style={{ marginTop: "0.4rem", fontSize: "0.7rem" }}>
                      {currentUser.organization || (isEnterprise ? "San Francisco Hub 🇺🇸" : "Campus Placement Cell")}
                    </div>
                  </div>

                  <div className="dropdown-divider" />
                  <div className="dropdown-title">Quick Persona Switcher (Viva Demo)</div>
                  {personas.map((p) => {
                    const Icon = p.icon;
                    const isActive = currentUser.role === p.role;
                    return (
                      <button
                        key={p.role}
                        type="button"
                        className={`dropdown-item ${isActive ? "active" : ""}`}
                        onClick={() => {
                          setShowPersonaMenu(false);
                          if (onSwitchPersona) {
                            onSwitchPersona(p.role, p.tab);
                          }
                        }}
                      >
                        <Icon size={14} />
                        <span style={{ fontSize: "0.82rem" }}>{p.label}</span>
                        {isActive && <Check size={14} style={{ marginLeft: "auto" }} />}
                      </button>
                    );
                  })}

                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-item logout-item"
                    onClick={() => {
                      setShowPersonaMenu(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary nav-signin-btn"
              onClick={onOpenLogin}
            >
              <User size={14} />
              <span>Sign In / Portal</span>
            </button>
          )}
        </div>

        {/* Mobile Actions: AI Copilot & Hamburger Menu Button */}
        <div className="navbar-mobile-actions">
          <button
            type="button"
            className="mobile-copilot-pill"
            onClick={onOpenAICopilot}
            title="VIPCARE Quantum AI Copilot"
          >
            <Sparkles size={14} color="#38BDF8" />
            <span>AI Copilot</span>
          </button>

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={20} color="#38BDF8" /> : <Menu size={20} color="#F8FAFC" />}
          </button>
        </div>
      </div>

      {/* Role Navigation Tabs (Mobile Scrollable Row) */}
      <div className="role-tabs role-tabs-mobile" id="mobile-role-tabs">
        {renderRoleTabs()}
      </div>

      {/* Mobile Drawer / Slide-Down Modal */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-drawer-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="mobile-drawer-panel glass-panel" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div className="brand-icon" style={{ width: 32, height: 32 }}>
                  <Compass size={18} color="#FFFFFF" />
                </div>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "#FFFFFF" }}>{brandTitle}</h3>
                  <span style={{ fontSize: "0.68rem", color: "var(--accent-cyan)", fontWeight: 600 }}>Mobile Workspace</span>
                </div>
              </div>
              <button 
                type="button" 
                className="mobile-drawer-close-btn"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* User Profile Card in Drawer */}
            {currentUser ? (
              <div className="mobile-drawer-user-card">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div className="user-avatar-circle" style={{ width: 44, height: 44, fontSize: "1.1rem" }}>
                    {currentUser.name ? currentUser.name.charAt(0) : "U"}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#F8FAFC", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {currentUser.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {currentUser.email}
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.25rem" }}>
                      <span className="badge badge-indigo" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                        {currentUser.role?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "0.65rem" }}
                onClick={() => { setIsMobileMenuOpen(false); onOpenLogin(); }}
              >
                <User size={15} />
                <span>Sign In / Student Registration</span>
              </button>
            )}

            {/* Operating Domain Switcher */}
            <div className="mobile-drawer-section">
              <div className="mobile-section-label">OPERATING DOMAIN</div>
              <div className="mobile-domain-grid">
                <button
                  type="button"
                  className={`mobile-domain-chip ${operatingMode === "enterprise" ? "active" : ""}`}
                  onClick={() => {
                    setOperatingMode("enterprise");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span>🏢</span>
                  <span>Enterprise Hub</span>
                </button>
                <button
                  type="button"
                  className={`mobile-domain-chip ${operatingMode === "campus" ? "active" : ""}`}
                  onClick={() => {
                    setOperatingMode("campus");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span>🎓</span>
                  <span>Campus Academy</span>
                </button>
              </div>
            </div>

            {/* Multi-Currency Switcher */}
            <div className="mobile-drawer-section">
              <div className="mobile-section-label">GLOBAL CURRENCY ({currency})</div>
              <div className="mobile-currency-grid">
                {Object.keys(currencyRates).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    className={`mobile-currency-chip ${currency === curr ? "active" : ""}`}
                    onClick={() => {
                      setCurrency(curr);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="font-mono" style={{ fontWeight: 800 }}>{currencyRates[curr].symbol}</span>
                    <span>{curr}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Viva Demo Persona Switcher */}
            <div className="mobile-drawer-section">
              <div className="mobile-section-label">QUICK PERSONA SWITCHER (VIVA DEMO)</div>
              <div className="mobile-persona-list">
                {personas.map((p) => {
                  const Icon = p.icon;
                  const isActive = currentUser?.role === p.role;
                  return (
                    <button
                      key={p.role}
                      type="button"
                      className={`mobile-persona-btn ${isActive ? "active" : ""}`}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (onSwitchPersona) onSwitchPersona(p.role, p.tab);
                      }}
                    >
                      <div className="mobile-persona-icon-wrap">
                        <Icon size={14} />
                      </div>
                      <span style={{ fontSize: "0.8rem", flex: 1, textAlign: "left" }}>{p.label}</span>
                      {isActive && <Check size={14} color="#10B981" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sign Out (if logged in) */}
            {currentUser && (
              <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <button
                  type="button"
                  className="mobile-logout-btn"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign Out of Session</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
