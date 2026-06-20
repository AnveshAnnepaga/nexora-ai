from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from backend.core.database import get_db
from backend.core.models import User, InvestorProfile

router = APIRouter()

class ClerkSync(BaseModel):
    clerk_id: str
    email: str
    full_name: str
    role: str # "entrepreneur" | "investor"

@router.post("/sync-clerk-user")
def sync_clerk_user(user_in: ClerkSync, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.clerk_id == user_in.clerk_id).first()
    
    if not user:
        # Check by email in case of legacy user
        user = db.query(User).filter(User.email == user_in.email).first()
        if user:
            user.clerk_id = user_in.clerk_id
            db.commit()
            
    if user:
        # Allow role switching for testing
        if user.role != user_in.role:
            user.role = user_in.role
            db.commit()
            if user.role == "investor":
                inv_profile = db.query(InvestorProfile).filter(InvestorProfile.user_id == user.id).first()
                if not inv_profile:
                    db.add(InvestorProfile(user_id=user.id, contact_visible=True))
                    db.commit()

    if not user:
        user = User(
            clerk_id=user_in.clerk_id,
            full_name=user_in.full_name,
            email=user_in.email,
            role=user_in.role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        if user.role == "investor":
            profile = InvestorProfile(
                user_id=user.id,
                contact_visible=True
            )
            db.add(profile)
            db.commit()

    # Check if profile is complete
    profile_complete = False
    if user.role == "entrepreneur":
        profile_complete = bool(user.linkedin_url) or bool(user.location) or bool(user.phone_number)
    else:
        profile = db.query(InvestorProfile).filter(InvestorProfile.user_id == user.id).first()
        if profile and (profile.fund_name or profile.stage_preference):
            profile_complete = True

    return {
        "user_id": user.id,
        "role": user.role,
        "profile_complete": profile_complete
    }

class FounderProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    linkedin_url: Optional[str] = None
    phone_number: Optional[str] = None
    location: Optional[str] = None

@router.patch("/profile/founder/{user_id}")
def update_founder_profile(user_id: int, profile: FounderProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if profile.full_name:
        user.full_name = profile.full_name

    user.linkedin_url = profile.linkedin_url
    user.phone_number = profile.phone_number
    user.location = profile.location
    db.commit()
    return {"success": True}

class InvestorProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    fund_name: str
    stage_preference: str
    sector_preferences: str
    ticket_size: str
    location: Optional[str] = None

@router.patch("/profile/investor/{user_id}")
def update_investor_profile(user_id: int, profile: InvestorProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if profile.full_name:
        user.full_name = profile.full_name

    user.location = profile.location
    
    inv_profile = db.query(InvestorProfile).filter(InvestorProfile.user_id == user_id).first()
    if inv_profile:
        inv_profile.fund_name = profile.fund_name
        inv_profile.stage_preference = profile.stage_preference
        inv_profile.investment_focus = profile.sector_preferences
        inv_profile.ticket_size = profile.ticket_size
        db.commit()
    return {"success": True}

@router.get("/profile/{user_id}")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    data = {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "profile_photo": user.profile_photo,
        "linkedin_url": user.linkedin_url,
        "location": user.location
    }
    
    if user.role == "investor":
        inv = db.query(InvestorProfile).filter(InvestorProfile.user_id == user_id).first()
        if inv:
            data.update({
                "fund_name": inv.fund_name,
                "stage_preference": inv.stage_preference,
                "sector_preferences": inv.investment_focus,
                "ticket_size": inv.ticket_size,
                "bio": inv.bio
            })
            
    return data
