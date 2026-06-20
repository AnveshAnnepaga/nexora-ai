"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Mail, Briefcase, Star, Clock, FileText, Send, User } from 'lucide-react'

export default function InvestorDashboard() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const [activeTab, setActiveTab] = useState<'browse' | 'contacts' | 'inbox' | 'profile'>('browse')

  const [ideas, setIdeas] = useState<any[]>([])
  const [inbox, setInbox] = useState<any[]>([])
  const [sent, setSent] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const internalId = user?.publicMetadata?.internal_id as number | undefined

  // Contact Modal State
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [selectedFounderId, setSelectedFounderId] = useState<number | null>(null)
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null)
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) router.push('/')
      else if (user?.publicMetadata?.role !== 'investor') router.push('/dashboard')
      else {
        fetchData()
      }
    }
  }, [isLoaded, isSignedIn, user, router])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [ideasRes, inboxRes, sentRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/ideas/public`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/messages/inbox/${internalId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/messages/sent/${internalId}`)
      ])
      if (ideasRes.ok) setIdeas(await ideasRes.json())
      if (inboxRes.ok) setInbox(await inboxRes.json())
      if (sentRes.ok) setSent(await sentRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactFounder = (founderId: number, ideaId: number, ideaTitle: string) => {
    setSelectedFounderId(founderId)
    setSelectedIdeaId(ideaId)
    setContactSubject(`Interest in ${ideaTitle}`)
    setContactModalOpen(true)
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

  const sendContactRequest = async () => {
    if (!contactMessage) return alert("Please enter a message.")
    setIsSending(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: internalId,
          receiver_id: selectedFounderId,
          idea_id: selectedIdeaId,
          subject: contactSubject,
          message: contactMessage
        })
      })
      setContactModalOpen(false)
      setContactMessage('')
      alert("Message sent to founder!")
      fetchData() // refresh sent box
    } catch (e) {
      console.error(e)
    } finally {
      setIsSending(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] border-r border-[#1e2d47] p-4 flex flex-col">
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center font-black text-[#0a0c14]">N</div>
          <span className="font-orbitron font-bold text-lg text-primary drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]">INVESTOR HUB</span>
        </div>

        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('browse')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'browse' ? 'bg-primary/20 text-primary border border-primary/30 glow-cyan' : 'text-slate-400 hover:bg-[#1e2d47]'}`}>
            <Briefcase className="w-4 h-4" /> Browse Ideas
          </button>
          <button onClick={() => setActiveTab('contacts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'contacts' ? 'bg-primary/20 text-primary border border-primary/30 glow-cyan' : 'text-slate-400 hover:bg-[#1e2d47]'}`}>
            <Star className="w-4 h-4" /> My Contacts
          </button>
          <button onClick={() => setActiveTab('inbox')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'inbox' ? 'bg-primary/20 text-primary border border-primary/30 glow-cyan' : 'text-slate-400 hover:bg-[#1e2d47]'}`}>
            <Mail className="w-4 h-4" /> Messages Inbox
            {inbox.filter(m => !m.is_read).length > 0 && <span className="ml-auto bg-primary text-[#0a0c14] text-[10px] px-1.5 py-0.5 rounded-full">{inbox.filter(m => !m.is_read).length}</span>}
          </button>
          <button onClick={() => router.push('/profile/complete')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-slate-400 hover:bg-[#1e2d47]`}>
            <User className="w-4 h-4" /> Profile Settings
          </button>
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'browse' && (
            <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Startup Deal Flow</h1>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="bg-[#111827] border border-[#1e2d47] rounded-lg pl-9 pr-4 py-2 text-sm focus:border-purple-500 outline-none w-64" placeholder="Search startups..." />
                  </div>
                  <button className="flex items-center gap-2 bg-[#111827] border border-[#1e2d47] rounded-lg px-4 py-2 text-sm hover:bg-[#1e2d47]">
                    <Filter className="w-4 h-4" /> Filters
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ideas.map((idea) => (
                  <div key={idea.id} className="bg-[#111827] border border-[#1e2d47] rounded-xl p-5 hover:border-primary/50 transition-colors group relative">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-white mb-1 group-hover:text-primary transition-colors">{idea.title}</h3>
                        <span className="text-xs font-medium bg-[#1e2d47] text-slate-300 px-2 py-1 rounded-full">{idea.industry || 'Technology'}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-primary font-orbitron drop-shadow-[0_0_8px_rgba(0,212,255,0.6)]">{idea.nexora_score || 'N/A'}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Score</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-400 mb-4 line-clamp-3 h-16">{idea.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-4 border-b border-[#1e2d47]">
                      <div className="flex items-center gap-1"><User className="w-3 h-3" /> {idea.founder_name}</div>
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(idea.date_submitted).toLocaleDateString()}</div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleReadReport(idea.id)} className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg text-xs font-medium transition-colors flex justify-center items-center gap-2 border border-primary/30">
                        <FileText className="w-3 h-3" /> Read Report
                      </button>
                      <button onClick={() => handleContactFounder(idea.founder_id, idea.id, idea.title)} className="flex-1 bg-primary hover:bg-primary/90 text-[#0a0c14] py-2 rounded-lg text-xs font-medium transition-all flex justify-center items-center gap-2 shadow-[0_0_10px_rgba(0,212,255,0.4)]">
                        <Send className="w-3 h-3" /> Contact Founder
                      </button>
                    </div>
                  </div>
                ))}
                {ideas.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500">
                    No startups have completed analysis yet.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'inbox' && (
            <motion.div key="inbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold mb-8">Messages Inbox</h1>
              <div className="space-y-4">
                {inbox.map(msg => (
                  <div key={msg.id} className="bg-[#111827] border border-[#1e2d47] p-5 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold">{msg.sender_name}</span>
                        <span className="text-slate-500 text-sm ml-2">- {msg.subject}</span>
                      </div>
                      <span className="text-xs text-slate-500">{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-2 bg-[#0d1424] p-4 rounded-lg">{msg.message}</p>
                    <button onClick={() => {
                        setSelectedFounderId(msg.sender_id)
                        setSelectedIdeaId(msg.idea_id)
                        setContactSubject(msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`)
                        setContactModalOpen(true)
                    }} className="mt-4 text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2">
                      <Send className="w-4 h-4" /> Reply
                    </button>
                  </div>
                ))}
                {inbox.length === 0 && <p className="text-slate-500">Your inbox is empty.</p>}
              </div>
            </motion.div>
          )}

          {activeTab === 'contacts' && (
            <motion.div key="contacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold mb-8">My Contacts</h1>
              <div className="space-y-4">
                {sent.map(msg => (
                  <div key={msg.id} className="bg-[#111827] border border-[#1e2d47] p-5 rounded-xl flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-white mb-1">To: {msg.receiver_name ? msg.receiver_name.split(' ')[0] : 'Anonymous'}</h3>
                      <p className="text-sm text-slate-400">Subject: {msg.subject}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block mb-1">Sent {new Date(msg.timestamp).toLocaleDateString()}</span>
                      <span className="text-xs font-medium bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">Sent</span>
                    </div>
                  </div>
                ))}
                {sent.length === 0 && <p className="text-slate-500">You haven't contacted any founders yet.</p>}
              </div>
            </motion.div>
          )}

          {/* Profile block removed as it redirects directly to /profile/complete */}
        </AnimatePresence>

        <AnimatePresence>
          {contactModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111827] border border-[#1e2d47] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                <button onClick={() => setContactModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                <h2 className="text-xl font-bold text-white mb-1">Contact Founder</h2>
                <p className="text-sm text-slate-400 mb-6">Send an inquiry regarding their startup idea.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">SUBJECT</label>
                    <input value={contactSubject} onChange={e => setContactSubject(e.target.value)} className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-2.5 text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">MESSAGE</label>
                    <textarea value={contactMessage} onChange={e => setContactMessage(e.target.value)} placeholder="Hi, I'm an investor at..." className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-2.5 text-white outline-none min-h-[120px]" />
                  </div>
                  <button onClick={sendContactRequest} disabled={isSending} className="w-full bg-primary hover:bg-primary/90 text-[#0a0c14] font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,212,255,0.4)] flex justify-center items-center gap-2">
                    {isSending && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                    Send Message
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {reportModalOpen && selectedReport && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111827] border border-[#1e2d47] rounded-2xl p-8 w-full max-w-2xl shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar">
                <button onClick={() => setReportModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                <div className="flex justify-between items-start mb-6 border-b border-[#1e2d47] pb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{selectedReport.title}</h2>
                    <span className="text-xs font-medium bg-[#1e2d47] text-slate-300 px-3 py-1 rounded-full">{selectedReport.industry}</span>
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
                    <button onClick={() => {
                      setReportModalOpen(false)
                      handleContactFounder(selectedReport.founder_id, selectedReport.id, selectedReport.title)
                    }} className="flex-1 bg-primary hover:bg-primary/90 text-[#0a0c14] font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,212,255,0.4)] flex justify-center items-center gap-2">
                      <Send className="w-4 h-4" /> Contact Founder
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
