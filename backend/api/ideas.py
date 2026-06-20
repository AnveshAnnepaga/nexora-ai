from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, defer
from sqlalchemy import desc
from backend.core.database import get_db
from backend.core.models import Idea, User
from pydantic import BaseModel
from typing import Optional
import io
from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor

router = APIRouter()

@router.get("/public")
def get_public_ideas(db: Session = Depends(get_db)):
    ideas = db.query(Idea, User).options(defer(Idea.reports_json)).join(User, Idea.user_id == User.id).filter(Idea.visibility == "public").order_by(desc(Idea.date_submitted)).all()
    result = []
    for idea, user in ideas:
        result.append({
            "id": idea.id,
            "title": idea.title,
            "industry": idea.industry,
            "description": idea.description[:120] if idea.description else "",
            "nexora_score": idea.nexora_score,
            "success_probability": idea.success_probability,
            "date_submitted": idea.date_submitted,
            "founder_name": user.full_name.split()[0] if user.full_name else "Anonymous", # First name only
            "founder_location": user.location,
            "founder_id": user.id,
            "contact_requests": idea.contact_requests
        })
    return result

@router.get("/my/{user_id}")
def get_my_ideas(user_id: int, db: Session = Depends(get_db)):
    ideas = db.query(Idea).options(defer(Idea.reports_json)).filter(Idea.user_id == user_id).order_by(desc(Idea.date_submitted)).all()
    result = []
    for idea in ideas:
        result.append({
            "id": idea.id,
            "title": idea.title,
            "industry": idea.industry,
            "nexora_score": idea.nexora_score,
            "date_submitted": idea.date_submitted,
            "visibility": idea.visibility,
            "contact_requests": idea.contact_requests
        })
    return result

@router.get("/{idea_id}")
def get_idea(idea_id: int, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
        
    user = db.query(User).filter(User.id == idea.user_id).first()
    
    return {
        "id": idea.id,
        "title": idea.title,
        "industry": idea.industry,
        "description": idea.description,
        "nexora_score": idea.nexora_score,
        "success_probability": idea.success_probability,
        "date_submitted": idea.date_submitted,
        "reports_json": idea.reports_json,
        "visibility": idea.visibility,
        "founder_id": user.id,
        "founder_name": user.full_name,
        "founder_photo": user.profile_photo,
        "founder_location": user.location,
        "founder_linkedin": user.linkedin_url
    }

class VisibilityUpdate(BaseModel):
    visibility: str

@router.patch("/visibility/{idea_id}")
def update_visibility(idea_id: int, vis: VisibilityUpdate, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    idea.visibility = vis.visibility
    db.commit()
    return {"success": True}

@router.delete("/{idea_id}")
def delete_idea(idea_id: int, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    db.delete(idea)
    db.commit()
    return {"success": True}

@router.get("/{idea_id}/pitch-deck/pdf")
def download_pitch_deck_pdf(idea_id: int, db: Session = Depends(get_db)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea or not idea.reports_json or "pitch_deck" not in idea.reports_json:
        raise HTTPException(status_code=404, detail="Pitch deck not found")
        
    pd = idea.reports_json["pitch_deck"]
    slides_data = pd.get("slides", [])
    
    stream = io.BytesIO()
    doc = SimpleDocTemplate(stream, pagesize=landscape(letter), rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'SlideTitle',
        parent=styles['Heading1'],
        fontSize=28,
        spaceAfter=30,
        textColor=HexColor("#0A1628"),
        alignment=1 # Center alignment
    )
    bullet_style = ParagraphStyle(
        'SlideBullet',
        parent=styles['Normal'],
        fontSize=16,
        spaceAfter=15,
        textColor=HexColor("#1E2D47"),
        leading=24
    )
    
    story = []
    
    for idx, slide_data in enumerate(slides_data):
        title = slide_data.get("title", "")
        story.append(Paragraph(str(title), title_style))
        
        bullets = slide_data.get("bullets", [])
        for bullet in bullets:
            # ReportLab requires bullet characters if you want them drawn, 
            # or just use a bullet character string.
            bullet_text = f"• {bullet}"
            story.append(Paragraph(bullet_text, bullet_style))
            
        if idx < len(slides_data) - 1:
            story.append(PageBreak())
            
    doc.build(story)
    stream.seek(0)
    
    import re
    safe_title = re.sub(r'[^a-zA-Z0-9_]', '', idea.title.replace(' ', '_'))
    
    return StreamingResponse(
        stream, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f'attachment; filename="{safe_title}_PitchDeck.pdf"'}
    )
