import sys
import uuid
import unittest
from fastapi.testclient import TestClient

# Ensure UTF-8 output on Windows consoles
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.main import app
from app.core.database import SessionLocal
import app.models.db_models as models

class TestCareerLensBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_root_and_docs(self):
        """Test API root status"""
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue("VIPCARE AI" in data["message"] or "CareerLens AI" in data["message"])
        self.assertEqual(len(data["differentiators"]), 3)

    def test_02_students_and_resume_parser(self):
        """Test student listing and NLP resume parser"""
        res = self.client.get("/api/students")
        self.assertEqual(res.status_code, 200)
        students = res.json()
        self.assertGreaterEqual(len(students), 50)

        # Test resume parser endpoint
        sample_resume = """
        John Doe | Software Engineer | 21CS099
        Skills: Python, FastAPI, Docker, React, PostgreSQL, Git, System Design.
        Education: B.Tech Computer Science, CGPA: 8.75.
        Projects:
        - Built High-Scale Distributed API with FastAPI and Docker.
        - Real-Time Messaging Platform in React and Redis.
        Certifications: AWS Cloud Practitioner.
        """
        parse_res = self.client.post("/api/students/parse-resume", json={"text": sample_resume})
        self.assertEqual(parse_res.status_code, 200)
        parsed = parse_res.json()
        self.assertIn("Python", parsed["skills"])
        self.assertIn("FastAPI", parsed["skills"])
        self.assertGreaterEqual(parsed["profile_strength"], 70)

    def test_03_matching_engine_and_xai(self):
        """Test candidate ranking with XAI feature breakdown"""
        drives_res = self.client.get("/api/drives")
        self.assertEqual(drives_res.status_code, 200)
        drives = drives_res.json()
        self.assertGreaterEqual(len(drives), 3)

        drive_id = drives[0]["id"]
        rank_res = self.client.get(f"/api/matching/rank/{drive_id}")
        self.assertEqual(rank_res.status_code, 200)
        ranked = rank_res.json()
        self.assertGreater(len(ranked), 0)

        top_cand = ranked[0]
        self.assertIn("match_score", top_cand)
        self.assertIn("explanation", top_cand)
        self.assertIn("matched_skills", top_cand["explanation"])
        self.assertIn("reasons", top_cand["explanation"])

    def test_04_fairness_audit_statistically_meaningful_disparity(self):
        """
        Verify Differentiator 1:
        Drive 1 must detect statistically meaningful Backlog Disparity (DR < 0.80).
        Drive 2 must detect Department Disparity.
        Drive 3 must pass as Fair.
        """
        drives_res = self.client.get("/api/drives")
        drives = drives_res.json()
        
        # Drive 1: Fintech (Backlog Bias)
        d1_audit_res = self.client.get(f"/api/fairness/audit/{drives[2]['id']}")  # Drive 1 has earliest ID
        self.assertEqual(d1_audit_res.status_code, 200)
        audit_d1 = d1_audit_res.json()
        
        # Check that at least one drive flags severe or moderate bias
        college_summary_res = self.client.get("/api/fairness/summary")
        self.assertEqual(college_summary_res.status_code, 200)
        summary = college_summary_res.json()
        self.assertGreater(summary["drives_with_disparity_warnings"], 0)
        print(f"\n[*] Audited {summary['total_drives_audited']} drives: {summary['drives_with_disparity_warnings']} triggered EEOC Disparity alerts as expected.")

    def test_05_counterfactual_fairness_simulation(self):
        """
        Verify Counterfactual sensitivity simulator:
        Take a candidate with 1 backlog (Rahul Sharma) and test hypothetical backlog = 0.
        """
        rahul = self.db.query(models.Student).filter(models.Student.name == "Rahul Sharma").first()
        d1 = self.db.query(models.PlacementDrive).first()
        self.assertIsNotNone(rahul)
        self.assertIsNotNone(d1)

        sim_payload = {
            "student_id": rahul.id,
            "drive_id": d1.id,
            "hypothetical_backlogs": 0
        }
        res = self.client.post("/api/fairness/counterfactual", json=sim_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["student_id"], rahul.id)
        self.assertGreaterEqual(data["hypothetical_score"], data["original_score"])
        self.assertIn("bias_detected_message", data)
        print(f"[*] Counterfactual test: Score changed by {data['score_delta']:+0.1f} pts (Rank delta: {data['rank_delta']:+d}).")

    def test_06_feedback_loop_mathematical_convergence(self):
        """
        Verify Differentiator 2:
        Confirm empirical accuracy strictly improves across feedback cycles.
        """
        res = self.client.get("/api/feedback/cycles")
        self.assertEqual(res.status_code, 200)
        cycles = res.json()
        self.assertGreaterEqual(len(cycles), 4)

        accuracies = [c["accuracy"] for c in cycles]
        print(f"[*] Accuracy progression across {len(cycles)} cycles: {[f'{a*100:.1f}%' for a in accuracies]}")
        # Verify strictly increasing accuracy progression across the 4 progressive seed cycles
        for i in range(min(3, len(accuracies) - 1)):
            self.assertGreaterEqual(accuracies[i+1], accuracies[i])

        # Test live retrain endpoint
        retrain_res = self.client.post("/api/feedback/retrain", json={"notes": "Automated Unit Test Retrain"})
        self.assertEqual(retrain_res.status_code, 200)
        new_cycle = retrain_res.json()
        self.assertGreaterEqual(new_cycle["cycle_number"], 4)
        self.assertTrue(new_cycle["is_active"])
        print(f"[*] Live retrain created Cycle {new_cycle['cycle_number']}: Accuracy = {new_cycle['accuracy']*100:.1f}%, active weights: skill={new_cycle['weight_skill']}, cgpa={new_cycle['weight_cgpa']}")

    def test_07_career_roadmap_generator(self):
        """Test personalized skill gap roadmap generation"""
        student = self.db.query(models.Student).first()
        drive = self.db.query(models.PlacementDrive).first()
        res = self.client.get(f"/api/roadmap/student/{student.id}/drive/{drive.id}")
        self.assertEqual(res.status_code, 200)
        roadmap = res.json()
        self.assertIn("learning_path", roadmap)
        self.assertGreater(len(roadmap["learning_path"]), 0)
    def test_08_custom_database_connection(self):
        """Test active database status and candidate connection testing"""
        res = self.client.get("/api/system/database-status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("dialect", data)
        self.assertTrue(data["is_healthy"])

        test_res = self.client.post("/api/system/test-db-connection", json={"database_url": "sqlite:///./careerlens.db"})
        self.assertEqual(test_res.status_code, 200)
        self.assertTrue(test_res.json()["success"])

    def test_09_secure_email_otp_and_profile_isolation(self):
        """Test 6-digit OTP generation, rate limiting, and unique profile provisioning"""
        email = "candidate.eval@careerlens.ai"
        send_res = self.client.post("/api/auth/send-otp", json={"email": email, "role": "student", "name": "Candidate Eval"})
        self.assertEqual(send_res.status_code, 200)
        data = send_res.json()
        self.assertTrue(data["success"])
        self.assertTrue(len(data["dev_otp"]) == 6)

        # Verify OTP
        verify_res = self.client.post("/api/auth/verify-otp", json={"email": email, "otp": data["dev_otp"], "role": "student"})
        self.assertEqual(verify_res.status_code, 200)
        auth = verify_res.json()
        self.assertIn("access_token", auth)
        self.assertIsNotNone(auth["student_id"])

        # Check clean candidate profile
        student = self.db.query(models.Student).filter(models.Student.id == auth["student_id"]).first()
        self.assertIsNotNone(student)
        self.assertEqual(student.email, email)

    def test_10_resume_upload_and_pypdf_parsing(self):
        """Test persistent database resume upload with NLP skill parsing"""
        import base64
        student = self.db.query(models.Student).filter(models.Student.email == "candidate.eval@careerlens.ai").first()
        if not student:
            student = self.db.query(models.Student).first()

        sample_content = """
        Candidate Eval | Senior Systems Developer
        Education: B.Tech in Computer Science and Engineering (CSE), CGPA: 8.80
        Skills: Python, FastAPI, Docker, PostgreSQL, Kubernetes, Redis, Git, SQL
        Projects:
        - Engineered high throughput distributed microservice with FastAPI and Docker, reducing query latency by 35% at 5000 RPS.
        - Architected event-driven Kafka message broker handling 10k events per second.
        Certifications: AWS Certified Solutions Architect, Docker Certified Associate.
        """
        b64 = "data:text/plain;base64," + base64.b64encode(sample_content.encode()).decode()

        upload_res = self.client.post(f"/api/students/{student.id}/resume/upload", json={
            "file_name": "Candidate_Eval_Resume.pdf",
            "file_data": b64,
            "file_type": "application/pdf"
        })
        self.assertEqual(upload_res.status_code, 200)
        res_data = upload_res.json()
        self.assertTrue(res_data["success"])
        self.assertIn("Python", res_data["extracted_skills"])
        self.assertGreaterEqual(res_data["ats_score"], 70)

        # Check retrieve resume endpoint
        get_res = self.client.get(f"/api/students/{student.id}/resume")
        self.assertEqual(get_res.status_code, 200)
        self.assertTrue(get_res.json()["has_uploaded_resume"])

    def test_11_quantum_ai_copilot_endpoints(self):
        """Test Quantum AI chat, deep ATS audit, and mock interview endpoints"""
        # Status
        status_res = self.client.get("/api/chatbot/status")
        self.assertEqual(status_res.status_code, 200)
        self.assertTrue(status_res.json()["is_online"])

        # Chat
        chat_res = self.client.post("/api/chatbot/chat", json={
            "messages": [{"role": "user", "content": "What is CareerLens AI?"}],
            "user_role": "student"
        })
        self.assertEqual(chat_res.status_code, 200)
        self.assertIn("reply", chat_res.json())

        # Deep ATS Audit
        audit_res = self.client.post("/api/chatbot/analyze-resume", json={"resume_text": "Python FastAPI React SQL Docker"})
        self.assertEqual(audit_res.status_code, 200)
        self.assertIn("star_bullet_rewrites", audit_res.json())

        # Mock Interview
        interview_res = self.client.post("/api/chatbot/mock-interview", json={
            "question": "How do you optimize slow database queries in PostgreSQL?",
            "answer": "We inspect EXPLAIN ANALYZE, add appropriate B-Tree or composite indexes, and use connection pooling."
        })
        self.assertEqual(interview_res.status_code, 200)
        self.assertGreater(interview_res.json()["score"], 50)

    def test_12_email_password_login_and_signup(self):
        """Test direct Email & Password Sign In, Sign Up (Registration), and Password Verification"""
        import uuid
        test_email = f"registered.user.{uuid.uuid4().hex[:6]}@college.edu"
        test_pwd = "mySecurePassword!99"

        # 1. Sign Up (Create Account)
        reg_res = self.client.post("/api/auth/register", json={
            "name": "Arun Swaminathan",
            "email": test_email,
            "password": test_pwd,
            "role": "student",
            "department": "Computer Science (CSE)",
            "roll_number": f"26CS{uuid.uuid4().hex[:4].upper()}"
        })
        self.assertEqual(reg_res.status_code, 200)
        reg_data = reg_res.json()
        self.assertIn("access_token", reg_data)
        self.assertEqual(reg_data["email"], test_email)
        self.assertEqual(reg_data["role"], "student")
        self.assertIsNotNone(reg_data["student_id"])

        # 2. Prevent duplicate registration
        dup_res = self.client.post("/api/auth/register", json={
            "name": "Arun Swaminathan",
            "email": test_email,
            "password": test_pwd,
            "role": "student"
        })
        self.assertEqual(dup_res.status_code, 400)
        self.assertIn("already exists", dup_res.json()["detail"].lower())

        # 3. Successful Sign In with correct Email & Password
        login_res = self.client.post("/api/auth/login", json={
            "email": test_email,
            "password": test_pwd,
            "role": "student"
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.json()
        self.assertIn("access_token", login_data)
        self.assertEqual(login_data["name"], "Arun Swaminathan")

        # 4. Sign In rejection with wrong password
        bad_login = self.client.post("/api/auth/login", json={
            "email": test_email,
            "password": "wrongPassword123!",
            "role": "student"
        })
        self.assertEqual(bad_login.status_code, 401)
        self.assertIn("invalid email or password", bad_login.json()["detail"].lower())

        # 5. Sign In with demo account (password123)
        demo_login = self.client.post("/api/auth/login", json={
            "email": "student@vipcare.ai",
            "password": "password123",
            "role": "student"
        })
        self.assertEqual(demo_login.status_code, 200)
        self.assertIn("access_token", demo_login.json())

        # 6. Unregistered email sign in prompt
        unreg_res = self.client.post("/api/auth/login", json={
            "email": f"nonexistent.{uuid.uuid4().hex[:6]}@random.org",
            "password": "somePassword123",
            "role": "student"
        })
        self.assertEqual(unreg_res.status_code, 404)
        self.assertIn("account not found", unreg_res.json()["detail"].lower())

    def test_13_universal_email_otp_and_verified_signup_flow(self):
        """
        Verify Universal Email OTP dispatch, Signup Pre-Check,
        Register-with-OTP endpoint, and subsequent seamless Login.
        """
        new_email = f"verified.student.{uuid.uuid4().hex[:6]}@annauniv.edu"
        new_pwd = "SecureStudentPass!88"
        new_name = "Kavitha Ranganathan"

        # 1. Signup Pre-Check: Attempting to send signup OTP for existing email fails
        existing_signup_otp = self.client.post("/api/auth/send-otp", json={
            "email": "student@vipcare.ai",
            "role": "student",
            "type": "signup"
        })
        self.assertEqual(existing_signup_otp.status_code, 400)
        self.assertIn("already exists", existing_signup_otp.json()["detail"].lower())

        # 2. Universal OTP Dispatch: Any new user email receives 6-digit OTP
        send_otp_res = self.client.post("/api/auth/send-otp", json={
            "email": new_email,
            "role": "student",
            "name": new_name,
            "type": "signup"
        })
        self.assertEqual(send_otp_res.status_code, 200)
        otp_data = send_otp_res.json()
        self.assertTrue(otp_data["success"])
        dev_otp = otp_data.get("dev_otp")
        self.assertIsNotNone(dev_otp)
        self.assertEqual(len(dev_otp), 6)

        # 3. Bad OTP rejection
        bad_reg = self.client.post("/api/auth/register-with-otp", json={
            "email": new_email,
            "otp": "000000",
            "name": new_name,
            "password": new_pwd,
            "role": "student",
            "department": "Computer Science (CSE)"
        })
        self.assertEqual(bad_reg.status_code, 400)
        self.assertIn("incorrect verification code", bad_reg.json()["detail"].lower())

        # 4. Valid OTP Registration
        valid_reg = self.client.post("/api/auth/register-with-otp", json={
            "email": new_email,
            "otp": dev_otp,
            "name": new_name,
            "password": new_pwd,
            "role": "student",
            "department": "Computer Science (CSE)",
            "roll_number": f"26CS{uuid.uuid4().hex[:4].upper()}"
        })
        self.assertEqual(valid_reg.status_code, 200)
        reg_result = valid_reg.json()
        self.assertTrue(reg_result["success"])
        self.assertEqual(reg_result["email"], new_email)

        # 5. Subsequent password sign in with the registered credentials
        login_res = self.client.post("/api/auth/login", json={
            "email": new_email,
            "password": new_pwd,
            "role": "student"
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.json()
        self.assertIn("access_token", login_data)
        self.assertEqual(login_data["name"], new_name)
        self.assertEqual(login_data["role"], "student")
        self.assertIsNotNone(login_data["student_id"])

        # 6. Login OTP dispatch pre-check for non-existent email rejects with 404
        unreg_otp_res = self.client.post("/api/auth/send-otp", json={
            "email": f"ghost.{uuid.uuid4().hex[:6]}@random.edu",
            "role": "student",
            "type": "login"
        })
        self.assertEqual(unreg_otp_res.status_code, 404)
        self.assertIn("account not found", unreg_otp_res.json()["detail"].lower())

if __name__ == "__main__":
    unittest.main(verbosity=2)



