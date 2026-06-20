"use client"
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import IntakeForm from '@/components/IntakeForm'
import InvestorChat from '@/components/NegotiationChat'
import AnalysisDashboard from '@/components/AnalysisDashboard'
import StrategicOutput from '@/components/StrategicOutput'
import AIAssistantWidget from '@/components/AIAssistantWidget'
import { Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const AGENT_STEPS = [
  'Agent 1: Parsing Startup Intake...',
  'Agent 2: Scoring Idea Intelligence...',
  'Agent 3: Analyzing Founder Signals...',
  'Agent 4: Researching Market Size...',
  'Agent 5: Mapping Competitor Landscape...',
  'Agent 6: Evaluating Business Model...',
  'Agent 7: Running SWOT Analysis...',
  'Agent 8: Detecting Risk Signals...',
  'Agent 9: Building Health Dashboard...',
  'Agent 10: Estimating Budget...',
  'Agent 11: Generating Pitch Deck...',
  'Agent 12: Building Roadmaps...',
  'Agent 13: Designing Pricing Plan...',
  'Agent 14: Matching Investors...',
  'Agent 15: Assessing Funding Readiness...',
  'Agent 16: Analyzing Team Composition...',
]

export default function DashboardPage() {
  const { phase, setPhase, isLoading, error, setError, healthDashboard, intake } = useStore()
  const [agentStep, setAgentStep] = React.useState(0)
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()

  React.useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.push('/')
      } else if (user?.publicMetadata?.role === 'investor') {
        router.push('/investor/dashboard')
      }
    }
  }, [isLoaded, isSignedIn, user, router])

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

  // Map phase to 3 steps: Upload, Interview, Report
  const getStepStatus = (stepId: number) => {
    if (phase === 'intake') return stepId === 1 ? 'active' : 'idle'
    if (phase === 'interrogation') return stepId <= 2 ? (stepId === 2 ? 'active' : 'done') : 'idle'
    if (phase === 'analyzing' || phase === 'results') return stepId <= 3 ? (stepId === 3 && phase !== 'analyzing' ? 'active' : 'done') : 'idle'
    return 'idle'
  }

  return (
    <div className="bg-background min-h-screen flex flex-col items-center custom-scrollbar">
      {/* Background Animation Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Main Content Canvas */}
      <main className="relative z-10 w-full max-w-4xl mx-auto pt-8 px-margin-mobile pb-32 flex flex-col gap-8">
        
        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-panel border-error/50 bg-error-container/10 rounded-xl p-4 flex items-start gap-3 w-full max-w-md mx-auto"
            >
              <span className="material-symbols-outlined text-error">warning</span>
              <div className="flex-1">
                <p className="font-semibold text-error mb-1 font-body-sm">System Alert</p>
                <p className="text-xs text-error/80">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-on-surface-variant hover:text-on-surface text-xs"><span className="material-symbols-outlined">close</span></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3-Step Indicator (Only show during active flow, hide on results for more space) */}
        {phase !== 'results' && (
          <section className="flex items-center justify-between w-full max-w-md mx-auto glass-panel rounded-xl p-4 border border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${getStepStatus(1) === 'active' ? 'step-active' : getStepStatus(1) === 'done' ? 'bg-primary' : 'bg-surface-variant border border-outline-variant'}`}></span>
              <span className={`font-label-caps text-[10px] ${getStepStatus(1) !== 'idle' ? 'text-primary' : 'text-on-surface-variant'}`}>Upload</span>
            </div>
            <div className={`h-[1px] w-8 ${getStepStatus(2) !== 'idle' ? 'bg-primary/50' : 'bg-outline-variant/30'}`}></div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${getStepStatus(2) === 'active' ? 'step-active' : getStepStatus(2) === 'done' ? 'bg-primary' : 'bg-surface-variant border border-outline-variant'}`}></span>
              <span className={`font-label-caps text-[10px] ${getStepStatus(2) !== 'idle' ? 'text-primary' : 'text-on-surface-variant'}`}>Interview</span>
            </div>
            <div className={`h-[1px] w-8 ${getStepStatus(3) !== 'idle' ? 'bg-primary/50' : 'bg-outline-variant/30'}`}></div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${getStepStatus(3) === 'active' ? 'step-active' : getStepStatus(3) === 'done' ? 'bg-primary' : 'bg-surface-variant border border-outline-variant'}`}></span>
              <span className={`font-label-caps text-[10px] ${getStepStatus(3) !== 'idle' ? 'text-primary' : 'text-on-surface-variant'}`}>Report</span>
            </div>
          </section>
        )}

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
              <InvestorChat />
            </motion.div>
          )}

          {/* PHASE 3: Analyzing (loading state) */}
          {phase === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 w-full max-w-md mx-auto">
              <div className="w-24 h-24 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-8 flex items-center justify-center">
                 <div className="w-16 h-16 rounded-full border-2 border-secondary/20 border-b-secondary animate-spin-reverse flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary animate-pulse" style={{fontVariationSettings: "'FILL' 1"}}>memory</span>
                 </div>
              </div>
              <h2 className="font-display-xl text-2xl text-on-surface mb-2 orbitron">Neural Analysis Active</h2>
              <p className="text-body-sm text-on-surface-variant mb-8 text-center">
                16-Agent Intelligence Pipeline is currently processing your data.
              </p>
              
              <div className="w-full glass-panel rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                  <p className="text-primary font-data-mono text-xs">{AGENT_STEPS[agentStep]}</p>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {AGENT_STEPS.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= agentStep ? 'bg-primary glow-cyan' : 'bg-surface-variant/50'}`} />
                  ))}
                </div>
                <p className="font-data-mono text-[10px] text-outline mt-4 text-right">NODE {agentStep + 1}/{AGENT_STEPS.length}</p>
              </div>
            </motion.div>
          )}

          {/* PHASE 4: Results */}
          {phase === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <ResultTabs />
            </motion.div>
          )}
        </AnimatePresence>

        <AIAssistantWidget />
      </main>

    </div>
  )
}

function ResultTabs() {
  const [tab, setTab] = React.useState<'analysis' | 'outputs'>('analysis')
  const { setPhase } = useStore()

  return (
    <div className="w-full">
      <div className="flex gap-4 mb-8 border-b border-outline-variant/30 pb-4 overflow-x-auto custom-scrollbar">
        {([
          { id: 'analysis', label: 'DEEP ANALYSIS', icon: 'analytics' },
          { id: 'outputs', label: 'STRATEGIC OUTPUTS', icon: 'auto_awesome' },
        ] as const).map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-label-caps text-xs transition-all whitespace-nowrap
              ${tab === id
                ? 'bg-primary/10 border border-primary/30 text-primary glow-cyan'
                : 'bg-surface-container border border-outline-variant/20 text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
            {label}
          </button>
        ))}
        <button
          onClick={() => { setPhase('intake'); useStore.getState().resetIntake(); useStore.getState().resetInterrogation() }}
          className="ml-auto text-[10px] font-label-caps text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 shrink-0"
        >
          <span className="material-symbols-outlined text-[14px]">restart_alt</span> NEW SCAN
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
