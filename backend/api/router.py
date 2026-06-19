import os
import time
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from agents.context_builder import ContextBuilder
from agents.orchestrator import orchestrator_app
from langchain_core.messages import HumanMessage

router = APIRouter()

# Directories for uploads
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class EvaluationRequest(BaseModel):
    user_input: str


@router.post("/upload")
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Uploads a file and processes it via ContextBuilder (Layer 1)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    def process_file_task(path):
        try:
            cb = ContextBuilder()
            cb.process_and_store_file(path)
            print(f"✅ File processed: {path}")
        except Exception as e:
            print(f"⚠️ File processing failed: {e}")

    background_tasks.add_task(process_file_task, file_path)

    return {"message": "File uploaded and processing started.", "filename": file.filename}


@router.post("/evaluate")
async def evaluate_startup(request: EvaluationRequest):
    """
    Triggers the Multi-Agent Orchestrator (Layer 2).
    Runs all 7 agents sequentially and returns the full evaluation.
    """
    if not request.user_input or not request.user_input.strip():
        raise HTTPException(status_code=400, detail="user_input cannot be empty.")

    try:
        initial_state = {
            "messages": [HumanMessage(content=request.user_input.strip())],
            "startup_context": {},
            "business_validation": {},
            "market_intelligence": {},
            "founder_analysis": {},
            "investor_feedback": {},
            "strategy_output": {},
            "current_agent": "startup_intake",
            "next_step": "",
        }

        print(f"🚀 Starting evaluation for: {request.user_input[:80]}...")
        final_state = orchestrator_app.invoke(initial_state)
        print("✅ Evaluation complete.")

        return {
            "startup_context": final_state.get("startup_context"),
            "business_validation": final_state.get("business_validation"),
            "market_intelligence": final_state.get("market_intelligence"),
            "founder_analysis": final_state.get("founder_analysis"),
            "investor_feedback": final_state.get("investor_feedback"),
            "strategy": final_state.get("strategy_output"),
        }

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"❌ EVALUATE ERROR:\n{tb}")

        # Detect common Groq/network issues and give clear message
        msg = str(e)
        if "522" in msg or "Connection timeout" in msg or "timed out" in msg.lower():
            raise HTTPException(
                status_code=503,
                detail="The AI service (Groq) is temporarily unavailable due to a connection timeout. Please try again in a few seconds."
            )
        elif "401" in msg or "api_key" in msg.lower() or "authentication" in msg.lower():
            raise HTTPException(
                status_code=401,
                detail="Invalid or missing Groq API key. Please check your backend/.env file and set a valid GROQ_API_KEY."
            )
        elif "rate_limit" in msg.lower() or "429" in msg:
            raise HTTPException(
                status_code=429,
                detail="Groq API rate limit reached. Please wait a few seconds and try again."
            )
        else:
            raise HTTPException(status_code=500, detail=f"Evaluation failed: {msg}")


class MessageInput(BaseModel):
    role: str
    content: str


class NegotiationRequest(BaseModel):
    user_input: str
    history: List[MessageInput]
    # Full evaluation context so the investor agent is fully informed
    startup_context: Optional[Dict[str, Any]] = {}
    investor_feedback: Optional[Dict[str, Any]] = {}
    market_intelligence: Optional[Dict[str, Any]] = {}
    business_validation: Optional[Dict[str, Any]] = {}
    strategy_output: Optional[Dict[str, Any]] = {}


@router.post("/negotiate")
async def negotiate_investor(request: NegotiationRequest):
    """
    Context-Aware Interactive Negotiation with the Investor Agent.
    The investor has read the full evaluation report before responding.
    """
    from agents.llm_setup import get_llm
    from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

    if not request.user_input or not request.user_input.strip():
        raise HTTPException(status_code=400, detail="user_input cannot be empty.")

    llm = get_llm()

    # Build rich context from evaluation data
    sc = request.startup_context or {}
    startup_name = sc.get("startup_name", "the startup")
    problem = sc.get("problem_statement", "Not specified")
    solution = sc.get("solution_description", "Not specified")
    audience = sc.get("target_audience", "Not specified")

    biz_val_text = (request.business_validation or {}).get("evaluation", "No validation data.")
    market_text = (request.market_intelligence or {}).get("market_analysis", "No market data.")
    verdict = (request.investor_feedback or {}).get("feedback", "No verdict yet.")
    strategy_text = (request.strategy_output or {}).get("strategy", "No strategy data.")

    system_prompt = f"""You are a Partner-level Venture Capitalist negotiating with the founder of **{startup_name}**.

## Your Full Evaluation of This Startup

**Problem:** {problem}
**Solution:** {solution}
**Target Audience:** {audience}

### Business Validation Summary:
{biz_val_text[:700]}

### Market Intelligence:
{market_text[:700]}

### Strategy Overview:
{strategy_text[:400]}

### Your Preliminary Investment Verdict:
{verdict[:700]}

---

## Your Negotiation Rules
- Reference SPECIFIC data from your evaluation above (don't ask generic questions)
- Challenge the founder on the EXACT weaknesses you identified
- Negotiate equity, valuation, and milestone-based conditions
- Only upgrade your verdict if the founder gives compelling, data-backed answers
- Be professional, direct, and rigorous — not generic or vague
- Each response should be 2-4 paragraphs with 1-2 follow-up questions
"""

    messages = [SystemMessage(content=system_prompt)]

    for msg in request.history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))

    messages.append(HumanMessage(content=request.user_input.strip()))

    try:
        response = llm.invoke(messages)
        return {"reply": response.content}
    except Exception as e:
        import traceback
        print(f"❌ NEGOTIATE ERROR:\n{traceback.format_exc()}")
        msg = str(e)
        if "522" in msg or "timed out" in msg.lower():
            raise HTTPException(status_code=503, detail="Groq API timed out. Please try again.")
        raise HTTPException(status_code=500, detail=f"Negotiation failed: {msg}")
