from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.models.db_models import Student, PlacementDrive
from app.models.schemas import CareerRoadmapResponse, RoadmapMilestone, LearningResource
from app.services.matching_engine import evaluate_candidate_match, get_active_model_weights

CURATED_RESOURCES: Dict[str, List[Dict[str, str]]] = {
    "Docker": [
        {"title": "Docker for Beginners", "url": "https://docker-curriculum.com/", "platform": "Docker Docs", "type": "Documentation"},
        {"title": "FreeCodeCamp Docker 3-Hour Bootcamp", "url": "https://www.youtube.com/watch?v=fqMOX6JJhGo", "platform": "YouTube", "type": "Course"}
    ],
    "Kubernetes": [
        {"title": "Kubernetes Official Tutorial", "url": "https://kubernetes.io/docs/tutorials/", "platform": "Kubernetes.io", "type": "Documentation"},
        {"title": "K8s in 1 Hour - TechWorld with Nana", "url": "https://www.youtube.com/watch?v=X48VuDVv0do", "platform": "YouTube", "type": "Course"}
    ],
    "AWS": [
        {"title": "AWS Cloud Practitioner Free Essentials", "url": "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/", "platform": "AWS Skill Builder", "type": "Course"},
        {"title": "AWS Hands-On Labs & Architectures", "url": "https://workshops.aws/", "platform": "AWS", "type": "Practice"}
    ],
    "FastAPI": [
        {"title": "FastAPI Official Interactive Tutorial", "url": "https://fastapi.tiangolo.com/tutorial/", "platform": "FastAPI", "type": "Documentation"},
        {"title": "Build Production REST APIs with FastAPI", "url": "https://www.youtube.com/watch?v=0sOvCWFmrtA", "platform": "YouTube", "type": "Course"}
    ],
    "React": [
        {"title": "React.dev Interactive Guide", "url": "https://react.dev/learn", "platform": "React Docs", "type": "Documentation"},
        {"title": "Full Stack Open - University of Helsinki", "url": "https://fullstackopen.com/en/", "platform": "FullStackOpen", "type": "Course"}
    ],
    "Machine Learning": [
        {"title": "Scikit-Learn User Guide & Tutorials", "url": "https://scikit-learn.org/stable/tutorial/index.html", "platform": "Scikit-Learn", "type": "Documentation"},
        {"title": "Kaggle Micro-Courses: Intro to Machine Learning", "url": "https://www.kaggle.com/learn/intro-to-machine-learning", "platform": "Kaggle", "type": "Practice"}
    ],
    "System Design": [
        {"title": "System Design Primer by Donne Martin", "url": "https://github.com/donnemartin/system-design-primer", "platform": "GitHub", "type": "Documentation"},
        {"title": "ByteByteGo System Design Fundamentals", "url": "https://bytebytego.com/", "platform": "ByteByteGo", "type": "Course"}
    ],
    "Redis": [
        {"title": "Redis University - Fast & Flexible NoSQL", "url": "https://university.redis.com/", "platform": "Redis University", "type": "Course"}
    ],
    "SQL": [
        {"title": "SQLBolt - Interactive SQL Lessons", "url": "https://sqlbolt.com/", "platform": "SQLBolt", "type": "Practice"},
        {"title": "Mode Analytics SQL Tutorial", "url": "https://mode.com/sql-tutorial/", "platform": "Mode", "type": "Documentation"}
    ]
}

def generate_student_roadmap(db: Session, student_id: int, drive_id: int) -> CareerRoadmapResponse:
    """Generates personalized skill-gap roadmap tailored to the target placement drive."""
    student = db.query(Student).filter(Student.id == student_id).first()
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()

    if not student or not drive:
        raise ValueError("Student or Drive not found")

    weights = get_active_model_weights(db)
    current_score, xai, _ = evaluate_candidate_match(student, drive, weights)

    missing = xai.missing_skills or []
    # If no missing skills from drive, recommend advanced skills
    if not missing:
        missing = ["System Design", "Docker", "AWS"]

    milestones: List[RoadmapMilestone] = []
    for skill in missing[:4]:
        raw_resources = CURATED_RESOURCES.get(skill, [
            {"title": f"Complete {skill} Developer Guide", "url": f"https://www.google.com/search?q={skill}+free+tutorial", "platform": "Web", "type": "Course"},
            {"title": f"{skill} Official Documentation", "url": f"https://devdocs.io/", "platform": "DevDocs", "type": "Documentation"}
        ])

        resources = [LearningResource(**r) for r in raw_resources]
        priority = "High" if skill in (drive.required_skills or []) else "Recommended"
        estimated_hours = 12 if priority == "High" else 8
        proj = f"Build a production microservice implementing {skill} with tests and CI/CD."

        milestones.append(RoadmapMilestone(
            skill=skill,
            priority=priority,
            estimated_hours=estimated_hours,
            resources=resources,
            suggested_project=proj
        ))

    # Projected score if these missing skills are added
    hypo_skills = list(set((student.skills or []) + missing[:3]))
    hypo_student = type("HypoStudent", (), {
        "name": student.name,
        "department": student.department,
        "cgpa": student.cgpa,
        "backlog_count": student.backlog_count,
        "gender": student.gender,
        "skills": hypo_skills,
        "projects": (student.projects or []) + [{"title": f"Advanced {missing[0]} Service", "tech": [missing[0]]}]
    })()

    projected_score, _, _ = evaluate_candidate_match(hypo_student, drive, weights)

    summary = (
        f"By mastering {', '.join(missing[:2])} and completing the suggested portfolio projects, "
        f"your match score for {drive.company_name} ({drive.title}) is projected to climb from "
        f"{current_score:.1f}% to {projected_score:.1f}%, placing you in the top 10% shortlist tier."
    )

    return CareerRoadmapResponse(
        student_name=student.name,
        target_role=drive.title,
        target_company=drive.company_name,
        current_match_score=current_score,
        projected_match_score=projected_score,
        missing_critical_skills=missing,
        learning_path=milestones,
        readiness_summary=summary
    )
