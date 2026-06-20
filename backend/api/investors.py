from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.models import User, InvestorProfile

router = APIRouter()

@router.get("/")
def get_investors(db: Session = Depends(get_db)):
    investors = db.query(User, InvestorProfile).join(InvestorProfile, User.id == InvestorProfile.user_id).filter(User.role == "investor", InvestorProfile.contact_visible == True).all()
    result = []
    for u, p in investors:
        result.append({
            "user_id": u.id,
            "full_name": u.full_name,
            "profile_photo": u.profile_photo,
            "location": u.location,
            "fund_name": p.fund_name,
            "investment_focus": p.investment_focus, # sector preferences
            "stage_preference": p.stage_preference,
            "ticket_size": p.ticket_size,
            "bio": p.bio
        })
    return result

@router.get("/{investor_id}")
def get_investor(investor_id: int, db: Session = Depends(get_db)):
    investor = db.query(User, InvestorProfile).join(InvestorProfile, User.id == InvestorProfile.user_id).filter(User.id == investor_id, User.role == "investor").first()
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
        
    u, p = investor
    return {
        "user_id": u.id,
        "full_name": u.full_name,
        "profile_photo": u.profile_photo,
        "location": u.location,
        "linkedin_url": u.linkedin_url,
        "fund_name": p.fund_name,
        "investment_focus": p.investment_focus,
        "stage_preference": p.stage_preference,
        "ticket_size": p.ticket_size,
        "bio": p.bio
    }
