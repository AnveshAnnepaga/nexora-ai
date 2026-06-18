"use client"
import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'
import { useStore } from '@/store/useStore'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Loader2, Send } from 'lucide-react'
import NegotiationChat from './NegotiationChat'

// Helper to fix weird markdown from local LLMs
const preprocessMarkdown = (text: string) => {
  if (!text) return "";
  // Replace ++Bold++ with **Bold**
  return text.replace(/\+\+([^+]+)\+\+/g, '**$1**');
}

export default function Dashboard() {
  const [input, setInput] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const { isLoading, setLoading, setResults, startupContext, businessValidation, marketIntelligence, strategy, investorFeedback } = useStore()

  const handleEvaluate = async () => {
    if (!input) return;
    setLoading(true)
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: input })
      })
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      const formData = new FormData()
      formData.append("file", selectedFile)

      try {
        await fetch("http://127.0.0.1:8000/api/v1/upload", {
          method: "POST",
          body: formData
        })
        alert("Pitch Video/Document uploaded successfully for Context Analysis!")
      } catch (error) {
        console.error(error)
      }
    }
  }

  const MarkdownCard = ({ title, content }: { title: string, content: string }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="shadow-lg border-slate-200 bg-white">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="text-xl font-bold text-slate-800">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-blue-600">
            <ReactMarkdown>{preprocessMarkdown(content)}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">AI Startup Accelerator</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Validate your business model, analyze market trends, and get investor-ready with an Agentic AI team.</p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="shadow-xl border-slate-200 bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-2xl text-slate-800">1. Pitch Your Startup</CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Startup Description</label>
              <Textarea 
                className="min-h-[120px] text-base resize-y bg-slate-50 border-slate-300 focus:ring-blue-500"
                placeholder="What problem are you solving? Who is your target market? What is your unique solution?" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
              <div className="w-full md:w-auto">
                <label htmlFor="file-upload" className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors border border-slate-300 border-dashed">
                  <Video className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{file ? file.name : "Upload Pitch Video (.mp4, .mov)"}</span>
                  <input id="file-upload" type="file" accept="video/mp4,video/quicktime,application/pdf" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              
              <Button 
                onClick={handleEvaluate} 
                disabled={isLoading || !input}
                size="lg"
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-md"
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

      <AnimatePresence>
        {startupContext && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
            <MarkdownCard 
              title="Startup Profile Extraction" 
              content={"```json\n" + JSON.stringify(startupContext, null, 2) + "\n```"} 
            />
            
            {businessValidation && (
              <MarkdownCard 
                title="Business Validation" 
                content={businessValidation.evaluation} 
              />
            )}

            {marketIntelligence && (
              <MarkdownCard 
                title="Market Intelligence" 
                content={marketIntelligence.market_analysis} 
              />
            )}

            {strategy && (
              <div className="space-y-4">
                <MarkdownCard 
                  title="Executive Strategy" 
                  content={strategy.executive_summary || strategy.strategy || JSON.stringify(strategy)} 
                />
                {strategy.ppt_path && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 font-medium flex items-center justify-between shadow-sm">
                    <span>🎉 Pitch Deck Generated Successfully!</span>
                    <span className="text-sm bg-white px-3 py-1 rounded border border-blue-100">{strategy.ppt_path}</span>
                  </div>
                )}
              </div>
            )}
            
            {investorFeedback && (
              <div className="lg:col-span-2">
                <MarkdownCard 
                  title="Investor Thesis & Feedback" 
                  content={investorFeedback.feedback || JSON.stringify(investorFeedback)} 
                />
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
      
      {investorFeedback && <NegotiationChat />}
    </div>
  )
}
