import sys
import datetime
import random
import numpy as np
from sqlalchemy.orm import Session

# Ensure UTF-8 output and line buffering on Windows consoles
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)

from app.core.database import SessionLocal, engine, Base
import app.models.db_models as models
from app.services.matching_engine import evaluate_candidate_match, calculate_skill_similarity
from app.services.feedback_loop import compute_model_accuracy

def get_utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

def seed_database():
    print("[*] Initializing CareerLens AI database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    # 1. Demo Users (Enterprise + Campus)
    print("[*] Creating demo users for all personas (Indian Enterprise & Campus)...")
    users = [
        # Indian Enterprise Personas
        models.User(email="alex.chen@global.careerlens.ai", name="Aditya Shenoy (Staff Engineer - Bengaluru HQ 🇮🇳)", role="employee"),
        models.User(email="marcus.vance@global.careerlens.ai", name="Vikram Malhotra (VP Engineering - Hyderabad Hub 🇮🇳)", role="manager"),
        models.User(email="elena.rostova@global.careerlens.ai", name="Dr. Kavita Nair (CPO & National DEI Lead - Mumbai HQ 🇮🇳)", role="cpo"),
        # Campus Personas
        models.User(email="student@careerlens.ai", name="Aaditya Raman (Student - Anna University)", role="student"),
        models.User(email="recruiter@careerlens.ai", name="Priya Sundaram (Lead Recruiter - Fintech Corp India)", role="recruiter"),
        models.User(email="tpo@careerlens.ai", name="Dr. K. Balaji (Placement Director - Anna University)", role="tpo")
    ]
    db.add_all(users)
    db.commit()

    # 2. Diverse Student Cohort (60 Students)
    print("[*] Generating 60 diverse student profiles across CSE, IT, ECE, MECH, CIVIL...")
    
    first_names = [
        "Aarav", "Ananya", "Rohan", "Sneha", "Vikram", "Pooja", "Rahul", "Divya", "Karthik", "Meera",
        "Aditya", "Ishita", "Sanjay", "Swati", "Naveen", "Tanvi", "Arjun", "Kavya", "Varun", "Riya",
        "Harish", "Deepika", "Manish", "Shreya", "Pranav", "Nidhi", "Gautam", "Pavithra", "Akash", "Anushka",
        "Rishi", "Bhavna", "Kunal", "Sanjana", "Manoj", "Keerthi", "Siddharth", "Aishwarya", "Chetan", "Lakshmi",
        "Abhinav", "Preeti", "Suresh", "Gayathri", "Tejas", "Shruti", "Dinesh", "Monica", "Ajay", "Harini",
        "Rohit", "Tara", "Vishal", "Sandhya", "Kiran", "Nandini", "Ashwin", "Lavanya", "Tarun", "Sangeetha"
    ]
    last_names = [
        "Sharma", "Verma", "Patel", "Reddy", "Iyer", "Nair", "Gupta", "Singh", "Kumar", "Rao",
        "Menon", "Joshi", "Chopra", "Kulkarni", "Deshmukh", "Pillai", "Bose", "Chatterjee", "Mishra", "Das"
    ]
    departments = ["CSE", "IT", "ECE", "MECH", "CIVIL"]
    skill_pools = {
        "CSE": ["Python", "FastAPI", "React", "Docker", "SQL", "Git", "Machine Learning", "System Design", "MongoDB", "Data Structures"],
        "IT": ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "AWS", "REST API", "Docker", "Git", "Algorithms"],
        "ECE": ["C++", "Python", "Linux", "Machine Learning", "NumPy", "Git", "Data Structures", "FastAPI"],
        "MECH": ["Python", "Pandas", "NumPy", "C++", "SQL", "Git", "Machine Learning"],
        "CIVIL": ["Python", "SQL", "Pandas", "Git", "Data Structures"]
    }

    students: list[models.Student] = []

    # Star Candidate 1: High skill, 1 backlog (Rahul Sharma - triggers Backlog Bias demonstration)
    rahul = models.Student(
        roll_number="21CS042",
        name="Rahul Sharma",
        email="rahul.s@college.edu",
        department="CSE",
        cgpa=8.45,
        backlog_count=1,
        gender="Male",
        skills=["Python", "FastAPI", "Docker", "SQL", "React", "Redis", "Git", "System Design"],
        projects=[
            {"title": "High-Throughput Microservice", "tech": ["Python", "FastAPI", "Docker"]},
            {"title": "Distributed Task Queue", "tech": ["Redis", "Python"]}
        ],
        certifications=["Docker Certified Associate", "AWS Cloud Practitioner"],
        resume_text="Senior backend engineer with expertise in Python, FastAPI, Docker, and distributed systems. Built high-scale microservices with Redis.",
        profile_strength=88
    )
    students.append(rahul)

    # Star Candidate 2: High skill, Mechanical Dept (Divya Kulkarni - triggers Department Bias demonstration)
    divya = models.Student(
        roll_number="21ME018",
        name="Divya Kulkarni",
        email="divya.k@college.edu",
        department="MECH",
        cgpa=8.85,
        backlog_count=0,
        gender="Female",
        skills=["Python", "Machine Learning", "NLP", "Pandas", "NumPy", "Scikit-Learn", "Git", "SQL"],
        projects=[
            {"title": "Transformers NLP Classification", "tech": ["Python", "NLP", "Scikit-Learn"]},
            {"title": "Predictive Maintenance Engine", "tech": ["Pandas", "Machine Learning"]}
        ],
        certifications=["DeepLearning.AI ML Specialization"],
        resume_text="Machine learning researcher in Mechanical domain with extensive PyTorch, Scikit-Learn, and NLP pipelines.",
        profile_strength=92
    )
    students.append(divya)

    random.seed(42)
    for i in range(2, 60):
        first = first_names[i % len(first_names)]
        last = last_names[i % len(last_names)]
        dept = departments[i % len(departments)]
        gender = "Female" if (i % 3 == 0) else "Male"
        
        # Realistic backlog distribution: 12 have 1 backlog, 4 have 2 backlogs, rest 0
        if i % 5 == 3:
            backlogs = 1
        elif i % 15 == 7:
            backlogs = 2
        else:
            backlogs = 0

        # CGPA between 6.4 and 9.6
        cgpa = round(6.5 + (random.random() * 3.0), 2)
        
        base_skills = skill_pools[dept]
        picked_skills = random.sample(base_skills, min(len(base_skills), random.randint(4, 7)))
        if random.random() > 0.3 and "Python" not in picked_skills:
            picked_skills.append("Python")

        projects = [
            {"title": f"{picked_skills[0]} Engine", "tech": picked_skills[:2]},
            {"title": f"Scalable {picked_skills[1] if len(picked_skills) > 1 else 'App'}", "tech": picked_skills[1:3]}
        ]

        strength = min(100, int(45 + len(picked_skills) * 6 + len(projects) * 10 + (cgpa - 6.0) * 4))

        s = models.Student(
            roll_number=f"21{dept[:2]}{300+i:03d}",
            name=f"{first} {last}",
            email=f"{first.lower()}.{last.lower()}{i}@college.edu",
            department=dept,
            cgpa=cgpa,
            backlog_count=backlogs,
            gender=gender,
            skills=picked_skills,
            projects=projects,
            certifications=["Cloud Essentials"] if i % 2 == 0 else [],
            resume_text=f"Passionate {dept} undergraduate specializing in {', '.join(picked_skills[:3])}. CGPA: {cgpa}.",
            profile_strength=strength
        )
        students.append(s)

    db.add_all(students)
    db.commit()

    # 3. Placement Drives with Deliberate Disparities for Auditing
    print("[*] Creating Placement Drives (Drive 1: Backlog Bias, Drive 2: Dept Bias, Drive 3: Fair Baseline)...")
    
    # Drive 1: Fintech Cloud & Backend (Deliberate Backlog Disparity)
    drive_fintech = models.PlacementDrive(
        company_name="Fintech Corp India",
        title="Cloud Backend Engineer (Bengaluru / Pune Hub 🇮🇳)",
        role_description="Build real-time ledger and transaction processing systems in Python & FastAPI with containerized deployments at Bengaluru HQ.",
        package_ctc=16.5,
        min_cgpa=6.5,
        max_backlogs=1,
        eligible_departments=["CSE", "IT", "ECE"],
        required_skills=["Python", "FastAPI", "Docker", "SQL"],
        preferred_skills=["Redis", "System Design"],
        drive_date="2026-03-25",
        status="SHORTLISTED"
    )

    # Drive 2: NeuralAI Labs (Deliberate Department Filter Disparity)
    drive_ai = models.PlacementDrive(
        company_name="NeuralAI Labs India",
        title="Associate Machine Learning Engineer (Hyderabad Tech Hub 🇮🇳)",
        role_description="Develop LLM evaluation pipelines, NLP models, and computer vision microservices at HITEC City, Hyderabad.",
        package_ctc=18.0,
        min_cgpa=6.8,
        max_backlogs=0,
        eligible_departments=["CSE", "IT", "ECE", "MECH"],
        required_skills=["Python", "Machine Learning", "NLP", "Pandas"],
        preferred_skills=["Scikit-Learn", "PyTorch"],
        drive_date="2026-04-02",
        status="OPEN"
    )

    # Drive 3: CloudScale Systems (Fair / Audited Baseline)
    drive_web = models.PlacementDrive(
        company_name="CloudScale Systems India",
        title="Full Stack Software Developer (Chennai / Delhi-NCR Hub 🇮🇳)",
        role_description="Design modern React web frontends connected to Node.js / Python microservices with PostgreSQL.",
        package_ctc=12.0,
        min_cgpa=6.0,
        max_backlogs=1,
        eligible_departments=["CSE", "IT", "ECE", "MECH", "CIVIL"],
        required_skills=["React", "SQL", "Git"],
        preferred_skills=["JavaScript", "REST API", "Docker"],
        drive_date="2026-04-10",
        status="OPEN"
    )

    db.add_all([drive_fintech, drive_ai, drive_web])
    db.commit()
    db.refresh(drive_fintech)
    db.refresh(drive_ai)
    db.refresh(drive_web)

    # 4. Generate Applications with Statistically Meaningful Disparity
    print("[*] Generating candidate applications with XAI scores...")
    default_weights = {"skill": 0.45, "cgpa": 0.25, "project": 0.20, "backlog": 0.10}

    applications: list[models.Application] = []
    now = get_utc_now()
    
    # Drive 1: Fintech Cloud (Deliberate Backlog Disparity)
    # 0 Backlogs: 26 out of 34 shortlisted (~76.5% rate)
    # 1 Backlog: 2 out of 10 shortlisted (20.0% rate)
    # Disparity Ratio = 20.0 / 76.5 = 0.26 (Violates EEOC 80% Rule!)
    for s in students:
        if s.department in drive_fintech.eligible_departments:
            score, xai, is_eligible = evaluate_candidate_match(s, drive_fintech, default_weights)
            
            is_shortlisted = False
            if is_eligible:
                if s.backlog_count == 0 and score >= 48.0:
                    is_shortlisted = True
                elif s.backlog_count == 1 and score >= 82.0:
                    is_shortlisted = True  # Strict threshold causes statistically significant 0.26 disparity ratio!

            app = models.Application(
                student_id=s.id,
                drive_id=drive_fintech.id,
                match_score=score,
                match_explanation=xai.model_dump(),
                status="SHORTLISTED" if is_shortlisted else ("APPLIED" if is_eligible else "NOT_ELIGIBLE"),
                applied_at=now - datetime.timedelta(days=10)
            )
            applications.append(app)

    # Drive 2: NeuralAI Labs (Deliberate Department Disparity)
    # CSE/IT: 20 out of 25 shortlisted (80.0% rate)
    # ECE/MECH: 3 out of 11 shortlisted (27.2% rate)
    # Disparity Ratio = 27.2 / 80.0 = 0.34 (Violates EEOC 80% Rule!)
    for s in students:
        if s.department in drive_ai.eligible_departments:
            score, xai, is_eligible = evaluate_candidate_match(s, drive_ai, default_weights)
            
            is_shortlisted = False
            if is_eligible:
                if s.department in ["CSE", "IT"] and score >= 50.0:
                    is_shortlisted = True
                elif s.department in ["ECE", "MECH"] and score >= 80.0:
                    is_shortlisted = True

            app = models.Application(
                student_id=s.id,
                drive_id=drive_ai.id,
                match_score=score,
                match_explanation=xai.model_dump(),
                status="SHORTLISTED" if is_shortlisted else ("APPLIED" if is_eligible else "NOT_ELIGIBLE"),
                applied_at=now - datetime.timedelta(days=5)
            )
            applications.append(app)

    # Drive 3: Fair Baseline (All departments & cohorts get equal criteria)
    # Shortlisting Rate across all cohorts >= 82% of max group rate (DR >= 0.82 -> PASS)
    for s in students:
        score, xai, is_eligible = evaluate_candidate_match(s, drive_web, default_weights)
        is_shortlisted = is_eligible and (score >= 46.0)
        app = models.Application(
            student_id=s.id,
            drive_id=drive_web.id,
            match_score=score,
            match_explanation=xai.model_dump(),
            status="SHORTLISTED" if is_shortlisted else ("APPLIED" if is_eligible else "NOT_ELIGIBLE"),
            applied_at=now - datetime.timedelta(days=2)
        )
        applications.append(app)

    db.add_all(applications)
    db.commit()

    # 5. Historical Interview Outcomes & True Mathematical Accuracy Cycles
    print("[*] Generating 45 historical interview outcomes and fitting 4 real feedback cycles...")
    
    d1_shortlisted = [a for a in applications if a.drive_id == drive_fintech.id and a.status == "SHORTLISTED"]
    
    outcomes: list[models.InterviewOutcome] = []
    
    # Ground truth: Recruiter selects candidates where practical skills and projects are validated!
    np.random.seed(42)
    sample_pool = d1_shortlisted[:25] + [a for a in applications if a.drive_id == drive_web.id and a.status == "SHORTLISTED"][:20]

    # Pre-index students and drives to avoid 90 redundant remote database round trips
    student_map = {s.id: s for s in students}
    drive_map = {d.id: d for d in [drive_fintech, drive_ai, drive_web]}

    X_list, y_list = [], []

    for i, app in enumerate(sample_pool):
        st = student_map.get(app.student_id)
        drv = drive_map.get(app.drive_id)
        if not st or not drv:
            continue
        
        skill_sim, _, _ = calculate_skill_similarity(st.skills, drv.required_skills, drv.preferred_skills)
        cgpa_norm = float(np.clip((st.cgpa - 5.0) / 5.0, 0.0, 1.0))
        proj_norm = float(np.clip(len(st.projects) / 3.0, 0.0, 1.0))
        backlog_norm = float(np.clip(st.backlog_count / 3.0, 0.0, 1.0))

        # True recruiter hiring formula:
        # High skills & projects drive hiring; 1 backlog is forgiven if skill > 0.70
        true_merit = 0.55 * skill_sim + 0.30 * proj_norm + 0.15 * cgpa_norm - 0.06 * backlog_norm
        selected = (true_merit >= 0.52)

        fail_cat = "NONE" if selected else random.choice(["TECHNICAL", "COMMUNICATION", "SKILL_GAP"])
        notes = (
            f"Candidate excelled in system architecture and coding interview. Practical skill verified."
            if selected else f"Candidate struggled in {fail_cat} round."
        )

        outcome = models.InterviewOutcome(
            application_id=app.id,
            student_id=st.id,
            drive_id=drv.id,
            result="SELECTED" if selected else "REJECTED",
            failure_category=fail_cat,
            feedback_notes=notes,
            features_snapshot={
                "skill_match": round(skill_sim, 3),
                "cgpa_norm": round(cgpa_norm, 3),
                "projects_norm": round(proj_norm, 3),
                "backlog_norm": round(backlog_norm, 3)
            },
            logged_at=now - datetime.timedelta(days=25 - (i % 20))
        )
        outcomes.append(outcome)
        X_list.append([skill_sim, cgpa_norm, proj_norm, backlog_norm])
        y_list.append(1 if selected else 0)

    db.add_all(outcomes)
    db.commit()

    # Now, calculate true empirical mathematical accuracy across 4 cycles:
    X_arr = np.array(X_list)
    y_arr = np.array(y_list)

    # Cycle 0: Naive Static Model (Heavy CGPA bias, heavy backlog penalty, skill under-weighted)
    w0 = {"skill": 0.15, "cgpa": 0.55, "project": 0.10, "backlog": 0.35}
    acc0, prec0, f1_0 = compute_model_accuracy(w0, -0.015, X_arr, y_arr)

    # Cycle 1: After 12 recruiter outcome logs
    w1 = {"skill": 0.32, "cgpa": 0.36, "project": 0.18, "backlog": 0.18}
    acc1, prec1, f1_1 = compute_model_accuracy(w1, -0.015, X_arr, y_arr)

    # Cycle 2: After 25 recruiter outcome logs
    w2 = {"skill": 0.42, "cgpa": 0.26, "project": 0.20, "backlog": 0.12}
    acc2, prec2, f1_2 = compute_model_accuracy(w2, 0.00, X_arr, y_arr)

    # Cycle 3: Converged Optimal Model (Trained on all feedback logs)
    w3 = {"skill": 0.58, "cgpa": 0.16, "project": 0.22, "backlog": 0.04}
    acc3, prec3, f1_3 = compute_model_accuracy(w3, -0.035, X_arr, y_arr)

    cycle_history = [
        models.ModelWeightHistory(
            cycle_number=0,
            weight_skill=w0["skill"],
            weight_cgpa=w0["cgpa"],
            weight_project=w0["project"],
            weight_backlog_penalty=w0["backlog"],
            intercept=-0.05,
            accuracy=round(acc0, 3),
            precision=round(prec0, 3),
            f1_score=round(f1_0, 3),
            sample_count=0,
            is_active=False,
            notes="Cycle 0: Static baseline (High CGPA reliance, harsh backlog penalty)",
            created_at=now - datetime.timedelta(days=30)
        ),
        models.ModelWeightHistory(
            cycle_number=1,
            weight_skill=w1["skill"],
            weight_cgpa=w1["cgpa"],
            weight_project=w1["project"],
            weight_backlog_penalty=w1["backlog"],
            intercept=-0.02,
            accuracy=round(acc1, 3),
            precision=round(prec1, 3),
            f1_score=round(f1_1, 3),
            sample_count=12,
            is_active=False,
            notes="Cycle 1: Recalibrated after 12 recruiter interview logs",
            created_at=now - datetime.timedelta(days=20)
        ),
        models.ModelWeightHistory(
            cycle_number=2,
            weight_skill=w2["skill"],
            weight_cgpa=w2["cgpa"],
            weight_project=w2["project"],
            weight_backlog_penalty=w2["backlog"],
            intercept=0.01,
            accuracy=round(acc2, 3),
            precision=round(prec2, 3),
            f1_score=round(f1_2, 3),
            sample_count=25,
            is_active=False,
            notes="Cycle 2: Softened backlog penalty as skilled students passed coding interviews",
            created_at=now - datetime.timedelta(days=10)
        ),
        models.ModelWeightHistory(
            cycle_number=3,
            weight_skill=w3["skill"],
            weight_cgpa=w3["cgpa"],
            weight_project=w3["project"],
            weight_backlog_penalty=w3["backlog"],
            intercept=0.03,
            accuracy=round(acc3, 3),
            precision=round(prec3, 3),
            f1_score=round(f1_3, 3),
            sample_count=len(outcomes),
            is_active=True,
            notes="Cycle 3: Optimal convergence — skill similarity is the strongest hiring predictor",
            created_at=now - datetime.timedelta(days=1)
        )
    ]

    db.add_all(cycle_history)
    db.commit()

    print("[SUCCESS] Seed data successfully loaded!")
    print(f"   Students: {len(students)}")
    print(f"   Drives: 3 (Drive 1: Backlog Bias, Drive 2: Dept Bias, Drive 3: Fair)")
    print(f"   Applications: {len(applications)}")
    print(f"   Interview Outcomes: {len(outcomes)}")
    print(f"   Feedback Cycles: 4")
    print(f"     Cycle 0 (Static): Accuracy = {cycle_history[0].accuracy*100:.1f}%, F1 = {cycle_history[0].f1_score*100:.1f}%")
    print(f"     Cycle 1 (12 logs): Accuracy = {cycle_history[1].accuracy*100:.1f}%, F1 = {cycle_history[1].f1_score*100:.1f}%")
    print(f"     Cycle 2 (25 logs): Accuracy = {cycle_history[2].accuracy*100:.1f}%, F1 = {cycle_history[2].f1_score*100:.1f}%")
    print(f"     Cycle 3 (Converged): Accuracy = {cycle_history[3].accuracy*100:.1f}%, F1 = {cycle_history[3].f1_score*100:.1f}%")
    db.close()

if __name__ == "__main__":
    seed_database()
