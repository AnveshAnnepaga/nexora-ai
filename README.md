# 🚀 Startup Accelerator AI

An AI-powered startup evaluation platform that uses a **7-agent LangGraph pipeline** to analyze your startup idea and give you investor-grade feedback — then lets you **negotiate live with an AI VC investor**.

![Platform](https://img.shields.io/badge/stack-FastAPI%20%2B%20Next.js-blue)
![LLM](https://img.shields.io/badge/LLM-Groq%20%28llama--3.1--8b%29-orange)
![RAG](https://img.shields.io/badge/RAG-ChromaDB%20%2B%20HuggingFace-green)

---

## ✨ Features

- **7-Agent AI Pipeline** via LangGraph
  1. 📋 Startup Intake — extracts structured profile from raw pitch text
  2. ✅ Business Validation — evaluates problem, solution, scalability
  3. 📊 Market Intelligence — RAG-powered competitor & trend analysis
  4. 🎥 Founder Analysis — scores founder from video transcript or written pitch
  5. 🗺️ Strategy — Business Model Canvas + GTM plan
  6. 💼 Investor VC — gives Pass/Monitor/Term Sheet verdict + tough questions
  7. 📄 Report Generation — creates executive summary + PowerPoint pitch deck

- **Context-Aware Negotiation** — Live chat with an AI investor who has read your full evaluation
- **Multimodal Input** — Upload PDFs, CSVs, MP4 pitch videos
- **Auto-generated PPT** — Investor-ready pitch deck downloaded automatically

---

## 🏗️ Project Structure

```
startup/
├── agents/                  # LangGraph agent definitions
│   ├── state.py             # Shared GraphState schema
│   ├── orchestrator.py      # LangGraph pipeline builder
│   ├── core_agents.py       # Agents 1-3 (Intake, Validation, Market)
│   ├── advanced_agents.py   # Agents 4-7 (Founder, Strategy, Investor, Report)
│   ├── context_builder.py   # Layer 1: file ingestion → ChromaDB
│   └── llm_setup.py         # Groq LLM setup
├── backend/
│   ├── api/router.py        # FastAPI endpoints (/upload, /evaluate, /negotiate)
│   ├── core/config.py       # App settings
│   ├── utils/ppt_generator.py # PowerPoint generator
│   ├── main.py              # FastAPI app entry point
│   └── requirements.txt     # Python dependencies
├── rag/
│   ├── vectorstore.py       # ChromaDB vector store manager
│   ├── document_processor.py # PDF/TXT/CSV/DOCX loader + chunker
│   └── media_processor.py   # Whisper video/audio transcription
├── frontend/                # Next.js 15 frontend
│   ├── app/                 # Next.js app router
│   ├── components/
│   │   ├── Dashboard.tsx    # Main evaluation form + results display
│   │   └── NegotiationChat.tsx # Live investor chat (context-aware)
│   └── store/useStore.ts    # Zustand global state
└── chroma_db/               # Local vector store (gitignored)
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

### 1. Backend Setup

```bash
cd startup

# Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Set your API key
copy backend\.env.example backend\.env
# Edit backend/.env and add your GROQ_API_KEY

# Start the backend
uvicorn backend.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

Create `backend/.env` based on `backend/.env.example`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Get a free key at [console.groq.com](https://console.groq.com)

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/upload` | Upload pitch video/PDF for RAG indexing |
| POST | `/api/v1/evaluate` | Run all 7 agents on your startup idea |
| POST | `/api/v1/negotiate` | Chat with context-aware AI investor |
| GET | `/health` | Health check |

---

## 🧠 How It Works

```
Founder Input (text + optional files)
        │
        ▼
Layer 1: Context Builder
  → Uploads → ChromaDB vector store (RAG)
        │
        ▼
Layer 2: 7-Agent LangGraph Pipeline
  Agent 1 → startup_context (structured JSON)
  Agent 2 → business_validation
  Agent 3 → market_intelligence (RAG-enriched)
  Agent 4 → founder_analysis (video or written)
  Agent 5 → strategy_output (BMC + GTM)
  Agent 6 → investor_feedback (verdict + questions)
  Agent 7 → executive_summary + pitch deck PPT
        │
        ▼
Layer 3: Output + Live Negotiation
  → Frontend displays all results
  → Investor chat with full evaluation context injected
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | Groq (llama-3.1-8b-instant) |
| Agent Framework | LangGraph + LangChain |
| Vector Store | ChromaDB (local) |
| Embeddings | HuggingFace all-MiniLM-L6-v2 |
| Video/Audio | OpenAI Whisper + MoviePy |
| Backend | FastAPI + Uvicorn |
| Frontend | Next.js 15 + Tailwind CSS |
| State Management | Zustand |
| Pitch Deck | python-pptx |

---

## 📄 License

MIT License — feel free to use and modify.