import json
import re
from langchain_core.messages import SystemMessage, HumanMessage
from agents.state import GraphState
from agents.llm_setup import get_llm, get_json_llm
from rag.vectorstore import VectorStoreManager


def _extract_json(text: str) -> dict:
    """Robustly extracts a JSON object from LLM output, even if it has extra text."""
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Try extracting JSON block from markdown code fences
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    
    # Try to find a JSON object anywhere in the text
    match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    
    # Fallback: return as raw response
    return {"raw_response": text, "parse_error": "Could not extract structured JSON from LLM response."}


def startup_intake_node(state: GraphState) -> GraphState:
    """Agent 1: Startup Intake Agent - Extracts structured profile from founder input."""
    llm = get_json_llm()
    messages = state.get("messages", [])
    
    user_input = messages[-1].content if messages else ""
    
    system_prompt = """You are a highly skilled Startup Intake Agent. 
Extract structured profile data from the raw input provided by the founder.
Return ONLY a valid JSON object (no markdown, no extra text) with these exact fields:
{
  "startup_name": "string",
  "problem_statement": "string",
  "solution_description": "string",
  "target_audience": "string"
}
If a field is not mentioned, make a reasonable inference. Always return valid JSON."""
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Founder Input:\n{user_input}")
    ])
    
    startup_context = _extract_json(response.content)
    state["startup_context"] = startup_context
    return state


def business_validation_node(state: GraphState) -> GraphState:
    """Agent 2: Business Validation Agent - Critically evaluates the business model."""
    llm = get_llm()
    context = state.get("startup_context", {})
    
    system_prompt = """You are a Business Validation Agent at a top-tier startup accelerator.
Analyze the provided startup context and critically evaluate:
1. **Problem Severity** - Is this a real, painful problem?
2. **Solution Viability** - Is the proposed solution technically and commercially feasible?
3. **Market Size Potential** - What is the TAM/SAM/SOM?
4. **Scalability** - Can this grow 10x without proportionally scaling costs?
5. **Key Risks** - What are the top 3 risks?

Be direct, objective, and specific. Format your response clearly with headers."""
    
    prompt = f"Startup Context:\n{json.dumps(context, indent=2)}"
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=prompt)
    ])
    
    state["business_validation"] = {"evaluation": response.content}
    return state


def market_intelligence_node(state: GraphState) -> GraphState:
    """Agent 3: Market Intelligence Agent - Uses RAG to research market landscape."""
    llm = get_llm()
    context = state.get("startup_context", {})
    startup_name = context.get("startup_name", "the startup")
    solution = context.get("solution_description", "")
    audience = context.get("target_audience", "")
    
    # RAG lookup for market trends/competitors
    vsm = VectorStoreManager()
    search_results = vsm.similarity_search(
        f"market trends competitors {solution} {audience}", k=3
    )
    rag_context = "\n\n".join([doc.page_content for doc in search_results]) if search_results else "No specific market data in knowledge base."
    
    system_prompt = f"""You are a Market Intelligence Agent for {startup_name}.
Analyze the market landscape for: {solution}
Target audience: {audience}

Use the RAG context below (from uploaded documents) if relevant.
Cover:
1. **Competitors** - Who are the main players? What is their positioning?
2. **Industry Trends** - What macro trends support or threaten this idea?
3. **Market Demand** - Is there validated demand? Any data points?
4. **Differentiation Opportunity** - Where can this startup win?

RAG Knowledge Base Context:
{rag_context}"""
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content="Provide a thorough market analysis based on the above.")
    ])
    
    state["market_intelligence"] = {"market_analysis": response.content}
    return state
