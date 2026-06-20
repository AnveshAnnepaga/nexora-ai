# Nexora — AI Startup Intelligence Engine 🚀

Nexora is a full-stack, AI-powered platform designed to evaluate and validate startup ideas. By leveraging a team of 16 specialized AI agents, Nexora acts as a relentless, data-driven mentor and investor panel, providing founders with comprehensive market research, SWOT analysis, and actionable feedback before they write a single line of code.

**[Live Demo](https://nexora-validator.vercel.app/)** 

## 🧠 Core Features
- **16-Agent Orchestration:** Powered by LangGraph, specialized agents (Market Analyst, Tech Lead, VCs, Legal) sequentially interrogate and evaluate your startup idea.
- **Investor Dashboard:** Get an exact "Success Probability Score" and read direct feedback from different investor personas (The Visionary, The Skeptic, The ROI-Obsessed).
- **Comprehensive Reports:** Automatically generates SWOT analysis, Competitor Analysis, Go-to-Market strategies, and a dynamic Pitch Deck structure.
- **Real-Time AI Processing:** Extremely fast inference powered by Llama 3 via the Groq API.
- **Secure Authentication:** User management and sign-ins seamlessly handled by Clerk.

## 🛠 Tech Stack
### Frontend (Vercel)
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + Framer Motion (for dynamic UI animations)
- **State Management:** Zustand
- **Graphics:** Custom WebGL and Three.js 3D interactive backgrounds
- **Auth:** Clerk

### Backend Engine (Hugging Face Spaces)
- **Framework:** FastAPI & Uvicorn
- **AI Orchestration:** LangGraph & LangChain
- **LLM Provider:** Groq API (Llama 3 70B)
- **Database:** SQLite & SQLAlchemy (for storing reports)
- **Containerization:** Docker

## ⚙️ How It Works
1. **Intake:** The founder submits their elevator pitch, target audience, and problem/solution via the Next.js frontend.
2. **Orchestration:** The data is sent to the FastAPI backend running on Hugging Face Spaces.
3. **Agent Pipeline:** LangGraph orchestrates the 16 agents to analyze the market, grade the idea, and generate the components of the business plan.
4. **Delivery:** The structured JSON report is returned to the frontend and rendered in a beautiful, interactive dashboard.

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- Python 3.10+
- A [Groq API Key](https://console.groq.com/keys)
- A [Clerk Publishable/Secret Key](https://clerk.com/)

### 1. Start the Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r ../requirements.txt

# Create a .env file and add your GROQ_API_KEY
echo "GROQ_API_KEY=your_key_here" > .env

uvicorn api.router:app --host 0.0.0.0 --port 7860 --reload
```

### 2. Start the Frontend
```bash
cd frontend
npm install

# Create a .env.local file with your Clerk keys and backend URL
echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_..." > .env.local
echo "CLERK_SECRET_KEY=sk_test_..." >> .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:7860" >> .env.local

npm run dev
```
Visit `http://localhost:3000` to view the application!

---
*Built with ❤️ by Anvesh*