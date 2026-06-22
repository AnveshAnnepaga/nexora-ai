"use client"
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Search, Filter, Send, X } from 'lucide-react'

export default function InvestorsDirectoryPage() {
  const { isLoaded, user } = useUser()
  const [investors, setInvestors] = useState<any[]>([])
  const [ideas, setIdeas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const internalId = user?.publicMetadata?.internal_id as number | undefined

  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null)
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (isLoaded && internalId) {
      fetchData()
    }
  }, [isLoaded, internalId])

  const fetchData = async () => {
    try {
      const [invRes, ideasRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/investors/`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/ideas/my/${internalId}`)
      ])
      setInvestors(await invRes.json())
      setIdeas(await ideasRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContact = (investor: any) => {
    setSelectedInvestor(investor)
    setContactModalOpen(true)
  }

  const sendContactRequest = async () => {
    if (!selectedIdeaId || !message) return alert("Please select an idea and write a message.")
    setIsSending(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: internalId,
          receiver_id: selectedInvestor.user_id,
          idea_id: parseInt(selectedIdeaId),
          subject: "Investment Inquiry via NEXORA",
          message: message
        })
      })
      if (!res.ok) {
        const errorText = await res.text()
        alert("Failed to send message: " + errorText)
        throw new Error(errorText)
      }
      setContactModalOpen(false)
      setMessage('')
      setSelectedIdeaId('')
      alert("Message sent successfully!")
    } catch (e) {
      console.error(e)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-orbitron">Investors Directory</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="bg-[#111827] border border-[#1e2d47] rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary/50 outline-none w-64 text-white" placeholder="Search investors..." />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investors.map((inv) => (
          <motion.div key={inv.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111827] border border-[#1e2d47] rounded-xl p-5 flex flex-col relative group">
            <div className="flex gap-4 items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/50 overflow-hidden shrink-0">
                <img src={inv.profile_photo || `https://ui-avatars.com/api/?name=${inv.full_name}&background=random`} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">{inv.full_name}</h3>
                <p className="text-sm text-primary">{inv.fund_name}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-300 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-20 text-slate-500 text-xs font-semibold">STAGE</span>
                <span className="bg-[#1e2d47] px-2 py-0.5 rounded text-xs">{inv.stage_preference || 'Any'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 text-slate-500 text-xs font-semibold">SECTORS</span>
                <span className="truncate">{inv.investment_focus || 'Any'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 text-slate-500 text-xs font-semibold">TICKET</span>
                <span>{inv.ticket_size || 'N/A'}</span>
              </div>
            </div>

            <button onClick={() => handleContact(inv)} className="w-full mt-auto bg-primary/10 border border-primary/30 hover:bg-primary text-primary hover:text-[#0a0c14] font-medium py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Contact Investor
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {contactModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111827] border border-[#1e2d47] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
              <button onClick={() => setContactModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold text-white mb-1">Contact {selectedInvestor?.full_name}</h2>
              <p className="text-sm text-slate-400 mb-6">Send an investment inquiry to {selectedInvestor?.fund_name}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">SELECT IDEA TO SHARE</label>
                  <select value={selectedIdeaId} onChange={e => setSelectedIdeaId(e.target.value)} className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-2.5 text-white outline-none">
                    <option value="" disabled>-- Select an Idea --</option>
                    {ideas.map(i => <option key={i.id} value={i.id}>{i.title} (Score: {i.nexora_score})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">MESSAGE</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Hi, I'm reaching out because..." className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-2.5 text-white outline-none min-h-[120px]" />
                </div>
                <button onClick={sendContactRequest} disabled={isSending} className="w-full bg-primary hover:bg-primary/90 text-[#0a0c14] font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,212,255,0.4)] flex justify-center items-center gap-2">
                  {isSending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Message
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
