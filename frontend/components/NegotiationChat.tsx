"use client"
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import ReactMarkdown from 'react-markdown'
import { Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

const DOMAINS = [
  { id: 'A', label: 'Problem' },
  { id: 'B', label: 'Solution' },
  { id: 'C', label: 'Market' },
  { id: 'D', label: 'Business Model' },
  { id: 'E', label: 'Competition' },
  { id: 'F', label: 'Traction' },
  { id: 'G', label: 'Team' },
  { id: 'H', label: 'Financials' },
  { id: 'I', label: 'Risks' },
  { id: 'J', label: 'Vision' },
]

export default function InvestorChat() {
  const {
    intake, interrogationHistory, addInterrogationMessage,
    domainsCompleted, currentDomain,
    setPhase, setLoading, setError, completeInterrogation,
    isLoading
  } = useStore()
  const { user } = useUser()
  const internalId = user?.publicMetadata?.internal_id as number | undefined

  const [input, setInput] = useState('')
  const [localLoading, setLocalLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [localDomains, setLocalDomains] = useState<string[]>([])
  const [localCurrentDomain, setLocalCurrentDomain] = useState('A')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [interrogationHistory, localLoading])

  const hasInitialized = useRef(false)

  // Auto-open with investor's first message
  useEffect(() => {
    if (!hasInitialized.current && interrogationHistory.length === 0) {
      hasInitialized.current = true
      setInitialized(true)
      sendMessage("I'm ready to begin the evaluation session.")
    }
  }, [interrogationHistory.length])

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return
    setLocalLoading(true)

    const userMsg = { role: 'user', content: userMessage }
    if (userMessage !== "I'm ready to begin the evaluation session.") {
      addInterrogationMessage(userMsg)
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/interrogate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: userMessage,
          history: interrogationHistory,
          startup_name: intake.startup_name,
          problem_statement: intake.problem_statement,
          proposed_solution: intake.proposed_solution,
          target_audience: intake.target_audience,
          business_model: intake.business_model,
          current_domain: localCurrentDomain,
          domains_completed: localDomains,
        })
      })
      const data = await res.json()

      addInterrogationMessage({ role: 'investor', content: data.reply })
      if (data.current_domain) setLocalCurrentDomain(data.current_domain)
      if (data.domains_remaining) {
        const done = DOMAINS.map(d => d.id).filter(d => !data.domains_remaining.includes(d))
        setLocalDomains(done)
      }
    } catch (err) {
      addInterrogationMessage({ role: 'investor', content: '⚠️ Connection error. Please try again.' })
    } finally {
      setLocalLoading(false)
      setInput('')
    }
  }

  const handleSend = () => {
    if (!input.trim() || localLoading) return
    sendMessage(input.trim())
  }

  const handleCloseSession = async () => {
    const summary = interrogationHistory
      .filter(m => m.role === 'user')
      .map((m, i) => `Q${i+1}: ${m.content.substring(0, 200)}`)
      .join('\n')

    const weakZones = DOMAINS
      .filter(d => !localDomains.includes(d.id))
      .map(d => d.label)

    completeInterrogation(summary, weakZones)
    setPhase('analyzing')
    runFullAnalysis(summary, weakZones)
  }

  const runFullAnalysis = async (summary: string, weakZones: string[]) => {
    const { setResults, intake, setPhase, setError } = useStore.getState()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...intake,
          interrogation_summary: summary,
          weak_zones: weakZones,
          user_id: internalId,
          interview_transcript: interrogationHistory,
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
        throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail))
      }

      const data = await res.json()
      setResults(data)
      setPhase('results')
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.')
      setPhase('interrogation')
    } finally {
      setLoading(false)
    }
  }

  const canClose = localDomains.length >= 4

  return (
    <div className="flex flex-col h-[75vh] w-full max-w-4xl mx-auto -mt-4">
      
      {/* Domain Progress Tracker */}
      <div className="w-full py-4 px-4 flex gap-6 overflow-x-auto custom-scrollbar glass-panel rounded-xl mb-4 shrink-0">
        {DOMAINS.map(({ id, label }) => {
          const isDone = localDomains.includes(id)
          const isCurrent = localCurrentDomain === id

          return (
            <div key={id} className={`flex flex-col items-center gap-1 shrink-0 ${isDone ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-30'}`}>
              {isDone ? (
                <span className="material-symbols-outlined text-tertiary-fixed text-[18px]">check_circle</span>
              ) : isCurrent ? (
                <div className="w-2.5 h-2.5 bg-tertiary rounded-full shadow-[0_0_10px_#00ff94]"></div>
              ) : (
                <div className="w-2.5 h-2.5 bg-outline rounded-full"></div>
              )}
              <span className={`font-label-caps text-[9px] uppercase ${isCurrent ? 'text-tertiary' : ''}`}>{label}</span>
            </div>
          )
        })}
      </div>

      {/* Chat History */}
      <section className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar bg-surface-container-lowest/30 rounded-xl mb-4 border border-outline-variant/10">
        {interrogationHistory.map((msg, idx) => (
          <div key={idx} className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'self-end' : ''}`}>
            
            {msg.role === 'investor' ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary-container/20 flex items-center justify-center border border-primary/40">
                    <span className="material-symbols-outlined text-primary text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
                  </div>
                  <span className="font-orbitron text-[10px] text-primary tracking-widest">NEXORA AI</span>
                </div>
                <div className="p-4 bg-surface-container-low border-l-2 border-primary-container rounded-r-xl rounded-bl-xl shadow-lg shadow-black/20 text-sm prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 self-end">
                  <span className="font-label-caps text-[10px] text-secondary tracking-widest">FOUNDER</span>
                  <div className="w-6 h-6 rounded-full bg-secondary-container/30 border border-secondary/40 overflow-hidden flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-[14px]">person</span>
                  </div>
                </div>
                <div className="p-4 bg-secondary-container/10 border-r-2 border-secondary rounded-l-xl rounded-br-xl shadow-lg shadow-black/20 text-right text-sm">
                  <p className="font-body-md text-secondary-fixed leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </>
            )}

          </div>
        ))}
        {localLoading && (
          <div className="flex flex-col gap-2 max-w-[85%]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary-container/20 flex items-center justify-center border border-primary/40">
                <span className="material-symbols-outlined text-primary text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
              </div>
              <span className="font-orbitron text-[10px] text-primary tracking-widest">NEXORA AI</span>
            </div>
            <div className="p-4 bg-surface-container-low border-l-2 border-primary-container rounded-r-xl rounded-bl-xl shadow-lg shadow-black/20">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </section>

      {/* Footer Controls */}
      <div className="flex flex-col gap-3 shrink-0">
        {canClose && (
           <button
             onClick={handleCloseSession}
             disabled={isLoading}
             className="w-full py-3 rounded-xl font-orbitron text-xs tracking-widest bg-tertiary/20 text-tertiary border border-tertiary/50 hover:bg-tertiary/30 transition-all flex items-center justify-center gap-2"
           >
             {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined">analytics</span>}
             CONCLUDE INTERVIEW & GENERATE REPORT
           </button>
        )}
        
        <div className="glass-panel border-outline-variant/30 rounded-full p-2 flex items-center gap-3 w-full">
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-variant/50 text-primary active:scale-95 transition-transform shrink-0">
            <span className="material-symbols-outlined">mic</span>
          </button>
          <div className="flex-1 relative">
            <input 
              className="w-full bg-transparent border-none outline-none text-body-md text-on-surface placeholder:text-outline/50" 
              placeholder="Type your answer... (Enter to send)" 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
              disabled={localLoading}
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={!input.trim() || localLoading}
            className={`w-10 h-10 flex items-center justify-center rounded-full shrink-0 transition-all ${input.trim() && !localLoading ? 'bg-primary-container text-on-primary glow-cyan active:scale-90' : 'bg-surface-variant text-outline'}`}
          >
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>send</span>
          </button>
        </div>
      </div>

    </div>
  )
}
