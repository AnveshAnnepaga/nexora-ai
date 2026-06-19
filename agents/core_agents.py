"""
ANTIGRAVITY Core Analysis Agents — Phase 3A, 3B, 3C
Agents: Intake, Idea Scoring, Founder Scoring, Market Research
"""
import json
import re
from langchain_core.messages import SystemMessage, HumanMessage
from agents.state import ANTIGRAVITYState
from agents.llm_setup import get_llm, get_json_llm
from rag.vectorstore import VectorStoreManager


def _safe_json(text: str) -> dict:
    """Robustly extract JSON from LLM output."""
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass
    return {"error": "parse_failed", "raw": text[:500]}


# ─────────────────────────────────────────────────────────────
# AGENT 1: INTAKE AGENT
# ─────────────────────────────────────────────────────────────
def intake_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """
    Parses the structured intake form fields already set in state.
    Enriches them with a brief summary and validates completeness.
    Also attempts to retrieve any uploaded video transcript from ChromaDB.
    """
    # Retrieve video transcript from vector store if uploaded
    vsm = VectorStoreManager()
    video_results = vsm.similarity_search("founder pitch video transcription", k=2)
    if video_results and not state.get("founder_video_transcript"):
        transcript = "\n\n".join([d.page_content for d in video_results])
        state["founder_video_transcript"] = transcript

    pdf_results = vsm.similarity_search("pitch deck slides investor presentation", k=2)
    if pdf_results and not state.get("pitch_deck_analysis"):
        pdf_text = "\n\n".join([d.page_content for d in pdf_results])
        state["pitch_deck_analysis"] = pdf_text

    state["phase"] = "analysis"
    print(f"✅ Agent 1 [Intake] done — startup: {state.get('startup_name', 'Unknown')}")
    return state


# ─────────────────────────────────────────────────────────────
# AGENT 2: IDEA SCORING AGENT (Phase 3A)
# ─────────────────────────────────────────────────────────────
def idea_scoring_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Generates 8 idea intelligence scores + success/failure probability."""
    llm = get_json_llm()
    startup_name = state.get("startup_name", "Unknown")
    context = f"""
Startup: {startup_name}
Problem: {state.get("problem_statement", "N/A")}
Solution: {state.get("proposed_solution", "N/A")}
Target Audience: {state.get("target_audience", "N/A")}
Business Model: {state.get("business_model", "N/A")}
Market Details: {state.get("market_details", "N/A")}
Competitor Info: {state.get("competitor_info", "N/A")}
Interrogation Summary: {state.get("interrogation_summary", "N/A")[:600]}
"""

    system_prompt = """You are an expert startup analyst. Score this startup on each dimension (0-100) with a one-line justification.
Return ONLY this exact JSON structure (no extra text, no markdown):
{
  "problem_solution_fit": <0-100>,
  "innovation": <0-100>,
  "market_demand": <0-100>,
  "scalability": <0-100>,
  "feasibility": <0-100>,
  "uniqueness": <0-100>,
  "revenue_potential": <0-100>,
  "risk_assessment": <0-100>,
  "success_probability": <0-100>,
  "failure_probability": <0-100>,
  "justifications": {
    "problem_solution_fit": "one-line reason",
    "innovation": "one-line reason",
    "market_demand": "one-line reason",
    "scalability": "one-line reason",
    "feasibility": "one-line reason",
    "uniqueness": "one-line reason",
    "revenue_potential": "one-line reason",
    "risk_assessment": "one-line reason"
  }
}"""

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=context)])
    state["idea_scores"] = _safe_json(response.content)
    print(f"✅ Agent 2 [Idea Scoring] done")
    return state


# ─────────────────────────────────────────────────────────────
# AGENT 3: FOUNDER SCORING AGENT (Phase 3B)
# ─────────────────────────────────────────────────────────────
def founder_scoring_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Generates 7 founder intelligence scores from video/pitch + Q&A."""
    llm = get_json_llm()

    video_transcript = state.get("founder_video_transcript", "")
    interrogation = state.get("interrogation_summary", "")
    problem = state.get("problem_statement", "")
    solution = state.get("proposed_solution", "")
    startup_name = state.get("startup_name", "Unknown")

    if video_transcript:
        analysis_source = f"Video Transcript:\n{video_transcript[:800]}"
        has_video = True
    else:
        analysis_source = f"Written Pitch (no video):\nStartup: {startup_name}\nProblem: {problem}\nSolution: {solution}"
        has_video = False

    context = f"""{analysis_source}

Investor Q&A Session Summary:
{interrogation[:600]}
"""

    system_prompt = f"""You are an expert Founder Psychologist and Pitch Coach.
Analyze the founder based on {"video transcript" if has_video else "written pitch"} and Q&A session.
Score each dimension (0-100) with a one-line justification.
Return ONLY this exact JSON (no markdown, no extra text):
{{
  "communication_clarity": <0-100>,
  "confidence": <0-100>,
  "passion": <0-100>,
  "domain_expertise": <0-100>,
  "leadership_signal": <0-100>,
  "presentation_quality": <0-100>,
  "credibility": <0-100>,
  "overall_founder_score": <0-100>,
  "has_video": {str(has_video).lower()},
  "justifications": {{
    "communication_clarity": "reason",
    "confidence": "reason",
    "passion": "reason",
    "domain_expertise": "reason",
    "leadership_signal": "reason",
    "presentation_quality": "reason",
    "credibility": "reason"
  }}
}}"""

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=context)])
    state["founder_scores"] = _safe_json(response.content)
    print(f"✅ Agent 3 [Founder Scoring] done")
    return state


# ─────────────────────────────────────────────────────────────
# AGENT 4: MARKET RESEARCH AGENT (Phase 3C)
# ─────────────────────────────────────────────────────────────
def market_research_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Generates TAM/SAM/SOM + market trends and demand forecast."""
    llm = get_llm()

    vsm = VectorStoreManager()
    rag_results = vsm.similarity_search(
        f"market size trends {state.get('proposed_solution', '')} {state.get('target_audience', '')}",
        k=3
    )
    rag_context = "\n\n".join([d.page_content for d in rag_results]) if rag_results else "No uploaded market data."

    context = f"""
Startup: {state.get("startup_name", "Unknown")}
Problem: {state.get("problem_statement", "N/A")}
Solution: {state.get("proposed_solution", "N/A")}
Target Audience: {state.get("target_audience", "N/A")}
Market Details (from founder): {state.get("market_details", "None provided")}

Uploaded Knowledge Base Context:
{rag_context[:600]}
"""

    system_prompt = """You are a Market Intelligence Analyst. Based on the startup details, generate structured market research.
Return ONLY this exact JSON (no markdown):
{
  "tam": "$X billion — reasoning in one sentence",
  "sam": "$X million — reasoning",
  "som": "$X million — realistic 3-year capture with reasoning",
  "growth_rate": "X% annually — source/reasoning",
  "saturation": "Low|Medium|High — brief explanation",
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "future_demand": "3-5 year demand prediction paragraph",
  "industry": "industry name",
  "geography_focus": "primary geography"
}"""

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=context)])
    state["market_research"] = _safe_json(response.content)
    print(f"✅ Agent 4 [Market Research] done")
    return state
