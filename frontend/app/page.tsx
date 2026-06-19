"use client"
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import IntakeForm from '@/components/IntakeForm'
import InvestorChat from '@/components/NegotiationChat'
import AnalysisDashboard from '@/components/AnalysisDashboard'
import StrategicOutput from '@/components/StrategicOutput'
import { Loader2, CheckCircle2, ClipboardList, MessageSquare, BarChart3, Rocket } from 'lucide-react'

const PHASES = [
  { id: 'intake', label: 'Intake', icon: ClipboardList, step: 1 },
  { id: 'interrogation', label: 'Investor Chat', icon: MessageSquare, step: 2 },
  { id: 'analyzing', label: 'Analyzing', icon: BarChart3, step: 3 },
  { id: 'results', label: 'Results', icon: Rocket, step: 4 },
]

const AGENT_STEPS = [
  '🗂️ Agent 1: Parsing Startup Intake...',
  '💡 Agent 2: Scoring Idea Intelligence...',
  '🎥 Agent 3: Analyzing Founder Signals...',
  '📊 Agent 4: Researching Market Size...',
  '🥊 Agent 5: Mapping Competitor Landscape...',
  '💰 Agent 6: Evaluating Business Model...',
  '🔁 Agent 7: Running SWOT Analysis...',
  '🛡️ Agent 8: Detecting Risk Signals...',
  '📈 Agent 9: Building Health Dashboard...',
  '💵 Agent 10: Estimating Budget...',
  '📑 Agent 11: Generating Pitch Deck...',
  '🗺️ Agent 12: Building Roadmaps...',
  '💳 Agent 13: Designing Pricing Plan...',
  '🤝 Agent 14: Matching Investors...',
  '✅ Agent 15: Assessing Funding Readiness...',
  '👥 Agent 16: Analyzing Team Composition...',
]

export default function ANTIGRAVITYApp() {
  const { phase, setPhase, isLoading, error, setError, healthDashboard, intake } = useStore()
  const [agentStep, setAgentStep] = React.useState(0)

  React.useEffect(() => {
    if (phase === 'analyzing' && isLoading) {
      setAgentStep(0)
      const interval = setInterval(() => {
        setAgentStep(prev => {
          if (prev >= AGENT_STEPS.length - 1) { clearInterval(interval); return prev }
          return prev + 1
        })
      }, 3500)
      return () => clearInterval(interval)
    }
  }, [phase, isLoading])

  const currentPhaseIndex = PHASES.findIndex(p => p.id === phase)

  return (
    <div className="min-h-screen" style={{ background: 'var(--ag-bg)' }}>

      {/* ── Top Bar ───────────────────────────────────────────── */}
      <header className="border-b border-[#1e2d47] bg-[#0a0c14]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-black text-sm">A</div>
            <div>
              <span className="font-black text-lg text-gradient">ANTIGRAVITY</span>
              <span className="text-slate-500 text-xs ml-2">AI Startup Intelligence Engine</span>
            </div>
          </div>
          {intake.startup_name && (
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
              <span className="text-slate-600">Evaluating:</span>
              <span className="font-semibold text-white">{intake.startup_name}</span>
            </div>
          )}
          {healthDashboard?.overall_score && (
            <div className="flex items-center gap-2 bg-[#111827] border border-[#1e2d47] px-3 py-1.5 rounded-lg">
              <span className="text-xs text-slate-500">Overall Score</span>
              <span className="font-black text-gradient text-lg">{healthDashboard.overall_score}</span>
              <span className="text-xs text-slate-600">/100</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Phase Stepper ─────────────────────────────────────── */}
      <div className="border-b border-[#1e2d47] bg-[#0d1424]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-center gap-2 md:gap-0">
            {PHASES.map(({ id, label, icon: Icon, step }, idx) => {
              const isCurrent = phase === id
              const isDone = currentPhaseIndex > idx
              return (
                <React.Fragment key={id}>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                    ${isCurrent ? 'phase-step-active' :
                      isDone ? 'phase-step-done' :
                      'phase-step-idle'}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="hidden md:inline">{label}</span>
                    <span className="md:hidden">{step}</span>
                  </div>
                  {idx < PHASES.length - 1 && (
                    <div className={`h-px flex-1 mx-2 transition-all ${isDone ? 'bg-emerald-500' : 'bg-[#1e2d47]'}`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
            >
              <span className="text-red-400 text-xl shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-red-300 mb-1">Something went wrong</p>
                <p className="text-sm text-red-400/80">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-slate-500 hover:text-slate-300 text-sm ml-4 shrink-0">✕ Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* PHASE 1: Intake Form */}
          {phase === 'intake' && (
            <motion.div key="intake" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <IntakeForm />
            </motion.div>
          )}

          {/* PHASE 2: Investor Chat */}
          {phase === 'interrogation' && (
            <motion.div key="interrogation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                  <span className="w-2 h-2 bg-red-400 rounded-full pulse-dot" />
                  PHASE 2 — INVESTOR INTERROGATION
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">You are in the hot seat</h2>
                <p className="text-slate-400 max-w-lg mx-auto">
                  A seasoned VC will interrogate your startup across 10 dimensions. Answer honestly and in depth. When satisfied, close the session to trigger the full AI analysis.
                </p>
              </div>
              <InvestorChat />
            </motion.div>
          )}

          {/* PHASE 3: Analyzing (loading state) */}
          {phase === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Running 16-Agent Intelligence Pipeline</h2>
              <p className="text-slate-400 mb-8 text-center max-w-md">
                Your startup is being analyzed by 16 specialized AI agents across all dimensions. This takes 60–120 seconds.
              </p>
              <div className="w-full max-w-md bg-[#0d1424] border border-[#1e2d47] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                  <p className="text-blue-300 font-medium text-sm">{AGENT_STEPS[agentStep]}</p>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {AGENT_STEPS.map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= agentStep ? 'bg-blue-500' : 'bg-[#1a2235]'}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-3 text-right">Agent {agentStep + 1} of {AGENT_STEPS.length}</p>
              </div>
            </motion.div>
          )}

          {/* PHASE 4: Results */}
          {phase === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                  <CheckCircle2 className="w-4 h-4" />
                  ANALYSIS COMPLETE — {intake.startup_name}
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">ANTIGRAVITY Intelligence Report</h2>
                <p className="text-slate-400">16 agents · {Object.keys(useStore.getState().ideaScores || {}).length > 3 ? '15+ dimensions analyzed' : 'Full intelligence suite'}</p>
              </div>

              {/* Tab Navigation */}
              <ResultTabs />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

// Tab switcher for Phase 4
function ResultTabs() {
  const [tab, setTab] = React.useState<'analysis' | 'outputs'>('analysis')
  const { setPhase } = useStore()

  return (
    <div>
      <div className="flex gap-2 mb-8 border-b border-[#1e2d47] pb-1">
        {([
          { id: 'analysis', label: '📊 Phase 3 — Deep Analysis', desc: 'Scores, Charts, SWOT, Risks' },
          { id: 'outputs', label: '🚀 Phase 4 — Strategic Outputs', desc: 'Budget, Deck, Roadmap, Investors' },
        ] as const).map(({ id, label, desc }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-3 rounded-t-lg text-sm font-semibold transition-all
              ${tab === id
                ? 'bg-[#111827] border-x border-t border-[#1e2d47] text-white -mb-px border-b-0 border-b-[#111827]'
                : 'text-slate-500 hover:text-slate-300'}`}
          >
            {label}
            <span className="block text-xs font-normal opacity-60">{desc}</span>
          </button>
        ))}
        <button
          onClick={() => { setPhase('intake'); useStore.getState().resetIntake(); useStore.getState().resetInterrogation() }}
          className="ml-auto text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ↺ Start New Evaluation
        </button>
      </div>
      <AnimatePresence mode="wait">
        {tab === 'analysis' ? (
          <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AnalysisDashboard />
          </motion.div>
        ) : (
          <motion.div key="outputs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <StrategicOutput />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
