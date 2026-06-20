from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.core.database import get_db
from backend.core.models import Notification

router = APIRouter()

@router.get("/{user_id}")
def get_notifications(user_id: int, limit: int = 10, db: Session = Depends(get_db)):
    notifications = db.query(Notification).filter(Notification.user_id == user_id).order_by(desc(Notification.created_at)).limit(limit).all()
    return notifications

@router.get("/count/{user_id}")
def get_unread_count(user_id: int, db: Session = Depends(get_db)):
    count = db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).count()
    return {"unread_count": count}

@router.patch("/read/{notification_id}")
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if notif:
        notif.is_read = True
        db.commit()
        return {"success": True}
    return {"success": False}
