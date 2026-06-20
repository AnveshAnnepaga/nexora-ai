"""
ANTIGRAVITY Advanced Analysis Agents — Phase 3D through 3H
Agents: Competitor Intel, Business Model, SWOT, Risk, Health Dashboard
"""
import json
import re
from langchain_core.messages import SystemMessage, HumanMessage
from agents.state import ANTIGRAVITYState
from agents.llm_setup import get_llm, get_json_llm


def _safe_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except Exception:
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


def _build_context(state: ANTIGRAVITYState, extra: str = "") -> str:
    return f"""
Startup: {state.get("startup_name", "Unknown")}
Video Content: {state.get("video_content", "N/A")}
Idea Text: {state.get("idea_text", "N/A")}
PDF Content: {state.get("pdf_content", "N/A")}
Market: {json.dumps(state.get("market_research", {}), indent=2)[:500]}
{extra}
"""


# ─────────────────────────────────────────────────────────────
# AGENT 5: COMPETITOR INTELLIGENCE (Phase 3D)
# ─────────────────────────────────────────────────────────────
def competitor_intelligence_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Generates competitor analysis including YC companies, market share, gaps."""
    llm = get_json_llm()
    context = _build_context(state)

    system_prompt = """You are a Competitive Intelligence Analyst with deep knowledge of the startup ecosystem.
Identify 4-6 direct and indirect competitors for this startup.
Return ONLY this exact JSON (no markdown):
{
  "competitors": [
    {
      "name": "Company Name",
      "url": "https://company.com",
      "funding": "$X million Series A / Bootstrapped / etc",
      "market_share_pct": 25,
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1"],
      "gap": "What they are missing that this startup addresses"
    }
  ],
  "competitive_advantage_score": <0-100>,
  "competitive_advantage_summary": "2-3 sentence summary of why this startup can win",
  "market_share_unaddressed_pct": <percentage left unaddressed by all competitors>
}
Note: market_share_pct values across all competitors + unaddressed should sum to ~100."""

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=context)])
    state["competitor_intel"] = _safe_json(response.content)
    print(f"✅ Agent 5 [Competitor Intel] done")
    return state


# ─────────────────────────────────────────────────────────────
# AGENT 6: BUSINESS MODEL EVALUATION (Phase 3E)
# ─────────────────────────────────────────────────────────────
def business_model_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Evaluates unit economics, pricing, CAC/LTV, break-even."""
    llm = get_json_llm()
    context = _build_context(state)

    system_prompt = """You are a Financial Analyst specializing in startup unit economics.
Evaluate the business model and return ONLY this exact JSON (no markdown):
{
  "revenue_validation": "Is this revenue stream realistic? 2-3 sentences.",
  "pricing_score": <0-100>,
  "pricing_analysis": "Is the pricing strategy optimal? Why?",
  "cac_estimate": "$X — reasoning (how much to acquire one customer)",
  "ltv_estimate": "$X — reasoning (lifetime value of one customer)",
  "ltv_cac_ratio": "X:1",
  "payback_period": "X months",
  "breakeven_estimate": "X months / X customers",
  "sustainability_score": <0-100>,
  "key_financial_risks": ["risk 1", "risk 2"]
}"""

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=context)])
    state["business_model_eval"] = _safe_json(response.content)
    print(f"✅ Agent 6 [Business Model] done")
    return state


# ─────────────────────────────────────────────────────────────
# AGENT 7: SWOT ANALYSIS (Phase 3F)
# ─────────────────────────────────────────────────────────────
def swot_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Generates structured SWOT matrix."""
    llm = get_json_llm()
    idea_scores = state.get("idea_scores", {})
    market = state.get("market_research", {})
    context = _build_context(state, f"\nIdea Scores: {json.dumps(idea_scores)[:300]}\nMarket: {json.dumps(market)[:300]}")

    system_prompt = """You are a Strategic Business Analyst. Generate a comprehensive SWOT analysis.
Return ONLY this exact JSON (no markdown):
{
  "strengths": [
    "Specific strength 1 with evidence",
    "Specific strength 2",
    "Specific strength 3",
    "Specific strength 4"
  ],
  "weaknesses": [
    "Specific weakness 1",
    "Specific weakness 2",
    "Specific weakness 3",
    "Specific weakness 4"
  ],
  "opportunities": [
    "Market opportunity 1",
    "External tailwind 2",
    "Strategic opportunity 3",
    "Partnership opportunity 4"
  ],
  "threats": [
    "Competitive threat 1",
    "Regulatory threat 2",
    "Market risk 3",
    "Technology threat 4"
  ]
}"""

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=context)])
    state["swot"] = _safe_json(response.content)
    print(f"✅ Agent 7 [SWOT] done")
    return state


# ─────────────────────────────────────────────────────────────
# AGENT 8: RISK DETECTION (Phase 3G)
# ─────────────────────────────────────────────────────────────
def risk_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Flags and rates risks across 6 categories."""
    llm = get_json_llm()
    context = _build_context(state)

    system_prompt = """You are a Risk Assessment Specialist. Evaluate startup risks across 6 categories.
Level must be exactly one of: "Low", "Medium", "High", "Critical"
Return ONLY this exact JSON (no markdown):
{
  "legal_regulatory": {"level": "Low|Medium|High|Critical", "description": "Specific risk description"},
  "market": {"level": "Low|Medium|High|Critical", "description": "Specific risk description"},
  "financial": {"level": "Low|Medium|High|Critical", "description": "Specific risk description"},
  "product_tech": {"level": "Low|Medium|High|Critical", "description": "Specific risk description"},
  "competitive": {"level": "Low|Medium|High|Critical", "description": "Specific risk description"},
  "execution_team": {"level": "Low|Medium|High|Critical", "description": "Specific risk description"},
  "top_risk": "The single most dangerous risk in one sentence",
  "mitigation_priority": "The most important mitigation step"
}"""

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=context)])
    state["risk_assessment"] = _safe_json(response.content)
    print(f"✅ Agent 8 [Risk Assessment] done")
    return state


# ─────────────────────────────────────────────────────────────
# AGENT 9: HEALTH DASHBOARD (Phase 3H)
# ─────────────────────────────────────────────────────────────
def health_dashboard_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Synthesizes all scores into composite 8-dimension health dashboard."""
    idea = state.get("idea_scores", {})
    founder = state.get("founder_scores", {})
    market = state.get("market_research", {})
    biz = state.get("business_model_eval", {})
    risk = state.get("risk_assessment", {})

    def safe_int(v, default=50):
        try:
            return int(v)
        except (TypeError, ValueError):
            return default

    # Derive composite scores
    idea_score = safe_int(idea.get("problem_solution_fit", 50))
    market_score = 70  # Default if market data insufficient
    product_score = safe_int(idea.get("feasibility", 50))
    financial_score = safe_int(biz.get("sustainability_score", 50))
    growth_potential = safe_int(idea.get("scalability", 50))

    # Invert risk — higher risk score means lower dashboard risk rating
    risk_levels = {"Low": 85, "Medium": 60, "High": 35, "Critical": 10}
    risk_scores = []
    for key in ["legal_regulatory", "market", "financial", "product_tech", "competitive", "execution_team"]:
        level = risk.get(key, {}).get("level", "Medium") if isinstance(risk.get(key), dict) else "Medium"
        risk_scores.append(risk_levels.get(level, 60))
    risk_score = int(sum(risk_scores) / len(risk_scores)) if risk_scores else 60

    overall = int((idea_score + market_score + product_score + financial_score + growth_potential + risk_score) / 6)

    state["health_dashboard"] = {
        "idea_score": idea_score,
        "market_score": market_score,
        "product_score": product_score,
        "financial_score": financial_score,
        "growth_potential": growth_potential,
        "risk_score": risk_score,
        "overall_score": overall
    }
    print(f"✅ Agent 9 [Health Dashboard] done — Overall: {overall}/100")
    return state
