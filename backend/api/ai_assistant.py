from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[Dict[str, str]] = []
    idea_id: int = 0
    user_id: int = 0
    # Data context passed from frontend
    idea_title: str = ""
    idea_description: str = ""
    swot_data: Dict[str, Any] = {}
    competitor_data: Dict[str, Any] = {}
    revenue_data: Dict[str, Any] = {}
    risk_data: Dict[str, Any] = {}

@router.post("/chat")
def ai_assistant_chat(req: ChatRequest):
    from agents.llm_setup import get_llm
    llm = get_llm(temperature=0.7)

    system_prompt = f"""You are an expert startup advisor and business analyst. 
The entrepreneur has submitted the following startup idea:
Title: {req.idea_title}
Description: {req.idea_description}

Their current analysis results are:
SWOT: {req.swot_data}
Competitors: {req.competitor_data}
Revenue Models: {req.revenue_data}
Risks: {req.risk_data}

Your role is to:
1. Answer questions about their startup idea specifically
2. Suggest concrete improvements to their idea
3. Help them strengthen weak areas identified in the SWOT
4. Recommend strategies to outperform competitors
5. Guide them on revenue model selection
6. Provide actionable next steps

Be concise, practical, and encouraging. Always ground your advice in their specific data above."""

    messages = [SystemMessage(content=system_prompt)]
    for msg in req.conversation_history:
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg.get("content", "")))
        else:
            messages.append(AIMessage(content=msg.get("content", "")))
    
    messages.append(HumanMessage(content=req.message))

    try:
        response = llm.invoke(messages)
        return {"response": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
