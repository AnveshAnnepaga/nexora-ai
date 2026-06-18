import json
from langchain_core.messages import SystemMessage, HumanMessage
from agents.state import GraphState
from agents.llm_setup import get_llm
from rag.vectorstore import VectorStoreManager


def founder_analysis_node(state: GraphState) -> GraphState:
    """Agent 4: Founder Analysis Agent - Evaluates founder communication from video transcription."""
    llm = get_llm()
    context = state.get("startup_context", {})
    startup_name = context.get("startup_name", "the startup")

    # Try to retrieve video transcription from vector store
    vsm = VectorStoreManager()
    search_results = vsm.similarity_search("founder pitch video transcription", k=2)
    
    has_video = bool(search_results)
    if has_video:
        transcription = "\n\n".join([doc.page_content for doc in search_results])
        analysis_target = f"Video Transcription:\n{transcription}"
        no_video_note = ""
    else:
        # No video uploaded - analyze based on written pitch instead
        problem = context.get("problem_statement", "")
        solution = context.get("solution_description", "")
        audience = context.get("target_audience", "")
        analysis_target = f"Written Pitch (no video provided):\nStartup: {startup_name}\nProblem: {problem}\nSolution: {solution}\nTarget Audience: {audience}"
        no_video_note = "\n\n⚠️ *Note: No pitch video was uploaded. Analysis is based on the written pitch description only. Upload a video for a more accurate founder assessment.*"
    
    system_prompt = """You are an expert Founder Psychologist and Pitch Coach.
Analyze the provided founder pitch for:
1. **Communication Clarity** - Is the message clear and easy to understand?
2. **Leadership Potential** - Does the founder show decisiveness and vision?
3. **Confidence Level** - Is the founder confident and credible?
4. **Vision & Passion** - Do they show deep belief in the mission?
5. **Coachability Signals** - Do they show self-awareness of gaps?

Provide:
- An overall Founder Score out of 100
- Strengths (2-3 bullet points)
- Areas for improvement (2-3 bullet points)
- A recommendation for investors"""
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=analysis_target)
    ])
    
    analysis_text = response.content + no_video_note
    state["founder_analysis"] = {"analysis": analysis_text}
    return state


def strategy_node(state: GraphState) -> GraphState:
    """Agent 5: Strategy Agent - Generates Business Model Canvas and Go-To-Market strategy."""
    llm = get_llm()
    context = state.get("startup_context", {})
    market_int = state.get("market_intelligence", {})
    biz_val = state.get("business_validation", {})
    
    system_prompt = """You are a Startup Strategist and Business Model expert.
Generate a comprehensive strategic plan including:

1. **Business Model Canvas** (Key Partners, Activities, Resources, Value Propositions, Customer Relationships, Channels, Customer Segments, Cost Structure, Revenue Streams)
2. **Revenue Model** - How does this startup make money? Pricing strategy?
3. **Go-To-Market Strategy** - Step-by-step plan for the first 90 days
4. **Key Metrics to Track** - What KPIs should the team focus on?
5. **Funding Recommendation** - Ideal funding stage and use of proceeds

Be specific and actionable. Use the market and validation data provided."""
    
    prompt = f"""
Startup Context:
{json.dumps(context, indent=2)}

Market Intelligence:
{market_int.get('market_analysis', 'N/A')[:600]}

Business Validation:
{biz_val.get('evaluation', 'N/A')[:400]}
"""
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=prompt)
    ])
    
    state["strategy_output"] = {"strategy": response.content}
    return state


def investor_node(state: GraphState) -> GraphState:
    """Agent 6: Investor Agent - Simulates a VC evaluation with verdict and tough questions."""
    llm = get_llm(temperature=0.7)
    context = state.get("startup_context", {})
    business_val = state.get("business_validation", {})
    market_int = state.get("market_intelligence", {})
    strategy = state.get("strategy_output", {})
    founder = state.get("founder_analysis", {})
    
    startup_name = context.get("startup_name", "the startup")
    
    system_prompt = f"""You are a Partner-level Venture Capitalist at a top-tier fund evaluating **{startup_name}**.

Based on the full evaluation data below, provide:

1. **Investment Verdict** (choose one):
   - ✅ TERM SHEET — Ready to proceed with investment
   - 👀 MONITOR — Interesting, but needs validation on key points
   - ❌ PASS — Not a fit at this stage

2. **Investment Thesis** — In 2-3 sentences, explain your reasoning

3. **3 Critical Questions** — The hardest questions you'd ask this founder in a live pitch meeting

4. **Key Risks** — Top 3 risks that could kill this investment

5. **What Would Change Your Mind** — What would you need to see to upgrade your verdict?

Be brutally honest but constructive. Reference specific data from the evaluation."""
    
    prompt = f"""
Startup Context: {json.dumps(context, indent=2)}

Business Validation: {business_val.get('evaluation', 'N/A')[:500]}

Market Intelligence: {market_int.get('market_analysis', 'N/A')[:500]}

Strategy: {strategy.get('strategy', 'N/A')[:400]}

Founder Analysis: {founder.get('analysis', 'N/A')[:400]}
"""
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=prompt)
    ])
    
    state["investor_feedback"] = {"feedback": response.content}
    return state


def report_generation_node(state: GraphState) -> GraphState:
    """Agent 7: Report Generation Agent - Creates the final investor-ready executive summary."""
    llm = get_llm(temperature=0.2)
    context = state.get("startup_context", {})
    startup_name = context.get("startup_name", "Startup")
    
    system_prompt = f"""You are an Executive Report Generator creating an investor-ready summary for **{startup_name}**.

Synthesize ALL analyses into a polished Executive Summary with:

# Executive Summary: {startup_name}

## The Opportunity
(2-3 sentence hook about the problem and market)

## Our Solution
(Clear description of what the startup does)

## Market Opportunity
(Key market data and opportunity size)

## Business Validation
(Core strengths and any risks identified)

## Founder Assessment
(Brief founder evaluation)

## Strategic Plan
(Top 3 strategic priorities)

## Investment Recommendation
(Final verdict and suggested terms/conditions)

---
*Generated by Startup Accelerator AI — {startup_name} Evaluation Report*

Write in professional, investor-grade language. Be concise but complete."""
    
    # Pass the entire state for context
    safe_state = {k: v for k, v in state.items() if k != "messages"}
    prompt = f"Full Evaluation Data:\n{json.dumps(safe_state, indent=2)}"
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=prompt)
    ])
    
    # Ensure strategy_output exists
    if "strategy_output" not in state or not state["strategy_output"]:
        state["strategy_output"] = {}
    
    state["strategy_output"]["executive_summary"] = response.content
    
    # Generate the PPT Pitch Deck
    try:
        import sys
        import os
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if project_root not in sys.path:
            sys.path.append(project_root)
            
        from backend.utils.ppt_generator import create_startup_pitch_deck
        ppt_path = create_startup_pitch_deck(state, f"{startup_name.replace(' ', '_')}_pitch_deck.pptx")
        state["strategy_output"]["ppt_path"] = ppt_path
        print(f"✅ PPT generated: {ppt_path}")
    except Exception as e:
        print(f"⚠️ PPT generation failed (non-critical): {e}")
        
    return state
