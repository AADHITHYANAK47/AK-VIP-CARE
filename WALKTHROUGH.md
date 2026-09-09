# CareerLens AI — India Placement & Real PDF/JPG Resume Document Viewer

We have customized and localized **CareerLens AI** specifically for the **Indian Campus Placement & Corporate Talent Ecosystem**, implementing **PDF and JPG/PNG resume uploads** for Students and Employees and an interactive **Document Inspection Viewer** for Hiring Managers and Campus Placement Officers.

---

## 🇮🇳 Key Highlights & India Localization

1. **Default Indian Rupee (`₹ LPA`) Compensation**:
   - Packages and compensation models across all dashboards are formatted in **`₹ LPA`** (e.g., *₹18.0 LPA*, *₹42.5 LPA*).
   - Indian campus tier qualification automatically highlights **Super Dream (&gt;18 LPA)**, **Dream (10–18 LPA)**, and **Core/Regular (&lt;10 LPA)** placement drives.
2. **Indian Hubs & Academic Pedigrees**:
   - Institutional badges for **Anna University, IIT Madras, and NIT campuses** with CGPA out of 10.0 and active backlog tracking.
   - Enterprise corporate hubs across **Bengaluru HQ, Hyderabad R&D Center, Pune Tech Campus, Chennai, and Gurgaon/Delhi-NCR**.
   - Demo logins on the Login Page with 1-click credentials for Indian student, employee, and hiring manager personas.

---

## 📄 Real PDF & JPG/PNG Resume Upload & Inspection System

### 1. Student Dashboard (`StudentDashboard.jsx`)
- **Drag-and-Drop Upload Zone**:
  - Accepts both `.pdf` documents and `.jpg`, `.jpeg`, `.png` image scans.
  - Interactive drag-over visual feedback and file picker.
  - Instant file processing via browser `FileReader.readAsDataURL()`.
  - 1-click shortcut button: **"Load Official Placement PDF Sample"** for quick testing.
- **Persistent Storage & File Preview Card**:
  - Automatically stores verified resume in `localStorage` under `careerlens_resume_<studentId>`.
  - Displays document badge (`PDF` or image thumbnail), file name, size in KB, upload timestamp, and verification checkmark.
  - Recalculates ATS score to **94%** and boosts student profile strength.
- **Self-Inspection**:
  - Click **"👁️ View Document"** to inspect your resume in the high-fidelity A4 viewer before recruiters see it.

### 2. Employee Dashboard (`EmployeeDashboard.jsx`)
- **Technical Portfolio Upload**:
  - Staff and Principal engineers can upload their comprehensive systems architecture portfolios and patents in **PDF** or **JPG/PNG**.
  - Localized internal mobility to **Bengaluru HQ**, **Hyderabad R&D**, and **Pune Tech Campus**.
  - Self-inspection button opens the document viewer with IC promotion readiness indicators.

### 3. Hiring Manager Dashboard (`HiringManagerDashboard.jsx` & `ResumeViewerModal.jsx`)
- **Pipeline Leaderboard**:
  - Each candidate row features a dedicated **"📄 View Resume"** button next to Log Calibration.
- **Side-by-Side Comparison Matrix**:
  - Each comparison card includes an **"📄 Inspect Resume (PDF/JPG)"** button.
- **Interactive High-Fidelity Document Viewer (`ResumeViewerModal`)**:
  - **Image Rendering**: If a candidate uploaded a JPG/PNG scan, displays the image with full zoom (+/- 60% to 160%) and pan controls.
  - **A4 Document Rendering**: If a candidate uploaded a PDF, renders an A4 document layout with candidate contact info, CGPA, technical skills, engineering projects, and certifications.
  - **Toolbar Controls**:
    - Zoom In & Zoom Out
    - Print Resume (with clean `@media print` styling)
    - Download File
    - Direct **"Issue Offer in ₹ LPA →"** button with celebration confetti.
  - **Explainable AI (XAI) Overlay**:
    - Displays overall match percentage, verified matched skills tags, skill gaps, and institutional verification status.

---

## 🧪 Verification & Build Status

- **Frontend Compilation**: `npm run build` completed with **0 errors** (Vite v8.2.2).
- **Backend API**: FastAPI backend running on port 8000 and serving `/api/matching/rank/1` with verified Indian student records.
- **Vite Dev Server**: Active at `http://localhost:5173` (`200 OK`).

---

## 🚀 How to Test in Your Browser

1. Open your browser and navigate to: **`http://localhost:5173`**
2. **Student Upload Flow**:
   - Log in using the **Student Demo Account** (*Aaditya Raman / Anna University*).
   - Click the **"AI ATS Resume Scorecard"** tab in the dashboard sub-navigation.
   - Either drag and drop any `.pdf` or `.jpg` file into the upload zone, browse from your computer, or click **"Load Official Placement PDF Sample"**.
   - Notice the green preview card appears with file size, upload time, and ATS score recalculation.
   - Click **"View Document"** to inspect your resume in the interactive viewer.
3. **Hiring Manager Document Inspection Flow**:
   - Switch role to **Hiring Manager** (or log in as *Priya Venkatesh / Marcus Vance*).
   - On the **Pipeline Leaderboard**, click the **"📄 View Resume"** button on any candidate (e.g. *Rahul Sharma* or *Tanvi Pillai*).
   - In the modal, examine the document, test zoom in/out, print, download, and check the right-side XAI skill attribution overlay.
   - Click **"Issue Offer in ₹ LPA →"** to roll out an official campus placement offer with confetti!
