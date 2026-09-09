import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("Starting VIPCARE Verification Suite...")

# 1. Test Root
r = client.get("/")
assert r.status_code == 200, f"Root error: {r.text}"
assert "VIPCARE" in r.json()["message"], f"Branding missing: {r.json()}"
print("[PASS] 1. Root VIPCARE check")

# 2. Test Demo Credentials
r = client.get("/api/auth/demo-credentials")
assert r.status_code == 200
creds = r.json()
assert "vipcare.ai" in creds["student"]["email"]
print("[PASS] 2. Demo credentials check (vipcare.ai)")

# 3. Test Registering a Company Drive
new_drive = {
    "company_name": "VIPCARE Cloud Platforms",
    "title": "Senior Distributed Systems Engineer",
    "role_description": "Core distributed platform engineering",
    "package_ctc": 28.5,
    "min_cgpa": 7.0,
    "max_backlogs": 0,
    "eligible_departments": ["CSE", "IT"],
    "required_skills": ["Python", "Docker", "Kubernetes"],
    "preferred_skills": ["Kafka"],
    "drive_date": "2026-11-01",
    "status": "OPEN"
}
r = client.post("/api/drives", json=new_drive)
assert r.status_code == 200, f"Drive create error: {r.text}"
drive_data = r.json()
drive_id = drive_data["id"]
print(f"[PASS] 3. Registered Company Drive: {drive_data['company_name']} (id={drive_id})")

# 4. Test Student Applying with Student Details Form
r = client.get("/api/students")
assert r.status_code == 200
students = r.json()
assert len(students) > 0
student_id = students[0]["id"]

student_form = {
    "fullName": students[0]["name"],
    "rollNumber": students[0]["roll_number"],
    "email": students[0]["email"],
    "phone": "+91 98401 99999",
    "locationHub": "Bengaluru HQ",
    "department": students[0]["department"],
    "cgpa": students[0]["cgpa"],
    "backlogs": 0,
    "skills": ["Python", "Docker", "Kubernetes", "FastAPI"],
    "githubUrl": "https://github.com/vipcarecandidate",
    "statementOfInterest": "Excited to register and apply for VIPCARE Cloud Platforms!",
    "certifiedTrue": True
}

r = client.post(f"/api/students/{student_id}/apply/{drive_id}", json=student_form)
assert r.status_code == 200, f"Apply error: {r.text}"
apply_res = r.json()
assert "Successfully registered" in apply_res["message"] or "already submitted" in apply_res["message"]
print(f"[PASS] 4. Student Details Form submitted successfully (Live Match Score: {apply_res['match_score']}%)")

# 5. Test Recruiter seeing Student Details Form
r = client.get(f"/api/matching/rank/{drive_id}")
assert r.status_code == 200, f"Rank error: {r.text}"
ranked = r.json()
found = [cand for cand in ranked if cand["student_id"] == student_id]
assert len(found) > 0
candidate = found[0]
assert candidate["has_applied"] == True, "Candidate should be marked as has_applied=True"
assert candidate["form_details"] is not None, "Candidate should have form_details attached"
assert candidate["form_details"]["phone"] == "+91 98401 99999"
assert candidate["form_details"]["statementOfInterest"] == "Excited to register and apply for VIPCARE Cloud Platforms!"
print("[PASS] 5. Recruiter can see Student Details Form & applied status")

# 6. Test Student Applications List contains submitted form details
r = client.get(f"/api/students/{student_id}/applications")
assert r.status_code == 200
student_apps = r.json()
app_found = [a for a in student_apps if a["drive_id"] == drive_id]
assert len(app_found) > 0
assert app_found[0]["form_details"]["phone"] == "+91 98401 99999"
print("[PASS] 6. Student Applications list contains submitted form details")

print("\nSUCCESS: ALL VIPCARE END-TO-END VERIFICATION CHECKS PASSED!")
