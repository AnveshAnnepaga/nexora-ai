"use client"
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { Loader2, Eye, EyeOff, Trash2, FileText, Download } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function MyIdeasPage() {
  const { isLoaded, user } = useUser()
  const router = useRouter()
  const [ideas, setIdeas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const internalId = user?.publicMetadata?.internal_id as number | undefined

  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)

  useEffect(() => {
    if (isLoaded && internalId) {
      fetchIdeas()
    }
  }, [isLoaded, internalId])

  const fetchIdeas = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/ideas/my/${internalId}`)
      const data = await res.json()
      setIdeas(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleVisibility = async (id: number, current: string) => {
    const newVis = current === 'public' ? 'private' : 'public'
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/ideas/visibility/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: newVis })
      })
      setIdeas(ideas.map(i => i.id === id ? { ...i, visibility: newVis } : i))
    } catch (e) {
      console.error(e)
    }
  }

  const deleteIdea = async (id: number) => {
    if (!confirm('Are you sure you want to delete this idea?')) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/ideas/${id}`, { method: 'DELETE' })
      setIdeas(ideas.filter(i => i.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  const handleReadReport = async (ideaId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/ideas/${ideaId}`)
      if (res.ok) {
        setSelectedReport(await res.json())
        setReportModalOpen(true)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const downloadPitchDeck = () => {
    if (!selectedReport) return;
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/ideas/${selectedReport.id}/pitch-deck/pdf`, '_blank');
  }

  if (isLoading) return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-orbitron">My Ideas</h1>
        <button onClick={() => router.push('/dashboard')} className="bg-primary/10 text-primary border border-primary/30 px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/20 transition-all glow-cyan">
          Analyze New Idea
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.map((idea) => (
          <motion.div key={idea.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111827] border border-[#1e2d47] rounded-xl p-5 flex flex-col relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-white mb-1">{idea.title}</h3>
                <span className="text-xs font-medium bg-[#1e2d47] text-slate-300 px-2 py-1 rounded-full">{idea.industry || 'Tech'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-primary drop-shadow-[0_0_8px_rgba(0,212,255,0.6)] font-orbitron">{idea.nexora_score || 0}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Score</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-b border-[#1e2d47] pb-4 mb-4">
              <span>{new Date(idea.date_submitted).toLocaleDateString()}</span>
              {idea.contact_requests > 0 && (
                <span className="text-primary">{idea.contact_requests} Contact Request(s)</span>
              )}
            </div>

            <div className="flex gap-2 mt-auto">
              <button onClick={() => toggleVisibility(idea.id, idea.visibility)} className={`flex-1 py-2 rounded-lg text-xs font-medium flex justify-center items-center gap-2 border transition-all ${idea.visibility === 'public' ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-slate-500/30 text-slate-400 hover:bg-slate-500/10'}`}>
                {idea.visibility === 'public' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {idea.visibility === 'public' ? 'Public' : 'Private'}
              </button>
              <button onClick={() => handleReadReport(idea.id)} className="flex-1 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary py-2 rounded-lg text-xs font-medium flex justify-center items-center gap-2 transition-all">
                <FileText className="w-3 h-3" /> Report
              </button>
              <button onClick={() => deleteIdea(idea.id)} className="w-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg text-xs flex justify-center items-center transition-all border border-red-500/20">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
        {ideas.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-[#1e2d47] rounded-xl bg-[#111827]/50">
            You haven't analyzed any ideas yet. <br/><br/>
            <button onClick={() => router.push('/dashboard')} className="text-primary hover:underline">Start an analysis</button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {reportModalOpen && selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111827] border border-[#1e2d47] rounded-2xl p-8 w-full max-w-2xl shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar">
              <button onClick={() => setReportModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
              <div className="flex justify-between items-start mb-6 border-b border-[#1e2d47] pb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedReport.title}</h2>
                  <span className="text-xs font-medium bg-[#1e2d47] text-slate-300 px-3 py-1 rounded-full">{selectedReport.industry || 'Technology'}</span>
                </div>
                <div className="text-center bg-primary/10 border border-primary/30 p-3 rounded-xl min-w-[100px]">
                  <span className="text-3xl font-black text-primary font-orbitron block leading-none">{selectedReport.nexora_score}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Score</span>
                </div>
              </div>

              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Core Concept</h3>
                  <p className="text-slate-200 text-sm leading-relaxed bg-[#0d1424] p-4 rounded-xl border border-[#1e2d47]">{selectedReport.description}</p>
                </section>
                
                {selectedReport.reports_json?.swot && (
                  <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">AI SWOT Analysis</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#0d1424] p-4 rounded-xl border border-[#1e2d47] border-l-4 border-l-emerald-500">
                        <h4 className="font-bold text-emerald-400 text-xs mb-2">STRENGTHS</h4>
                        <ul className="text-xs text-slate-300 list-disc pl-4 space-y-1">
                          {selectedReport.reports_json.swot.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div className="bg-[#0d1424] p-4 rounded-xl border border-[#1e2d47] border-l-4 border-l-red-500">
                        <h4 className="font-bold text-red-400 text-xs mb-2">WEAKNESSES</h4>
                        <ul className="text-xs text-slate-300 list-disc pl-4 space-y-1">
                          {selectedReport.reports_json.swot.weaknesses?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    </div>
                  </section>
                )}

                <div className="flex gap-4 mt-8 pt-6 border-t border-[#1e2d47]">
                  <button onClick={downloadPitchDeck} className="flex-1 bg-primary hover:bg-primary/90 text-[#0a0c14] font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,212,255,0.4)] flex justify-center items-center gap-2">
                    <Download className="w-4 h-4" /> Download Pitch Deck
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
