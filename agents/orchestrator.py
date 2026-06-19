"""
ANTIGRAVITY LangGraph Orchestrator
14-agent pipeline across 3 phases: Analysis (3A-3H) + Outputs (4A-4G)
"""
from langgraph.graph import StateGraph, END
from agents.state import ANTIGRAVITYState

from agents.core_agents import (
    intake_agent,
    idea_scoring_agent,
    founder_scoring_agent,
    market_research_agent,
)
from agents.advanced_agents import (
    competitor_intelligence_agent,
    business_model_agent,
    swot_agent,
    risk_agent,
    health_dashboard_agent,
)
from agents.output_agents import (
    budget_agent,
    pitch_deck_agent,
    roadmap_agent,
    subscription_agent,
    investor_matching_agent,
    funding_readiness_agent,
    team_analysis_agent,
)


def build_orchestrator():
    """
    ANTIGRAVITY Pipeline:
    
    Phase 1 (Intake) →
    Phase 3A: Idea Scoring + Founder Scoring + Market Research (sequential) →
    Phase 3D: Competitor Intel + Business Model + SWOT + Risk (sequential) →
    Phase 3H: Health Dashboard →
    Phase 4: Budget + Pitch Deck + Roadmap + Subscription + 
              Investor Matching + Funding Readiness + Team Analysis (sequential) →
    END
    """
    workflow = StateGraph(ANTIGRAVITYState)

    # ── Phase 1 ──────────────────────────────────────────
    workflow.add_node("intake", intake_agent)

    # ── Phase 3A/B/C: Core Analysis ──────────────────────
    workflow.add_node("idea_scoring", idea_scoring_agent)
    workflow.add_node("founder_scoring", founder_scoring_agent)
    workflow.add_node("market_research", market_research_agent)

    # ── Phase 3D/E/F/G: Advanced Analysis ────────────────
    workflow.add_node("competitor_intel", competitor_intelligence_agent)
    workflow.add_node("business_model", business_model_agent)
    workflow.add_node("swot", swot_agent)
    workflow.add_node("risk", risk_agent)

    # ── Phase 3H: Health Dashboard ────────────────────────
    workflow.add_node("health_dashboard", health_dashboard_agent)

    # ── Phase 4: Strategic Outputs ────────────────────────
    workflow.add_node("budget", budget_agent)
    workflow.add_node("pitch_deck", pitch_deck_agent)
    workflow.add_node("roadmap", roadmap_agent)
    workflow.add_node("subscription", subscription_agent)
    workflow.add_node("investor_matching", investor_matching_agent)
    workflow.add_node("funding_readiness", funding_readiness_agent)
    workflow.add_node("team_analysis", team_analysis_agent)

    # ── Edges (sequential pipeline) ──────────────────────
    workflow.set_entry_point("intake")

    # Phase 1 → Phase 3 core
    workflow.add_edge("intake", "idea_scoring")
    workflow.add_edge("idea_scoring", "founder_scoring")
    workflow.add_edge("founder_scoring", "market_research")

    # Phase 3 core → Phase 3 advanced
    workflow.add_edge("market_research", "competitor_intel")
    workflow.add_edge("competitor_intel", "business_model")
    workflow.add_edge("business_model", "swot")
    workflow.add_edge("swot", "risk")

    # → Health Dashboard
    workflow.add_edge("risk", "health_dashboard")

    # → Phase 4 outputs
    workflow.add_edge("health_dashboard", "budget")
    workflow.add_edge("budget", "pitch_deck")
    workflow.add_edge("pitch_deck", "roadmap")
    workflow.add_edge("roadmap", "subscription")
    workflow.add_edge("subscription", "investor_matching")
    workflow.add_edge("investor_matching", "funding_readiness")
    workflow.add_edge("funding_readiness", "team_analysis")
    workflow.add_edge("team_analysis", END)

    return workflow.compile()


# Compiled graph — imported by router
orchestrator_app = build_orchestrator()
