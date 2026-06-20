"""
ANTIGRAVITY Strategic Output Agents — Phase 4
Agents: Budget, Pitch Deck, Roadmap, Subscription, Investor Matching, Funding Readiness, Team Analysis
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


def _ctx(state: ANTIGRAVITYState) -> str:
    return f"""Startup: {state.get("startup_name","Unknown")}
Video Content: {state.get("video_content", "N/A")}
Idea Text: {state.get("idea_text", "N/A")}
PDF Content: {state.get("pdf_content", "N/A")}
Market Research: {json.dumps(state.get("market_research",{}))[:400]}
Idea Scores: {json.dumps(state.get("idea_scores",{}))[:300]}
Health Score: {state.get("health_dashboard",{}).get("overall_score","N/A")}/100"""


# ─────────────────────────────────────────────────────────────
# AGENT 10: BUDGET ESTIMATION (Phase 4A)
# ─────────────────────────────────────────────────────────────
def budget_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Estimates MVP cost, 6/12-month budgets, and funding ask."""
    llm = get_json_llm()
    system_prompt = """You are a Startup CFO and budget specialist. Estimate realistic costs for this startup.
Return ONLY this exact JSON (no markdown):
{
  "mvp_cost": "$X,000 - $X,000",
  "budget_6m": "$X,000 - $X,000",
  "budget_12m": "$X,000 - $X,000",
  "funding_ask": "$X,000 (Seed stage recommended ask)",
  "breakdown": {
    "product_engineering": {"amount": "$X,000", "notes": "Engineers, infra, tools"},
    "marketing_growth": {"amount": "$X,000", "notes": "Ads, content, SEO"},
    "operations": {"amount": "$X,000", "notes": "Office, admin, software"},
    "legal_compliance": {"amount": "$X,000", "notes": "Incorporation, contracts, IP"},
    "team_hiring": {"amount": "$X,000", "notes": "Key hires needed"}
  },
  "burn_rate_monthly": "$X,000/month",
  "runway_months": <number>
}"""
    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=_ctx(state))])
    state["budget"] = _safe_json(response.content)
    print(f"✅ Agent 10 [Budget] done")
    return state


# ─────────────────────────────────────────────────────────────
# AGENT 11: PITCH DECK (Phase 4B)
# ─────────────────────────────────────────────────────────────
def pitch_deck_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Generates 12-slide investor pitch deck content."""
    llm = get_json_llm()
    market = state.get("market_research", {})
    biz = state.get("business_model_eval", {})
    ctx = _ctx(state) + f"\nCAC: {biz.get('cac_estimate','N/A')} | LTV: {biz.get('ltv_estimate','N/A')}\nTAM: {market.get('tam','N/A')} | SAM: {market.get('sam','N/A')}"

    system_prompt = """You are an elite pitch deck consultant who has helped 200+ startups raise funding.
Generate a complete 12-slide investor pitch deck. Return ONLY this exact JSON (no markdown):
{
  "slides": [
    {
      "slide_number": 1,
      "title": "Cover",
      "bullets": ["Company name + tagline", "Founder name", "Contact info", "Date"]
    },
    {
      "slide_number": 2,
      "title": "The Problem",
      "bullets": ["Pain point with data/stat", "Who suffers from this", "Cost of the problem today", "Why now — timing"]
    },
    {
      "slide_number": 3,
      "title": "Our Solution",
      "bullets": ["Core value proposition", "How it works (3 steps)", "Key features", "Before vs After"]
    },
    {
      "slide_number": 4,
      "title": "Market Opportunity",
      "bullets": ["TAM: $X billion", "SAM: $X million", "SOM: $X million (3-year target)", "Market growth rate"]
    },
    {
      "slide_number": 5,
      "title": "Product Demo",
      "bullets": ["Primary user workflow", "Key screen/feature 1", "Key screen/feature 2", "Technical differentiator"]
    },
    {
      "slide_number": 6,
      "title": "Business Model",
      "bullets": ["Primary revenue stream", "Pricing tiers", "CAC vs LTV", "Break-even timeline"]
    },
    {
      "slide_number": 7,
      "title": "Traction",
      "bullets": ["Customers / users to date", "Revenue / MRR", "Key metric growth %", "Notable milestones"]
    },
    {
      "slide_number": 8,
      "title": "Competitor Landscape",
      "bullets": ["Top 3 competitors named", "Our differentiation", "Why we win", "Unfair advantage"]
    },
    {
      "slide_number": 9,
      "title": "Go-To-Market Strategy",
      "bullets": ["Primary acquisition channel", "90-day launch plan", "Partnership strategy", "First 100 customers"]
    },
    {
      "slide_number": 10,
      "title": "Team",
      "bullets": ["Founder 1 — title + relevant background", "Founder 2 — title + relevant background", "Key advisor", "Team strengths"]
    },
    {
      "slide_number": 11,
      "title": "Financial Projections",
      "bullets": ["Year 1: $X revenue", "Year 2: $X revenue", "Year 3: $X revenue", "Key assumptions"]
    },
    {
      "slide_number": 12,
      "title": "The Ask",
      "bullets": ["Raising: $X (Seed)", "Use of funds: breakdown", "Milestones this achieves", "Expected close date"]
    }
  ]
}"""

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=ctx)])
    state["pitch_deck"] = _safe_json(response.content)
    print(f"✅ Agent 11 [Pitch Deck] done")
    return state


# ─────────────────────────────────────────────────────────────
# AGENT 12: ROADMAP (Phase 4C)
# ─────────────────────────────────────────────────────────────
def roadmap_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Generates 30/90/180/365 day roadmaps."""
    llm = get_json_llm()
    system_prompt = """You are a Startup Execution Expert. Generate milestone-based roadmaps.
Return ONLY this exact JSON (no markdown):
{
  "day_30": [
    "Week 1: Action item with clear deliverable",
    "Week 2: Action item",
    "Week 3: Action item",
    "Week 4: Action item — milestone checkpoint"
  ],
  "day_90": [
    "Month 2: Major goal with metric",
    "Month 2: Second major goal",
    "Month 3: Major goal",
    "Month 3: Milestone — what success looks like at day 90"
  ],
  "month_6": [
    "Month 4: Goal",
    "Month 4-5: Goal",
    "Month 5: Goal",
    "Month 6: Milestone — what success looks like at month 6"
  ],
  "year_1": [
    "Q3: Major company goal",
    "Q3: Fundraising or revenue milestone",
    "Q4: Major product/growth goal",
    "Q4: Year 1 success definition"
  ]
}"""
    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=_ctx(state))])
    state["roadmap"] = _safe_json(response.content)
    print(f"✅ Agent 12 [Roadmap] done")
    return state


# ─────────────────────────────────────────────────────────────
# AGENT 13: SUBSCRIPTION PLAN (Phase 4D)
# ─────────────────────────────────────────────────────────────
def subscription_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Recommends subscription tiers and pricing strategy."""
    llm = get_json_llm()
    system_prompt = """You are a Pricing Strategy Expert. Recommend subscription pricing for this startup.
Return ONLY this exact JSON (no markdown):
{
  "applicable": true/false,
  "model_type": "Freemium|Subscription|Usage-based|One-time|Hybrid",
  "tiers": [
    {
      "name": "Free/Starter",
      "price": "$0/month",
      "features": ["feature 1", "feature 2", "feature 3"],
      "target": "Who this is for"
    },
    {
      "name": "Pro",
      "price": "$X/month",
      "features": ["all Free features", "feature 4", "feature 5", "feature 6"],
      "target": "Who this is for"
    },
    {
      "name": "Enterprise",
      "price": "Custom / $X/month",
      "features": ["all Pro features", "feature 7", "feature 8", "SLA + support"],
      "target": "Who this is for"
    }
  ],
  "strategy_recommendation": "Why this pricing model vs alternatives",
  "freemium_to_paid_conversion": "Expected X% based on industry benchmarks",
  "annual_discount": "X% discount for annual billing",
  "benchmark_note": "Comparable pricing in this market"
}"""
    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=_ctx(state))])
    state["subscription_plan"] = _safe_json(response.content)
    print(f"✅ Agent 13 [Subscription] done")
    return state


# ─────────────────────────────────────────────────────────────
# AGENT 14: INVESTOR MATCHING (Phase 4E)
# ─────────────────────────────────────────────────────────────
def investor_matching_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Suggests relevant VCs, angels, accelerators, and YC fit."""
    llm = get_json_llm()
    system_prompt = """You are an expert in the venture capital ecosystem. Match this startup with relevant investors.
Return ONLY this exact JSON (no markdown):
{
  "vcs": [
    {
      "name": "VC Firm Name",
      "focus": "Industry/stage focus",
      "stage": "Pre-seed / Seed / Series A",
      "notable_portfolio": "1-2 relevant portfolio companies",
      "compatibility_score": <0-100>,
      "why": "Why this VC is a good fit"
    }
  ],
  "angels": [
    {
      "profile": "Former founder/operator in X industry",
      "fit_reason": "Why this angel archetype fits"
    }
  ],
  "accelerators": ["Accelerator 1 — why", "Accelerator 2 — why"],
  "funding_stage_recommendation": "Pre-seed / Seed / Bridge",
  "ideal_check_size": "$X,000 - $X,000"
}"""
    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=_ctx(state))])
    state["investor_matching"] = _safe_json(response.content)
    print(f"✅ Agent 14 [Investor Matching] done")
    return state


# ─────────────────────────────────────────────────────────────
# AGENT 15: FUNDING READINESS (Phase 4F)
# ─────────────────────────────────────────────────────────────
def funding_readiness_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Assesses investment readiness and what to fix before fundraising."""
    llm = get_json_llm()
    overall_score = state.get("health_dashboard", {}).get("overall_score", 50)
    ctx = _ctx(state) + f"\nWeak Zones from Q&A: {state.get('weak_zones', [])}"

    system_prompt = f"""You are a fundraising readiness coach. The startup's overall health score is {overall_score}/100.
Assess their readiness to raise investment. Return ONLY this exact JSON (no markdown):
{{
  "readiness_score": <0-100>,
  "readiness_label": "Not Ready|Early Stage|Getting Ready|Ready to Raise|Highly Investable",
  "missing_docs": [
    "Item that's missing (e.g., Financial model / Cap table / Term sheet template)"
  ],
  "financial_gaps": [
    "Financial preparation gap (e.g., No 3-year projection / No unit economics data)"
  ],
  "due_diligence_gaps": [
    "Due diligence gap (e.g., No legal entity formed / No IP protection)"
  ],
  "top_3_fixes": [
    "Most impactful thing to do before approaching investors",
    "Second most impactful fix",
    "Third fix"
  ],
  "timeline_to_raise": "Estimated X weeks/months of preparation needed"
}}"""

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=ctx)])
    state["funding_readiness"] = _safe_json(response.content)
    print(f"✅ Agent 15 [Funding Readiness] done")
    return state


# ─────────────────────────────────────────────────────────────
# AGENT 16: TEAM ANALYSIS (Phase 4G)
# ─────────────────────────────────────────────────────────────
def team_analysis_agent(state: ANTIGRAVITYState) -> ANTIGRAVITYState:
    """Identifies skill gaps, missing roles, and team balance."""
    llm = get_json_llm()
    ctx = _ctx(state)

    system_prompt = """You are a Team Building Expert and talent strategist for startups.
Analyze the founder(s) and identify what's missing. Return ONLY this exact JSON (no markdown):
{
  "skill_gaps": [
    "Missing skill 1 that is critical for success",
    "Missing skill 2",
    "Missing skill 3"
  ],
  "missing_roles": [
    {"role": "CTO / Lead Engineer", "priority": "Critical", "reason": "Why this role is needed"},
    {"role": "Head of Sales", "priority": "High", "reason": "Why"},
    {"role": "Role 3", "priority": "Medium", "reason": "Why"}
  ],
  "hiring_timeline": {
    "month_1_3": "Role to hire first and why",
    "month_3_6": "Second hire",
    "month_6_12": "Scale hiring — what to build"
  },
  "team_balance_score": <0-100>,
  "tech_score": <0-100>,
  "business_score": <0-100>,
  "creative_score": <0-100>,
  "team_assessment": "2-3 sentence overall assessment of the team's strengths and gaps"
}"""

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=ctx)])
    state["team_analysis"] = _safe_json(response.content)
    print(f"✅ Agent 16 [Team Analysis] done")
    return state
