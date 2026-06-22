from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import httpx

from backend.core.database import get_db
from backend.core.models import Message, User, Notification, Idea

router = APIRouter()

import os
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")

def send_brevo_email(to_email: str, to_name: str, subject: str, text_content: str):
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    payload = {
        "sender": {"name": "NEXORA AI", "email": "noreply@nexora.ai"},
        "to": [{"email": to_email, "name": to_name}],
        "subject": subject,
        "textContent": text_content
    }
    try:
        httpx.post(url, headers=headers, json=payload, timeout=10)
    except Exception as e:
        print(f"Brevo email failed: {e}")

router = APIRouter()

class MessageCreate(BaseModel):
    receiver_id: int
    idea_id: Optional[int] = None
    subject: str
    message: str
    sender_id: int # In a real app, get from auth token

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    receiver_id: int
    idea_id: Optional[int]
    subject: str
    message: str
    timestamp: datetime
    is_read: bool

@router.post("/send")
def send_message(msg_in: MessageCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    sender = db.query(User).filter(User.id == msg_in.sender_id).first()
    receiver = db.query(User).filter(User.id == msg_in.receiver_id).first()
    
    if not sender or not receiver:
        raise HTTPException(status_code=404, detail="User not found")
        
    msg = Message(
        sender_id=msg_in.sender_id,
        receiver_id=msg_in.receiver_id,
        idea_id=msg_in.idea_id,
        subject=msg_in.subject,
        message=msg_in.message
    )
    db.add(msg)
    
    # Create notification
    notif = Notification(
        user_id=msg_in.receiver_id,
        type="contact",
        message=f"New message from {sender.full_name}: {msg_in.subject}"
    )
    db.add(notif)
    
    # If it's related to an idea, increment contact requests
    if msg_in.idea_id:
        idea = db.query(Idea).filter(Idea.id == msg_in.idea_id).first()
        if idea:
            idea.contact_requests = (idea.contact_requests or 0) + 1

    db.commit()
    
    # Send email
    email_text = f"You have a new message on NEXORA from {sender.full_name}.\n\nSubject: {msg_in.subject}\n\nMessage:\n{msg_in.message}\n\nLog in to your dashboard to reply."
    background_tasks.add_task(send_brevo_email, receiver.email, receiver.full_name, f"New NEXORA Message: {msg_in.subject}", email_text)

    return {"message": "Message sent successfully"}

@router.patch("/read/{message_id}")
def mark_message_read(message_id: int, db: Session = Depends(get_db)):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if msg:
        msg.is_read = True
        db.commit()
        return {"success": True}
    return {"success": False}

@router.get("/inbox/{user_id}")
def get_inbox(user_id: int, db: Session = Depends(get_db)):
    msgs = db.query(Message, User.full_name.label("sender_name")).join(User, Message.sender_id == User.id).filter(Message.receiver_id == user_id).order_by(desc(Message.timestamp)).all()
    result = []
    for m, s_name in msgs:
        # If receiver is investor, sender is entrepreneur (show only first name)
        # We need receiver role
        receiver = db.query(User).filter(User.id == user_id).first()
        if receiver and receiver.role == "investor":
            display_name = s_name.split()[0] if s_name else "Anonymous"
        else:
            display_name = s_name or "Anonymous"
        
        result.append({
            "id": m.id,
            "sender_id": m.sender_id,
            "sender_name": display_name,
            "receiver_id": m.receiver_id,
            "idea_id": m.idea_id,
            "subject": m.subject,
            "message": m.message,
            "timestamp": m.timestamp,
            "is_read": m.is_read
        })
    return result

@router.get("/sent/{user_id}")
def get_sent(user_id: int, db: Session = Depends(get_db)):
    msgs = db.query(Message, User.full_name.label("receiver_name")).join(User, Message.receiver_id == User.id).filter(Message.sender_id == user_id).order_by(desc(Message.timestamp)).all()
    result = []
    for m, r_name in msgs:
        result.append({
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "receiver_name": r_name,
            "idea_id": m.idea_id,
            "subject": m.subject,
            "message": m.message,
            "timestamp": m.timestamp,
            "is_read": m.is_read
        })
    return result

from sqlalchemy import or_, and_

@router.get("/contacts/{user_id}")
def get_contacts(user_id: int, db: Session = Depends(get_db)):
    msgs = db.query(Message).filter(or_(Message.sender_id == user_id, Message.receiver_id == user_id)).order_by(desc(Message.timestamp)).all()
    
    current_user = db.query(User).filter(User.id == user_id).first()
    is_investor = current_user and current_user.role == "investor"

    contacts = {}
    for m in msgs:
        contact_id = m.sender_id if m.receiver_id == user_id else m.receiver_id
        
        if contact_id not in contacts:
            contact_user = db.query(User).filter(User.id == contact_id).first()
            if not contact_user:
                # DEBUG: Add them as unknown to see if this is the issue
                display_name = f"Unknown User ({contact_id})"
                role = "unknown"
            else:
                display_name = contact_user.full_name or "Anonymous"
                role = contact_user.role
                if is_investor and contact_user.role == "entrepreneur":
                    display_name = display_name.split()[0] if display_name else "Anonymous"
                
            contacts[contact_id] = {
                "contact_id": contact_id,
                "contact_name": display_name,
                "contact_role": role,
                "latest_message": m.message,
                "latest_timestamp": m.timestamp,
                "unread_count": 0
            }
            
        if m.sender_id == contact_id and m.receiver_id == user_id and not m.is_read:
            contacts[contact_id]["unread_count"] += 1
            
    def get_sort_key(x):
        ts = x["latest_timestamp"]
        if not ts:
            return ""
        if isinstance(ts, str):
            return ts
        return ts.isoformat()
            
    sorted_contacts = sorted(list(contacts.values()), key=get_sort_key, reverse=True)
    return sorted_contacts

@router.get("/thread/{user_id}/{contact_id}")
def get_thread(user_id: int, contact_id: int, db: Session = Depends(get_db)):
    msgs = db.query(Message).filter(
        or_(
            and_(Message.sender_id == user_id, Message.receiver_id == contact_id),
            and_(Message.sender_id == contact_id, Message.receiver_id == user_id)
        )
    ).order_by(Message.timestamp.asc()).all()
    
    for m in msgs:
        if m.receiver_id == user_id and not m.is_read:
            m.is_read = True
    db.commit()
    
    result = []
    for m in msgs:
        result.append({
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "message": m.message,
            "timestamp": m.timestamp,
            "is_read": m.is_read
        })
    return result
