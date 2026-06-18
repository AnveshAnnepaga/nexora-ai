import os
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
        
    # Process file asynchronously
    def process_file_task(path):
        cb = ContextBuilder()
        cb.process_and_store_file(path)
        
    background_tasks.add_task(process_file_task, file_path)
    
    return {"message": "File uploaded and processing started.", "filename": file.filename}


@router.post("/evaluate")
async def evaluate_startup(request: EvaluationRequest):
    """Triggers the Multi-Agent Orchestrator (Layer 2)."""
    try:
        # Initialize state with the user's initial input
        initial_state = {
            "messages": [HumanMessage(content=request.user_input)],
            "startup_context": {},
            "business_validation": {},
            "market_intelligence": {},
            "founder_analysis": {},
            "investor_feedback": {},
            "strategy_output": {},
            "current_agent": "startup_intake",
            "next_step": ""
        }
        
        # Run the LangGraph application
        final_state = orchestrator_app.invoke(initial_state)
        
        return {
            "startup_context": final_state.get("startup_context"),
            "business_validation": final_state.get("business_validation"),
            "market_intelligence": final_state.get("market_intelligence"),
            "founder_analysis": final_state.get("founder_analysis"),
            "investor_feedback": final_state.get("investor_feedback"),
            "strategy": final_state.get("strategy_output")
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"EVALUATE ERROR: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))

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
    The investor now knows the startup's full evaluation before negotiating.
    """
    from agents.llm_setup import get_llm
    from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
    import json
    
    llm = get_llm()

    # Build rich context string from evaluation results
    startup_name = request.startup_context.get("startup_name", "the startup") if request.startup_context else "the startup"
    problem = request.startup_context.get("problem_statement", "N/A") if request.startup_context else "N/A"
    solution = request.startup_context.get("solution_description", "N/A") if request.startup_context else "N/A"
    audience = request.startup_context.get("target_audience", "N/A") if request.startup_context else "N/A"

    biz_val_text = (request.business_validation or {}).get("evaluation", "No business validation data available.")
    market_text = (request.market_intelligence or {}).get("market_analysis", "No market analysis available.")
    investor_verdict = (request.investor_feedback or {}).get("feedback", "No initial verdict available.")
    strategy_text = (request.strategy_output or {}).get("strategy", "No strategy data available.")

    system_prompt = f"""You are a shrewd but fair AI Venture Capitalist negotiating with the founder of **{startup_name}**.

## What You Already Know About This Startup

**Problem Being Solved:** {problem}
**Proposed Solution:** {solution}
**Target Audience:** {audience}

## Your Completed Evaluation

### Business Validation Analysis:
{biz_val_text[:800]}

### Market Intelligence Report:
{market_text[:800]}

### Proposed Strategy:
{strategy_text[:400]}

### Your Preliminary Investment Verdict:
{investor_verdict[:600]}

---

## Your Role in This Negotiation

You are negotiating terms with the founder. Your job is to:
1. Reference SPECIFIC weaknesses or strengths you found in your analysis above
2. Challenge the founder on CONCRETE issues (e.g., if you flagged no moat, ask about it directly)
3. Negotiate equity, valuation, and milestones based on the risk you identified
4. Only upgrade your verdict (Pass → Monitor → Term Sheet) if the founder gives COMPELLING, data-backed answers
5. Be professional, rigorous, and direct — not generic

Do NOT ask generic questions. Reference your actual analysis.
"""

    messages = [SystemMessage(content=system_prompt)]
    
    for msg in request.history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))
            
    # Add the latest user input
    messages.append(HumanMessage(content=request.user_input))
    
    try:
        response = llm.invoke(messages)
        return {"reply": response.content}
    except Exception as e:
        import traceback
        print(f"NEGOTIATE ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
