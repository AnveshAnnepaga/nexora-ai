"""
ANTIGRAVITY API Router
Endpoints: /upload, /evaluate (full pipeline), /interrogate (investor chat)
"""
import os
import json
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

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


# ─────────────────────────────────────────────────────────────
# FULL EVALUATE — Runs all 16 agents (Phases 1, 3, 4)
# ─────────────────────────────────────────────────────────────
class EvaluationRequest(BaseModel):
    # Phase 1 intake fields
    startup_name: str
    problem_statement: str
    proposed_solution: str
    target_audience: str
    business_model: str
    market_details: Optional[str] = ""
    competitor_info: Optional[str] = ""
    # Phase 2 results (optional — passed after investor chat)
    interrogation_summary: Optional[str] = ""
    weak_zones: Optional[List[str]] = []


@router.post("/evaluate")
async def evaluate_startup(request: EvaluationRequest):
    """
    ANTIGRAVITY Full Pipeline — Phases 1, 3, 4
    Runs 16 agents sequentially and returns the complete intelligence report.
    """
    if not request.startup_name.strip() or not request.problem_statement.strip():
        raise HTTPException(status_code=400, detail="startup_name and problem_statement are required.")

    try:
        initial_state = {
            "messages": [HumanMessage(content=f"Evaluate: {request.startup_name}")],
            "phase": "intake",

            # Phase 1 inputs
            "startup_name": request.startup_name.strip(),
            "problem_statement": request.problem_statement.strip(),
            "proposed_solution": request.proposed_solution.strip(),
            "target_audience": request.target_audience.strip(),
            "business_model": request.business_model.strip(),
            "market_details": request.market_details or "",
            "competitor_info": request.competitor_info or "",
            "founder_video_transcript": "",
            "pitch_deck_analysis": "",

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

        print(f"\n🚀 ANTIGRAVITY Pipeline starting for: {request.startup_name}")
        final_state = orchestrator_app.invoke(initial_state)
        print(f"✅ Pipeline complete — Overall Score: {final_state.get('health_dashboard', {}).get('overall_score', 'N/A')}/100\n")

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
    startup_name: Optional[str] = ""
    problem_statement: Optional[str] = ""
    proposed_solution: Optional[str] = ""
    target_audience: Optional[str] = ""
    business_model: Optional[str] = ""
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
Problem: {request.problem_statement or "Not provided"}
Solution: {request.proposed_solution or "Not provided"}
Target Audience: {request.target_audience or "Not provided"}
Business Model: {request.business_model or "Not provided"}
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
1. Ask 1-2 probing questions per response (not more)
2. If the founder's answer is vague or generic, push back with a follow-up before moving on
3. Reference their specific startup details — don't ask generic questions
4. Vary your style: direct, hypothetical, devil's advocate, scenario-based
5. Be professional but rigorous — you are deciding whether to write a check
6. When you have enough on a domain, acknowledge it briefly and signal moving to the next
7. If this is the first message, open with who you are and what this session is about

Keep responses concise (2-3 paragraphs max). Make every question count."""

    messages = [SystemMessage(content=system_prompt)]
    for msg in request.history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))
    messages.append(HumanMessage(content=request.user_input))

    try:
        response = llm.invoke(messages)
        return {
            "reply": response.content,
            "domains_remaining": domains_remaining,
            "current_domain": focus,
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
