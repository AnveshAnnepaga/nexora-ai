"use client"
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import ReactMarkdown from 'react-markdown'
import { Send, Bot, User, Loader2, CheckCircle2, AlertTriangle, Zap } from 'lucide-react'

const DOMAINS = [
  { id: 'A', label: 'Problem Validation' },
  { id: 'B', label: 'Solution Depth' },
  { id: 'C', label: 'Market Opportunity' },
  { id: 'D', label: 'Business Model' },
  { id: 'E', label: 'Competition' },
  { id: 'F', label: 'Traction' },
  { id: 'G', label: 'Team & Execution' },
  { id: 'H', label: 'Financials & Funding' },
  { id: 'I', label: 'Risk & Failure Modes' },
  { id: 'J', label: 'Vision & Ambition' },
]

export default function InvestorChat() {
  const {
    intake, interrogationHistory, addInterrogationMessage,
    domainsCompleted, currentDomain,
    setPhase, setLoading, setError, completeInterrogation,
    isLoading
  } = useStore()

  const [input, setInput] = useState('')
  const [localLoading, setLocalLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [localDomains, setLocalDomains] = useState<string[]>([])
  const [localCurrentDomain, setLocalCurrentDomain] = useState('A')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [interrogationHistory, localLoading])

  // Auto-open with investor's first message
  useEffect(() => {
    if (!initialized && interrogationHistory.length === 0) {
      setInitialized(true)
      sendMessage("I'm ready to begin the evaluation session.")
    }
  }, [])

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return
    setLocalLoading(true)

    const userMsg = { role: 'user', content: userMessage }
    if (userMessage !== "I'm ready to begin the evaluation session.") {
      addInterrogationMessage(userMsg)
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/interrogate', {
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
    // Summarize the session and proceed to full analysis
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
      const res = await fetch('http://127.0.0.1:8000/api/v1/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...intake,
          interrogation_summary: summary,
          weak_zones: weakZones,
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

  const canClose = interrogationHistory.filter(m => m.role === 'user').length >= 5

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

      {/* Left: Domain Tracker */}
      <div className="space-y-3">
        <div className="ag-card p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Interrogation Domains
          </h3>
          <div className="space-y-1.5">
            {DOMAINS.map(({ id, label }) => {
              const isDone = localDomains.includes(id)
              const isCurrent = localCurrentDomain === id
              return (
                <div key={id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                  ${isDone ? 'bg-emerald-500/10 text-emerald-400' :
                    isCurrent ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20' :
                    'text-slate-500'}`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : isCurrent ? (
                    <span className="w-4 h-4 flex items-center justify-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full pulse-dot" />
                    </span>
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">{id}</span>
                  )}
                  <span className="font-medium">{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Progress */}
        <div className="ag-card p-4">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Domains covered</span>
            <span>{localDomains.length}/10</span>
          </div>
          <div className="w-full bg-[#1a2235] rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(localDomains.length / 10) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {canClose
              ? 'You may close the session when ready'
              : `Answer at least ${5 - interrogationHistory.filter(m => m.role === 'user').length} more questions`}
          </p>
        </div>

        {/* Close Button */}
        <AnimatePresence>
          {canClose && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleCloseSession}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Running 16 Agents...</>
              ) : (
                <><Zap className="w-4 h-4" /> Close Session & Analyze</>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Chat */}
      <div className="ag-card flex flex-col h-[640px]">
        {/* Header */}
        <div className="p-4 border-b border-[#1e2d47] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-100 text-sm">Senior Partner, ANTIGRAVITY Ventures</p>
            <p className="text-xs text-slate-500">20+ years evaluating startups at seed to Series B</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full pulse-dot" />
            <span className="text-xs text-emerald-400">Live Session</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {interrogationHistory.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'investor' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-[#1a2235] border border-[#1e2d47] text-slate-200 rounded-bl-sm'}`}
              >
                {msg.role === 'investor' ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-[#1a2235] border border-[#1e2d47] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>
          ))}
          {localLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-[#1a2235] border border-[#1e2d47] px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2 text-slate-400 text-sm italic">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Investor is reviewing...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[#1e2d47] flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            rows={2}
            placeholder="Answer the investor's questions... (Enter to send, Shift+Enter for new line)"
            className="flex-1 bg-[#0d1424] border border-[#1e2d47] text-slate-100 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || localLoading}
            className="w-12 bg-blue-600 hover:bg-blue-500 disabled:bg-[#1a2235] disabled:text-slate-600 text-white rounded-xl flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
