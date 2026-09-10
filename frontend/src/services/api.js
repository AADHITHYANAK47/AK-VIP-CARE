const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.trim().replace(/\/+$/, "");
  }
  // In the browser, use relative '/api' which Vite proxies to http://127.0.0.1:8000
  // This works identically on desktop (localhost:5173) and mobile Wi-Fi (e.g. 172.23.108.146:5173)
  // completely bypassing Windows Firewall port 8000 blockages!
  if (typeof window !== "undefined") {
    return "/api";
  }
  return "http://127.0.0.1:8000/api";
};

const API_BASE_URL = getApiBaseUrl();

async function request(endpoint, options = {}) {
  const token = typeof window !== "undefined" ? (localStorage.getItem("vipcare_token") || localStorage.getItem("careerlens_token")) : null;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const primaryUrl = `${API_BASE_URL}${endpoint}`;

  try {
    let response;
    try {
      // Abort controller with 12-second timeout to prevent mobile fetch from hanging indefinitely
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      response = await fetch(primaryUrl, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (primaryErr) {
      // Fallback: if relative /api failed, try direct port 8000 on current host or localhost
      if (typeof window !== "undefined" && window.location) {
        const host = window.location.hostname || "127.0.0.1";
        const fallbackUrl = `http://${host}:8000/api${endpoint}`;
        const fallbackController = new AbortController();
        const fallbackTimeout = setTimeout(() => fallbackController.abort(), 8000);
        response = await fetch(fallbackUrl, { ...options, headers, signal: fallbackController.signal });
        clearTimeout(fallbackTimeout);
      } else {
        throw primaryErr;
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const currencyRates = {
  USD: { symbol: "$", rate: 8500, label: "USD ($)" },
  EUR: { symbol: "€", rate: 7800, label: "EUR (€)" },
  GBP: { symbol: "£", rate: 6800, label: "GBP (£)" },
  INR: { symbol: "₹", rate: 1, isLpa: true, label: "INR (₹)" },
};

export function formatCompensation(amountLpa, currency = "INR") {
  const num = Number(amountLpa) || 15.0;
  if (currency === "INR") {
    return `₹${num.toFixed(1)} LPA`;
  }
  const meta = currencyRates[currency] || currencyRates.INR;
  const converted = Math.round(num * meta.rate);
  return `${meta.symbol}${converted.toLocaleString()} / yr`;
}

export function saveUploadedResume(studentId, fileData) {
  try {
    localStorage.setItem(`vipcare_resume_${studentId}`, JSON.stringify(fileData));
    localStorage.setItem(`careerlens_resume_${studentId}`, JSON.stringify(fileData));
    return true;
  } catch (e) {
    console.error("Error saving resume to local storage", e);
    return false;
  }
}

export function getUploadedResume(studentId) {
  try {
    const raw = localStorage.getItem(`vipcare_resume_${studentId}`) || localStorage.getItem(`careerlens_resume_${studentId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export const api = {
  // Authentication & OTP Verification
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (userData) => request("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
  registerWithOtp: (payload) => request("/auth/register-with-otp", { method: "POST", body: JSON.stringify(payload) }),
  sendOtp: (payload) => request("/auth/send-otp", { method: "POST", body: JSON.stringify(payload) }),
  verifyOtp: (payload) => request("/auth/verify-otp", { method: "POST", body: JSON.stringify(payload) }),
  getDemoCredentials: () => request("/auth/demo-credentials"),
  getCurrentUser: (role) => request(`/auth/current-user/${role}`),
  getSmtpStatus: () => request("/auth/smtp-status"),
  updateSmtpConfig: (payload) => request("/auth/smtp-config", { method: "POST", body: JSON.stringify(payload) }),
  testSmtpConnection: (payload) => request("/auth/test-smtp", { method: "POST", body: JSON.stringify(payload) }),

  // Students & Persistent Real Resume Uploads
  getStudents: () => request("/students"),
  getStudent: (id) => request(`/students/${id}`),
  updateStudent: (id, data) => request(`/students/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  uploadResume: (studentId, filePayload) => request(`/students/${studentId}/resume/upload`, { method: "POST", body: JSON.stringify(filePayload) }),
  getResume: (studentId) => request(`/students/${studentId}/resume`),
  deleteResume: (studentId) => request(`/students/${studentId}/resume`, { method: "DELETE" }),
  parseResume: (text) => request("/students/parse-resume", { method: "POST", body: JSON.stringify({ text }) }),
  applyToDrive: (studentId, driveId, payload) => request(`/students/${studentId}/apply/${driveId}`, { 
    method: "POST",
    body: payload ? JSON.stringify(payload) : undefined 
  }),
  getStudentApplications: (studentId) => request(`/students/${studentId}/applications`),

  // Drives & Internal Requisitions
  getDrives: () => request("/drives"),
  getDrive: (id) => request(`/drives/${id}`),
  createDrive: (data) => request("/drives", { method: "POST", body: JSON.stringify(data) }),

  // Matching & XAI Fit Score
  getRankedCandidates: (driveId) => request(`/matching/rank/${driveId}`),
  getSingleMatch: (studentId, driveId) => request(`/matching/student/${studentId}/drive/${driveId}`),
  getStudentRecommendations: (studentId) => request(`/matching/student/${studentId}/recommendations`),

  // Fairness & Statutory Regulatory Audits (EEOC 4/5ths, EU AI Act, UK Equality Act)
  getDriveFairnessAudit: (driveId) => request(`/fairness/audit/${driveId}`),
  runCounterfactual: (payload) => request("/fairness/counterfactual", { method: "POST", body: JSON.stringify(payload) }),
  getFairnessSummary: () => request("/fairness/summary"),

  // Continuous Self-Improving ML Feedback Loop
  getCycleHistory: () => request("/feedback/cycles"),
  logOutcome: (data) => request("/feedback/outcome", { method: "POST", body: JSON.stringify(data) }),
  triggerRetrain: (notes) => request("/feedback/retrain", { method: "POST", body: JSON.stringify({ notes }) }),
  getOutcomes: () => request("/feedback/outcomes"),

  // Quantum AI Career Copilot & Chatbot
  chatWithCopilot: (payload) => request("/chatbot/chat", { method: "POST", body: JSON.stringify(payload) }),
  analyzeResumeDeep: (payload) => request("/chatbot/analyze-resume", { method: "POST", body: JSON.stringify(payload) }),
  mockInterviewCopilot: (payload) => request("/chatbot/mock-interview", { method: "POST", body: JSON.stringify(payload) }),
  getChatbotStatus: () => request("/chatbot/status"),

  // Career Progression Roadmap & Mock Technical Coach
  getRoadmap: (studentId, driveId) => request(`/roadmap/student/${studentId}/drive/${driveId}`),
  getMockQuestions: (role, skills) => request("/roadmap/mock-interview", { method: "POST", body: JSON.stringify({ role, skills }) }),
  evaluateAnswer: (question, answer) => request("/roadmap/mock-interview/evaluate", { method: "POST", body: JSON.stringify({ question, answer }) }),

  // Database Connection & System Health
  getDbStatus: () => request("/system/database-status"),
  testDbConnection: (database_url) => request("/system/test-db-connection", { method: "POST", body: JSON.stringify({ database_url }) }),
  reconnectDatabase: (database_url) => request("/system/reconnect-database", { method: "POST", body: JSON.stringify({ database_url }) }),
  initTables: () => request("/system/init-tables", { method: "POST" }),

  // Analytics & Compliance
  getTpoDashboard: () => request("/analytics/tpo-dashboard"),
  getNaacReport: () => request("/analytics/naac-report"),
};
