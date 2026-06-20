"use client"
import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'
import { useStore } from '@/store/useStore'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Loader2, Send, AlertCircle, CheckCircle2, RefreshCw, Upload } from 'lucide-react'
import NegotiationChat from './NegotiationChat'

// Fix LLM markdown quirks (e.g. ++Bold++ → **Bold**)
const preprocessMarkdown = (text: string) => {
  if (!text) return ""
  return text.replace(/\+\+([^+]+)\+\+/g, '**$1**')
}

const AGENT_STEPS = [
  "📋 Agent 1: Extracting Startup Profile...",
  "✅ Agent 2: Validating Business Model...",
  "📊 Agent 3: Researching Market Intelligence...",
  "🎥 Agent 4: Analyzing Founder Profile...",
  "🗺️ Agent 5: Building Strategy Plan...",
  "💼 Agent 6: Running Investor Evaluation...",
  "📄 Agent 7: Generating Executive Report...",
]

export default function Dashboard() {
  const [input, setInput] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const {
    isLoading, setLoading, setResults,
    startupContext, businessValidation, marketIntelligence,
    strategy, investorFeedback, founderAnalysis
  } = useStore()

  // Cycle through agent steps while loading
  const startAgentProgress = () => {
    setCurrentStep(0)
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= AGENT_STEPS.length - 1) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 4000)
    return interval
  }

  const handleEvaluate = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    setResults({ startup_context: null, business_validation: null, market_intelligence: null, founder_analysis: null, investor_feedback: null, strategy: null })

    const progressInterval = startAgentProgress()

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: input })
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }))
        const msg = typeof errData.detail === 'string'
          ? errData.detail
          : JSON.stringify(errData.detail)
        throw new Error(msg)
      }

      const data = await response.json()
      setResults(data)
    } catch (err: any) {
      clearInterval(progressInterval)
      const message = err.message || "Unknown error"
      if (message.includes("fetch") || message.includes("network") || message.includes("Failed to fetch")) {
        setError("⚠️ Cannot connect to the backend server. Make sure it is running on port 8000.\n\nRun: uvicorn backend.main:app --reload --port 8000")
      } else if (message.includes("Connection timeout") || message.includes("522")) {
        setError("⏱️ The AI service (Groq) timed out. This can happen during high traffic. Please try again in a moment.")
      } else {
        setError(`❌ Evaluation failed: ${message}`)
      }
      console.error("Evaluate error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setUploadStatus('uploading')

    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/upload`, {
        method: "POST",
        body: formData
      })
      if (!res.ok) throw new Error("Upload failed")
      setUploadStatus('done')
    } catch {
      setUploadStatus('error')
    }
  }

  const MarkdownCard = ({
    title, content, accent = "blue"
  }: {
    title: string
    content: string
    accent?: "blue" | "green" | "purple" | "orange"
  }) => {
    const colors: Record<string, string> = {
      blue: "from-blue-600 to-blue-800",
      green: "from-emerald-500 to-emerald-700",
      purple: "from-purple-600 to-purple-800",
      orange: "from-orange-500 to-orange-700",
    }
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="shadow-lg border-0 overflow-hidden h-full">
          <CardHeader className={`bg-gradient-to-r ${colors[accent]} text-white py-4`}>
            <CardTitle className="text-lg font-bold">{title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 pb-6">
            <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-a:text-blue-600 prose-strong:text-slate-800">
              <ReactMarkdown>{preprocessMarkdown(content)}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const hasResults = startupContext && !isLoading

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">

      {/* Header */}
      <div className="text-center space-y-3 py-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          AI Startup Accelerator
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Validate your business model, analyze market trends, and get investor-ready with a 7-agent AI team.
        </p>
      </div>

      {/* Input Card */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="shadow-xl border-slate-200 bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
            <CardTitle className="text-xl">1. Pitch Your Startup</CardTitle>
            <p className="text-slate-300 text-sm mt-1">
              Describe your idea — problem, solution, and target market. The more detail, the better the analysis.
            </p>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Startup Description</label>
              <Textarea
                className="min-h-[140px] text-base resize-y bg-slate-50 border-slate-300 focus:ring-2 focus:ring-blue-500"
                placeholder="Example: We are building SkillSync, an AI platform that helps companies upskill employees with personalized learning paths. The problem is 70% of employees feel training is irrelevant. Our solution auto-maps skill gaps and creates tailored microlearning. Target: HR managers at enterprises with 500+ employees."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) handleEvaluate()
                }}
              />
              <p className="text-xs text-slate-400">Tip: Press Ctrl+Enter to evaluate</p>
            </div>

            {/* File Upload */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <label
                htmlFor="file-upload"
                className={`flex items-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-all border border-dashed text-sm font-medium w-full md:w-auto
                  ${uploadStatus === 'done' ? 'bg-green-50 border-green-400 text-green-700' :
                    uploadStatus === 'error' ? 'bg-red-50 border-red-300 text-red-600' :
                    uploadStatus === 'uploading' ? 'bg-blue-50 border-blue-300 text-blue-600 animate-pulse' :
                    'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'}`}
              >
                {uploadStatus === 'done' ? (
                  <><CheckCircle2 className="w-4 h-4" /> {file?.name} — Uploaded ✓</>
                ) : uploadStatus === 'uploading' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading & processing...</>
                ) : uploadStatus === 'error' ? (
                  <><AlertCircle className="w-4 h-4" /> Upload failed — try again</>
                ) : (
                  <><Upload className="w-4 h-4 text-blue-600" /> Upload Pitch Video or PDF (optional)</>
                )}
                <input
                  id="file-upload"
                  type="file"
                  accept="video/mp4,video/quicktime,application/pdf,.txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <Button
                onClick={handleEvaluate}
                disabled={isLoading || !input.trim()}
                size="lg"
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 shadow-md"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing 7 Agents...</>
                ) : (
                  <><Send className="w-5 h-5 mr-2" /> Evaluate Startup</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agent Progress Indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="font-semibold text-blue-800">Running AI Agent Pipeline...</span>
            </div>
            <p className="text-blue-700 font-medium">{AGENT_STEPS[currentStep]}</p>
            <div className="flex gap-1 justify-center mt-3">
              {AGENT_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i <= currentStep ? 'bg-blue-500 w-8' : 'bg-blue-200 w-4'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-blue-400 mt-2">This takes 30–90 seconds. Please wait...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-5"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-800 mb-1">Something went wrong</p>
                <pre className="text-sm text-red-700 whitespace-pre-wrap font-sans">{error}</pre>
              </div>
            </div>
            <Button
              onClick={handleEvaluate}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Grid */}
      <AnimatePresence>
        {hasResults && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-slate-800">Evaluation Complete</h2>
            </div>

            {/* Row 1: Profile + Validation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {startupContext && (
                <MarkdownCard
                  title="📋 Startup Profile"
                  accent="blue"
                  content={"```json\n" + JSON.stringify(startupContext, null, 2) + "\n```"}
                />
              )}
              {businessValidation?.evaluation && (
                <MarkdownCard
                  title="✅ Business Validation"
                  accent="green"
                  content={businessValidation.evaluation}
                />
              )}
            </div>

            {/* Row 2: Market + Founder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {marketIntelligence?.market_analysis && (
                <MarkdownCard
                  title="📊 Market Intelligence"
                  accent="purple"
                  content={marketIntelligence.market_analysis}
                />
              )}
              {founderAnalysis?.analysis && (
                <MarkdownCard
                  title="🎥 Founder Analysis"
                  accent="orange"
                  content={founderAnalysis.analysis}
                />
              )}
            </div>

            {/* Row 3: Strategy (full width) */}
            {strategy && (
              <div className="space-y-4">
                <MarkdownCard
                  title="📄 Executive Strategy & Report"
                  accent="blue"
                  content={strategy.executive_summary || strategy.strategy || JSON.stringify(strategy)}
                />
                {strategy.ppt_path && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 font-medium flex items-center justify-between shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      PowerPoint Pitch Deck Generated!
                    </span>
                    <span className="text-sm bg-white px-3 py-1 rounded-lg border border-green-200 font-mono text-green-700">
                      {strategy.ppt_path}
                    </span>
                  </motion.div>
                )}
              </div>
            )}

            {/* Row 4: Investor Verdict (full width) */}
            {investorFeedback?.feedback && (
              <MarkdownCard
                title="💼 Investor Verdict & Thesis"
                accent="orange"
                content={investorFeedback.feedback}
              />
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Negotiation Section */}
      {investorFeedback && !isLoading && <NegotiationChat />}
    </div>
  )
}
