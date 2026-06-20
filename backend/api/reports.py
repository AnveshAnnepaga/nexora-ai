import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.models import Idea
from backend.utils.pdf_generator import generate_pdf

router = APIRouter()

@router.get("/download/{idea_id}/{report_type}")
def download_report(idea_id: int, report_type: str, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    # Convert idea model to dict
    idea_dict = {
        "title": idea.title,
        "reports_json": idea.reports_json
    }

    # Generate PDF
    os.makedirs("tmp", exist_ok=True)
    pdf_path = f"tmp/report_{idea_id}_{report_type}.pdf"
    generate_pdf(idea_dict, report_type, pdf_path)

    return FileResponse(pdf_path, filename=f"{idea.title.replace(' ', '_')}_{report_type}.pdf", media_type='application/pdf')
