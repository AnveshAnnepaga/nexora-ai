import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

# Force-reload .env every time so new keys take effect without restart
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", ".env")
load_dotenv(dotenv_path=env_path, override=True)

# Also set directly so it's always available in this process
_GROQ_KEY = None
def _get_key():
    global _GROQ_KEY
    # Re-read from file every time to pick up changes without restart
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("GROQ_API_KEY="):
                _GROQ_KEY = line.split("=", 1)[1].strip()
                break
    return _GROQ_KEY

def get_llm(model_name: str = "llama-3.1-8b-instant", temperature: float = 0.7):
    """Returns a ChatGroq LLM instance."""
    api_key = _get_key()
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in backend/.env file.")
    return ChatGroq(model=model_name, api_key=api_key, temperature=temperature)

def get_json_llm(model_name: str = "llama-3.1-8b-instant"):
    """Returns a ChatGroq LLM configured to output structured text."""
    api_key = _get_key()
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in backend/.env file.")
    return ChatGroq(model=model_name, api_key=api_key, temperature=0.1)
