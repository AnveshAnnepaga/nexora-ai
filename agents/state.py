from typing import TypedDict, Annotated, Sequence, Any, Dict, List, Optional
from langchain_core.messages import BaseMessage
import operator


class ANTIGRAVITYState(TypedDict):
    """
    Full ANTIGRAVITY state shared across all 4 phases and 14 agents.
    """
    # ── Meta ──────────────────────────────────────────────
    messages: Annotated[Sequence[BaseMessage], operator.add]
    phase: str  # "intake" | "interrogation" | "analysis" | "outputs"

    # ── Phase 1: Intake ───────────────────────────────────
    startup_name: str
    problem_statement: str
    proposed_solution: str
    target_audience: str
    business_model: str
    founder_video_transcript: str   # From Whisper or text fallback
    pitch_deck_analysis: str        # From uploaded PDF
    market_details: str             # Optional founder-provided
    competitor_info: str            # Optional founder-provided

    # ── Phase 2: Investor Interrogation ──────────────────
    interrogation_summary: str      # Summary of Q&A session
    weak_zones: List[str]           # Domains with shallow answers

    # ── Phase 3A: Idea Intelligence Scores ───────────────
    idea_scores: Dict[str, Any]
    # {
    #   problem_solution_fit: int, innovation: int, market_demand: int,
    #   scalability: int, feasibility: int, uniqueness: int,
    #   revenue_potential: int, risk_assessment: int,
    #   success_probability: int, failure_probability: int,
    #   justifications: Dict[str, str]
    # }

    # ── Phase 3B: Founder Intelligence Scores ────────────
    founder_scores: Dict[str, Any]
    # {
    #   communication_clarity: int, confidence: int, passion: int,
    #   domain_expertise: int, leadership_signal: int,
    #   presentation_quality: int, credibility: int,
    #   overall_founder_score: int, justifications: Dict[str, str]
    # }

    # ── Phase 3C: Market Research ─────────────────────────
    market_research: Dict[str, Any]
    # {
    #   tam: str, sam: str, som: str, growth_rate: str,
    #   saturation: str, opportunities: List[str], future_demand: str
    # }

    # ── Phase 3D: Competitor Intelligence ─────────────────
    competitor_intel: Dict[str, Any]
    # {
    #   competitors: List[{name, funding, market_share, strengths, weaknesses, gap}],
    #   competitive_advantage_score: int,
    #   competitive_advantage_summary: str
    # }

    # ── Phase 3E: Business Model Evaluation ───────────────
    business_model_eval: Dict[str, Any]
    # {
    #   revenue_validation: str, pricing_score: int,
    #   cac_estimate: str, ltv_estimate: str, payback_period: str,
    #   breakeven_estimate: str, sustainability_score: int
    # }

    # ── Phase 3F: SWOT Analysis ───────────────────────────
    swot: Dict[str, Any]
    # { strengths: List[str], weaknesses: List[str],
    #   opportunities: List[str], threats: List[str] }

    # ── Phase 3G: Risk Assessment ─────────────────────────
    risk_assessment: Dict[str, Any]
    # {
    #   legal_regulatory: {level, description},
    #   market: {level, description},
    #   financial: {level, description},
    #   product_tech: {level, description},
    #   competitive: {level, description},
    #   execution_team: {level, description}
    # }

    # ── Phase 3H: Health Dashboard ────────────────────────
    health_dashboard: Dict[str, Any]
    # {
    #   idea_score: int, founder_score: int, market_score: int,
    #   product_score: int, financial_score: int,
    #   growth_potential: int, risk_score: int, overall_score: int
    # }

    # ── Phase 4A: Budget Estimation ───────────────────────
    budget: Dict[str, Any]
    # {
    #   mvp_cost: str, budget_6m: str, budget_12m: str,
    #   funding_ask: str,
    #   breakdown: {product_engineering, marketing, operations, legal, team}
    # }

    # ── Phase 4B: Pitch Deck ──────────────────────────────
    pitch_deck: Dict[str, Any]
    # { slides: List[{slide_number, title, content_bullets}] }

    # ── Phase 4C: Roadmap ─────────────────────────────────
    roadmap: Dict[str, Any]
    # {
    #   day_30: List[str], day_90: List[str],
    #   month_6: List[str], year_1: List[str]
    # }

    # ── Phase 4D: Subscription Plan ───────────────────────
    subscription_plan: Dict[str, Any]
    # {
    #   applicable: bool, tiers: List[{name, price, features}],
    #   strategy: str, conversion_assumption: str
    # }

    # ── Phase 4E: Investor Matching ───────────────────────
    investor_matching: Dict[str, Any]
    # {
    #   vcs: List[{name, focus, stage, compatibility_score}],
    #   angels: List[{name, background, fit_reason}],
    #   yc_fit: {score, reasoning},
    #   accelerators: List[str]
    # }

    # ── Phase 4F: Funding Readiness ───────────────────────
    funding_readiness: Dict[str, Any]
    # {
    #   readiness_score: int, missing_docs: List[str],
    #   financial_gaps: List[str], due_diligence_gaps: List[str],
    #   top_3_fixes: List[str]
    # }

    # ── Phase 4G: Team Analysis ───────────────────────────
    team_analysis: Dict[str, Any]
    # {
    #   skill_gaps: List[str], missing_roles: List[str],
    #   hiring_priority: List[str], team_balance_score: int,
    #   tech_score: int, business_score: int, creative_score: int
    # }
