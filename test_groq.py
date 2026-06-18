import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.llm_setup import get_llm, get_json_llm
from langchain_core.messages import HumanMessage

try:
    print("Testing regular LLM...")
    llm = get_llm()
    res = llm.invoke([HumanMessage(content="Hello")])
    print(res.content)
    
    print("Testing JSON LLM...")
    json_llm = get_json_llm()
    res2 = json_llm.invoke([HumanMessage(content="Return a JSON object with key 'test' and value 'success' in json format")])
    print(res2.content)
    
    print("ALL TESTS PASSED!")
except Exception as e:
    import traceback
    traceback.print_exc()
