from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    # password_hash removed as we are using Clerk for auth, but kept for legacy if needed, nullable now
    password_hash = Column(String, nullable=True) 
    role = Column(String, nullable=False) # 'entrepreneur' or 'investor'
    clerk_id = Column(String, unique=True, index=True, nullable=True)
    
    profile_photo = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    location = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ideas = relationship("Idea", back_populates="owner")
    investor_profile = relationship("InvestorProfile", back_populates="user", uselist=False)
    messages_sent = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    messages_received = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    notifications = relationship("Notification", back_populates="user")

class InvestorProfile(Base):
    __tablename__ = "investor_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    fund_name = Column(String)
    investment_focus = Column(String) # Re-purposed as sector_preferences (comma separated)
    ticket_size = Column(String)
    stage_preference = Column(String, nullable=True) # Pre-seed, Seed, Series A
    bio = Column(Text)
    contact_visible = Column(Boolean, default=True)

    user = relationship("User", back_populates="investor_profile")

class Idea(Base):
    __tablename__ = "ideas"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    industry = Column(String)
    description = Column(Text)
    video_url = Column(String, nullable=True)
    pdf_url = Column(String, nullable=True)
    validation_score = Column(Integer) # Legacy
    
    # Nexora specific
    nexora_score = Column(Float, nullable=True)
    success_probability = Column(Float, nullable=True)
    failure_probability = Column(Float, nullable=True)
    
    date_submitted = Column(DateTime, default=datetime.utcnow)
    reports_json = Column(JSON) # Store complete evaluation results
    interview_transcript = Column(JSON, nullable=True) # Store chat history
    
    visibility = Column(String, default="public") # 'public' or 'private'
    contact_requests = Column(Integer, default=0)

    owner = relationship("User", back_populates="ideas")
    messages = relationship("Message", back_populates="idea")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    idea_id = Column(Integer, ForeignKey("ideas.id"), nullable=True)
    subject = Column(String)
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="messages_sent")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="messages_received")
    idea = relationship("Idea", back_populates="messages")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False) # 'contact', 'system', 'idea'
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")
