from typing import TypedDict, Annotated, Sequence, Any, Dict
from langchain_core.messages import BaseMessage
import operator

class GraphState(TypedDict):
    """
    State definition for the LangGraph orchestrator.
    Maintains the shared memory and context across all agents.
    """
    messages: Annotated[Sequence[BaseMessage], operator.add]
    startup_context: Dict[str, Any]
    business_validation: Dict[str, Any]
    market_intelligence: Dict[str, Any]
    founder_analysis: Dict[str, Any]
    investor_feedback: Dict[str, Any]
    strategy_output: Dict[str, Any]
    current_agent: str
    next_step: str
