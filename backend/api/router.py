"""
Nexora API Router
Endpoints: /upload, /evaluate (full pipeline), /interrogate (investor chat)
"""
import os
import json
import httpx
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from backend.core.database import get_db
from backend.core.models import Idea, Notification
from fastapi import Depends
from sqlalchemy.orm import Session
from agents.context_builder import ContextBuilder
from agents.orchestrator import orchestrator_app
from langchain_core.messages import HumanMessage

router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ─────────────────────────────────────────────────────────────
# FILE UPLOAD — Layer 1 (RAG ingestion)
# ─────────────────────────────────────────────────────────────
@router.post("/upload")
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Upload pitch video, PDF, or CSV for RAG-based context analysis."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    def process(path):
        try:
            cb = ContextBuilder()
            cb.process_and_store_file(path)
            print(f"✅ File processed: {path}")
        except Exception as e:
            print(f"⚠️ File processing error: {e}")

    background_tasks.add_task(process, file_path)
    return {"message": "File uploaded and processing started.", "filename": file.filename}


@router.post("/transcribe")
async def transcribe_media(file: UploadFile = File(...)):
    """
    Transcribes an uploaded video or audio file using the Groq Whisper API.
    """
    from agents.llm_setup import _get_key
    api_key = _get_key()
    
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")
    
    # Read the file data
    file_bytes = await file.read()
    
    # Send to Groq
    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    
    # Create the multipart form data for httpx
    # Groq whisper requires file, model
    files = {
        "file": (file.filename or "recording.webm", file_bytes, file.content_type or "audio/webm")
    }
    data = {
        "model": "whisper-large-v3",
        "response_format": "json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, files=files, data=data)
            response.raise_for_status()
            
            result = response.json()
            transcript = result.get("text", "")
            
            return {"transcript": transcript}
    except httpx.HTTPStatusError as e:
        print(f"Groq API Error: {e.response.text}")
        raise HTTPException(status_code=502, detail=f"Transcription failed: {e.response.text}")
    except Exception as e:
        print(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during transcription.")


# ─────────────────────────────────────────────────────────────
# FULL EVALUATE — Runs all 16 agents (Phases 1, 3, 4)
# ─────────────────────────────────────────────────────────────
class EvaluationRequest(BaseModel):
    user_id: int
    # Phase 1 intake fields
    startup_name: Optional[str] = "Unknown Startup"
    video_content: str
    idea_text: Optional[str] = ""
    pdf_content: Optional[str] = ""
    # Phase 2 results (optional — passed after investor chat)
    interrogation_summary: Optional[str] = ""
    weak_zones: Optional[List[str]] = []
    interview_transcript: Optional[List[Dict[str, Any]]] = None


@router.post("/evaluate")
async def evaluate_startup(request: EvaluationRequest, db: Session = Depends(get_db)):
    """
    Nexora Full Pipeline — Phases 1, 3, 4
    Runs 16 agents sequentially and returns the complete intelligence report.
    """
    if not request.idea_text.strip() and not request.video_content.strip() and not request.startup_name.strip():
        raise HTTPException(status_code=400, detail="Please provide a startup name, idea description, or video link.")

    try:
        initial_state = {
            "messages": [HumanMessage(content=f"Evaluate startup context")],
            "phase": "intake",

            # Phase 1 inputs
            "startup_name": request.startup_name.strip(),
            "video_content": request.video_content.strip(),
            "idea_text": request.idea_text.strip() if request.idea_text else "",
            "pdf_content": request.pdf_content.strip() if request.pdf_content else "",

            # Phase 2 inputs (from investor chat)
            "interrogation_summary": request.interrogation_summary or "",
            "weak_zones": request.weak_zones or [],

            # Phase 3 outputs (will be filled by agents)
            "idea_scores": {},
            "founder_scores": {},
            "market_research": {},
            "competitor_intel": {},
            "business_model_eval": {},
            "swot": {},
            "risk_assessment": {},
            "health_dashboard": {},

            # Phase 4 outputs
            "budget": {},
            "pitch_deck": {},
            "roadmap": {},
            "subscription_plan": {},
            "investor_matching": {},
            "funding_readiness": {},
            "team_analysis": {},
        }

        print(f"\n🚀 Nexora Pipeline starting for: {request.startup_name}")
        final_state = orchestrator_app.invoke(initial_state)
        overall_score = final_state.get('health_dashboard', {}).get('overall_score', 0)
        success_prob = final_state.get('health_dashboard', {}).get('success_probability', 0)
        failure_prob = final_state.get('health_dashboard', {}).get('failure_probability', 0)
        print(f"✅ Pipeline complete — Overall Score: {overall_score}/100\n")

        # Save to database
        # Remove non-serializable Langchain messages before saving
        final_state.pop("messages", None)
        
        idea = Idea(
            user_id=request.user_id,
            title=request.startup_name.strip(),
            description=(request.idea_text.strip() or request.video_content.strip() or "Analysis based on uploaded pitch deck/document.")[:500],
            reports_json=final_state,
            nexora_score=overall_score,
            success_probability=success_prob,
            failure_probability=failure_prob,
            visibility='public',
            interview_transcript=request.interview_transcript
        )
        db.add(idea)
        db.commit()
        db.refresh(idea)
        
        # Create notification
        notif = Notification(
            user_id=request.user_id,
            type="system",
            message=f"Analysis complete for {request.startup_name.strip()}. Your NEXORA score is {overall_score}/100."
        )
        db.add(notif)
        db.commit()

        return {
            # Phase 3 Analysis
            "idea_scores": final_state.get("idea_scores"),
            "founder_scores": final_state.get("founder_scores"),
            "market_research": final_state.get("market_research"),
            "competitor_intel": final_state.get("competitor_intel"),
            "business_model_eval": final_state.get("business_model_eval"),
            "swot": final_state.get("swot"),
            "risk_assessment": final_state.get("risk_assessment"),
            "health_dashboard": final_state.get("health_dashboard"),
            # Phase 4 Outputs
            "budget": final_state.get("budget"),
            "pitch_deck": final_state.get("pitch_deck"),
            "roadmap": final_state.get("roadmap"),
            "subscription_plan": final_state.get("subscription_plan"),
            "investor_matching": final_state.get("investor_matching"),
            "funding_readiness": final_state.get("funding_readiness"),
            "team_analysis": final_state.get("team_analysis"),
        }

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"❌ EVALUATE ERROR:\n{tb}")
        msg = str(e)
        if "522" in msg or "timed out" in msg.lower() or "timeout" in msg.lower():
            raise HTTPException(status_code=503, detail="AI service timed out. Please try again in a few seconds.")
        elif "401" in msg or "api_key" in msg.lower():
            raise HTTPException(status_code=401, detail="Invalid Groq API key. Check backend/.env")
        elif "429" in msg or "rate_limit" in msg.lower():
            raise HTTPException(status_code=429, detail="Groq rate limit reached. Wait a few seconds.")
        else:
            raise HTTPException(status_code=500, detail=f"Pipeline failed: {msg}")


# ─────────────────────────────────────────────────────────────
# INVESTOR INTERROGATION — Phase 2 (Live Q&A chat)
# ─────────────────────────────────────────────────────────────
class MessageInput(BaseModel):
    role: str
    content: str


class InterrogationRequest(BaseModel):
    user_input: str
    history: List[MessageInput]
    # Startup context for domain-aware questions
    startup_name: Optional[str] = "Unknown"
    video_content: Optional[str] = ""
    idea_text: Optional[str] = ""
    pdf_content: Optional[str] = ""
    # Which domain to focus on (A-J)
    current_domain: Optional[str] = ""
    domains_completed: Optional[List[str]] = []


@router.post("/interrogate")
async def interrogate_founder(request: InterrogationRequest):
    """
    Phase 2 — Investor Interrogation Mode.
    AI acts as a tough VC and grills the founder across 10 domains (A-J).
    """
    from agents.llm_setup import get_llm
    from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

    llm = get_llm(temperature=0.8)

    startup_context = f"""
Startup: {request.startup_name or "Unknown"}
Video Transcript / Context: {request.video_content or "None"}
Idea Text: {request.idea_text or "None"}
PDF Content: {request.pdf_content or "None"}
"""

    domains_remaining = [d for d in ["A","B","C","D","E","F","G","H","I","J"]
                         if d not in (request.domains_completed or [])]
    focus = request.current_domain or (domains_remaining[0] if domains_remaining else "J")

    domain_map = {
        "A": "PROBLEM VALIDATION — How real and painful is this problem? Evidence? Scale?",
        "B": "SOLUTION DEPTH — Why is this the right solution? Unfair advantage? Defensibility in 12 months?",
        "C": "MARKET OPPORTUNITY — Real market size? Geography choice? Growth assumptions?",
        "D": "BUSINESS MODEL — Revenue mechanics? Unit economics? CAC vs LTV? Pricing rationale?",
        "E": "COMPETITION — Top 3 competitors? Differentiation? Why haven't incumbents solved this?",
        "F": "TRACTION & VALIDATION — What have you built? Users? Revenue? Key metrics?",
        "G": "TEAM & EXECUTION — Why YOU? Missing skills? Hardest execution challenge?",
        "H": "FINANCIALS & FUNDING — Amount raising? Use of funds? 18-month milestone plan?",
        "I": "RISK & FAILURE MODES — #1 reason this fails? Biggest false assumption? What keeps you up at night?",
        "J": "VISION & AMBITION — 5-year vision? Exit strategy? Why must this exist in the world?",
    }

    system_prompt = f"""You are a sharp, no-nonsense VC investor with 20+ years of experience. You are ruthlessly analytical and not easy to impress.

## The Startup You Are Evaluating
{startup_context}

## Current Focus Domain
Domain {focus}: {domain_map.get(focus, "General questions")}

## Domains Still to Cover
{", ".join([f"Domain {d}: {domain_map[d][:40]}..." for d in domains_remaining[:4]])}

## Your Interrogation Rules
1. Your entire response MUST be 3 lines or fewer. No exceptions.
2. Ask exactly ONE probing question at a time. Wait for the answer before proceeding.
3. Be direct. Do not include long preambles, greetings, or explanations before asking.
4. If the founder's answer is vague, evasive, or useless, press them on it professionally. DO NOT mark the domain as satisfied.
5. If the founder provides a concrete, acceptable answer to the domain question, mark `is_domain_satisfied` as true.

CRITICAL INSTRUCTION: You MUST respond in pure JSON format exactly like this:
{{
  "reply": "Your VC response or question here (max 3 lines)",
  "is_domain_satisfied": false
}}
"""

    messages = [SystemMessage(content=system_prompt)]
    for msg in request.history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))
    messages.append(HumanMessage(content=request.user_input))

    try:
        response = llm.invoke(messages)
        
        # Parse JSON
        import json
        import re
        content = response.content.strip()
        
        # Extract JSON block even if there is surrounding text
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            content = match.group(0)
            
        try:
            data = json.loads(content)
            reply_text = data.get("reply", response.content)
            is_satisfied = data.get("is_domain_satisfied", False)
        except json.JSONDecodeError:
            reply_text = response.content
            is_satisfied = False

        if is_satisfied and focus not in (request.domains_completed or []):
            if request.domains_completed is None:
                request.domains_completed = []
            request.domains_completed.append(focus)

        domains_remaining = [d for d in ["A","B","C","D","E","F","G","H","I","J"]
                             if d not in (request.domains_completed or [])]
        
        next_focus = focus if not is_satisfied else (domains_remaining[0] if domains_remaining else focus)

        return {
            "reply": reply_text,
            "domains_remaining": domains_remaining,
            "current_domain": next_focus,
        }
    except Exception as e:
        import traceback
        print(f"❌ INTERROGATE ERROR:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Interrogation failed: {str(e)}")


# ─────────────────────────────────────────────────────────────
# LEGACY /negotiate — kept for backward compatibility
# ─────────────────────────────────────────────────────────────
class NegotiationRequest(BaseModel):
    user_input: str
    history: List[MessageInput]
    startup_context: Optional[Dict[str, Any]] = {}
    investor_feedback: Optional[Dict[str, Any]] = {}
    market_intelligence: Optional[Dict[str, Any]] = {}
    business_validation: Optional[Dict[str, Any]] = {}
    strategy_output: Optional[Dict[str, Any]] = {}


@router.post("/negotiate")
async def negotiate_investor(request: NegotiationRequest):
    """Legacy negotiation endpoint — preserved for backward compatibility."""
    from agents.llm_setup import get_llm
    from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

    llm = get_llm()
    sc = request.startup_context or {}
    system_prompt = f"""You are a seasoned Venture Capitalist negotiating with the founder of {sc.get("startup_name","the startup")}.
You have completed a full evaluation. Negotiate terms professionally and reference specific findings from your analysis."""

    messages = [SystemMessage(content=system_prompt)]
    for msg in request.history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))
    messages.append(HumanMessage(content=request.user_input))

    try:
        response = llm.invoke(messages)
        return {"reply": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
