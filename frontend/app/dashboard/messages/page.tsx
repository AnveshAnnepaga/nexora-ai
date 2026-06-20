"use client"
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, Send, CheckCircle2 } from 'lucide-react'

export default function MessagesPage() {
  const { isLoaded, user } = useUser()
  const [inbox, setInbox] = useState<any[]>([])
  const [sent, setSent] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')
  const internalId = user?.publicMetadata?.internal_id as number | undefined

  // Contact Modal State
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null)
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null)
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (isLoaded && internalId) {
      fetchData()
    }
  }, [isLoaded, internalId])

  const fetchData = async () => {
    try {
      const [inboxRes, sentRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/messages/inbox/${internalId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/messages/sent/${internalId}`)
      ])
      setInbox(await inboxRes.json())
      setSent(await sentRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/messages/read/${id}`, { method: 'PATCH' })
      setInbox(inbox.map(m => m.id === id ? { ...m, is_read: true } : m))
    } catch (e) {
      console.error(e)
    }
  }

  const handleReply = (senderId: number, ideaId: number, originalSubject: string) => {
    setSelectedInvestorId(senderId)
    setSelectedIdeaId(ideaId)
    setContactSubject(originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`)
    setContactModalOpen(true)
  }

  const sendReply = async () => {
    if (!contactMessage) return alert("Please enter a message.")
    setIsSending(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: internalId,
          receiver_id: selectedInvestorId,
          idea_id: selectedIdeaId,
          subject: contactSubject,
          message: contactMessage
        })
      })
      setContactModalOpen(false)
      setContactMessage('')
      alert("Reply sent successfully!")
      fetchData()
    } catch (e) {
      console.error(e)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold font-orbitron mb-8">Messages</h1>

      <div className="flex gap-4 mb-6 border-b border-[#1e2d47] pb-2">
        <button onClick={() => setActiveTab('inbox')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-b-2 ${activeTab === 'inbox' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}>
          <Mail className="w-4 h-4" /> Inbox
          {inbox.filter(m => !m.is_read).length > 0 && (
            <span className="bg-primary text-[#0a0c14] text-[10px] px-1.5 py-0.5 rounded-full">{inbox.filter(m => !m.is_read).length}</span>
          )}
        </button>
        <button onClick={() => setActiveTab('sent')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-b-2 ${activeTab === 'sent' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}>
          <Send className="w-4 h-4" /> Sent
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'inbox' && (
          <motion.div key="inbox" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {inbox.map(msg => (
              <div key={msg.id} onClick={() => !msg.is_read && markAsRead(msg.id)} className={`bg-[#111827] border p-5 rounded-xl transition-all cursor-pointer ${msg.is_read ? 'border-[#1e2d47]' : 'border-primary/50 shadow-[0_0_15px_rgba(0,212,255,0.1)]'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    {!msg.is_read && <span className="w-2 h-2 bg-primary rounded-full glow-cyan"></span>}
                    <h3 className="font-bold text-white text-lg">{msg.sender_name}</h3>
                    <span className="text-slate-500 text-sm">{msg.subject}</span>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <div className="mt-4 bg-[#0d1424] p-4 rounded-lg border border-[#1e2d47]">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{msg.message}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReply(msg.sender_id, msg.idea_id, msg.subject)
                    }} 
                    className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20 transition-all"
                  >
                    <Send className="w-4 h-4" /> Reply
                  </button>
                </div>
              </div>
            ))}
            {inbox.length === 0 && <p className="text-slate-500 text-center py-10">Your inbox is empty.</p>}
          </motion.div>
        )}

        {activeTab === 'sent' && (
          <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {sent.map(msg => (
              <div key={msg.id} className="bg-[#111827] border border-[#1e2d47] p-5 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-bold text-white text-lg">To: {msg.receiver_name}</h3>
                    <span className="text-slate-500 text-sm">{msg.subject}</span>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <div className="mt-4 bg-[#0d1424] p-4 rounded-lg border border-[#1e2d47]">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))}
            {sent.length === 0 && <p className="text-slate-500 text-center py-10">You haven't sent any messages.</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contactModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111827] border border-[#1e2d47] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
              <button onClick={() => setContactModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
              <h2 className="text-xl font-bold text-white mb-1">Reply to Message</h2>
              <p className="text-sm text-slate-400 mb-6">Send a reply back directly.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">SUBJECT</label>
                  <input value={contactSubject} onChange={e => setContactSubject(e.target.value)} className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-2.5 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">MESSAGE</label>
                  <textarea value={contactMessage} onChange={e => setContactMessage(e.target.value)} placeholder="Type your reply here..." className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-2.5 text-white outline-none min-h-[120px]" />
                </div>
                <button onClick={sendReply} disabled={isSending} className="w-full bg-primary hover:bg-primary/90 text-[#0a0c14] font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,212,255,0.4)] flex justify-center items-center gap-2">
                  {isSending && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                  Send Reply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
