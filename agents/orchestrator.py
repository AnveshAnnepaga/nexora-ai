from langgraph.graph import StateGraph, END
from agents.state import GraphState
from agents.core_agents import startup_intake_node, business_validation_node, market_intelligence_node
from agents.advanced_agents import investor_node, founder_analysis_node, strategy_node, report_generation_node

def build_orchestrator():
    """
    Layer 2: Reasoning Intelligence
    Builds the LangGraph state graph linking all 7 specific AI agents together 
    into a cohesive sequential pipeline.
    """
    workflow = StateGraph(GraphState)

    # Add Nodes (Agents)
    workflow.add_node("startup_intake", startup_intake_node)
    workflow.add_node("business_validation", business_validation_node)
    workflow.add_node("market_intelligence", market_intelligence_node)
    workflow.add_node("founder_analysis", founder_analysis_node)
    workflow.add_node("strategy", strategy_node)
    workflow.add_node("investor", investor_node)
    workflow.add_node("report_generation", report_generation_node)

    # Define the Edges (Routing)
    # 1. Intake extracts the base context
    workflow.set_entry_point("startup_intake")
    
    # 2. Parallel validation and analysis conceptually, but sequential in standard LangGraph
    # We sequence them: Intake -> Validation -> Market -> Founder
    workflow.add_edge("startup_intake", "business_validation")
    workflow.add_edge("business_validation", "market_intelligence")
    workflow.add_edge("market_intelligence", "founder_analysis")
    
    # 3. Strategy generation relies on market and validation
    workflow.add_edge("founder_analysis", "strategy")
    
    # 4. Investor Agent evaluates everything
    workflow.add_edge("strategy", "investor")
    
    # 5. Final Report Generation
    workflow.add_edge("investor", "report_generation")
    workflow.add_edge("report_generation", END)

    # Compile the graph
    app = workflow.compile()
    
    return app

# Expose compiled app
orchestrator_app = build_orchestrator()
