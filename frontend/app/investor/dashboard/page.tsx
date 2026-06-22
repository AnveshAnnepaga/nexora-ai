"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Mail, Briefcase, Star, Clock, FileText, Send, User, Loader2, MessageSquare, Bell } from 'lucide-react'

function getAvatarColor(name: string): string {
  const colors = ['bg-violet-600','bg-emerald-600','bg-rose-600','bg-amber-600','bg-sky-600','bg-pink-600','bg-teal-600','bg-orange-600']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
function ChatAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w: string) => w[0]).slice(0,2).join('').toUpperCase()
  return <div className={`w-10 h-10 ${getAvatarColor(name)} rounded-full flex items-center justify-center font-bold text-white shrink-0 text-sm`}>{initials}</div>
}

export default function InvestorDashboard() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const [activeTab, setActiveTab] = useState<'browse' | 'messages' | 'profile'>('browse')

  const [ideas, setIdeas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const internalId = user?.publicMetadata?.internal_id as number | undefined

  // Notification states
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  // Chat State
  const [chatContacts, setChatContacts] = useState<any[]>([])
  const [activeChatId, setActiveChatId] = useState<number | null>(null)
  const [chatThread, setChatThread] = useState<any[]>([])
  const [chatMessage, setChatMessage] = useState('')
  const [isSendingChat, setIsSendingChat] = useState(false)
  const [isLoadingThread, setIsLoadingThread] = useState(false)
  const [chatSearch, setChatSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Contact Founder Modal
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

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const ideasRes = await fetch(`${API}/api/v1/ideas/public`)
      if (ideasRes.ok) setIdeas(await ideasRes.json())
    } catch (e) { console.error(e) } finally { setIsLoading(false) }
  }

  const fetchChatContacts = async () => {
    if (!internalId) return
    try {
      const res = await fetch(`${API}/api/v1/messages/contacts/${internalId}`)
      if (res.ok) setChatContacts(await res.json())
    } catch (e) { console.error(e) }
  }

  const fetchChatThread = async (contactId: number, showLoading = true) => {
    if (!internalId) return
    if (showLoading) setIsLoadingThread(true)
    try {
      const res = await fetch(`${API}/api/v1/messages/thread/${internalId}/${contactId}`)
      if (res.ok) { const data = await res.json(); setChatThread(prev => prev.length !== data.length || showLoading ? data : prev) }
    } catch (e) { console.error(e) } finally { if (showLoading) setIsLoadingThread(false) }
  }

  useEffect(() => {
    if (activeChatId && internalId) {
      fetchChatThread(activeChatId, true)
      const ci = setInterval(() => fetchChatThread(activeChatId, false), 4000)
      return () => clearInterval(ci)
    } else {
      setChatThread([])
    }
  }, [activeChatId, internalId])

  useEffect(() => {
    if (internalId) {
      fetch(`${API}/api/v1/notifications/count/${internalId}`)
        .then(res => res.json())
        .then(data => setUnreadCount(data.unread_count))
        .catch(console.error)
    }
  }, [internalId])

  const handleNotificationClick = async () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications && internalId) {
      try {
        const res = await fetch(`${API}/api/v1/notifications/${internalId}`)
        const data = await res.json()
        setNotifications(data)
        
        data.filter((n: any) => !n.is_read).forEach(async (n: any) => {
          await fetch(`${API}/api/v1/notifications/read/${n.id}`, { method: 'PATCH' })
        })
        setUnreadCount(0)
      } catch (e) {
        console.error(e)
      }
    }
  }
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatThread])

  useEffect(() => {
    if (activeTab === 'messages' && internalId) {
      fetchChatContacts()
      const ci = setInterval(fetchChatContacts, 8000)
      return () => clearInterval(ci)
    }
  }, [activeTab, internalId])

  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!chatMessage.trim() || !activeChatId || !internalId) return
    setIsSendingChat(true)
    const text = chatMessage.trim(); setChatMessage('')
    try {
      const res = await fetch(`${API}/api/v1/messages/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: internalId, receiver_id: activeChatId, subject: 'Chat', message: text }) })
      if (!res.ok) {
        const errorText = await res.text()
        console.error("Backend error response:", errorText)
        alert("Failed to send message: " + errorText)
        throw new Error(errorText)
      }
      fetchChatThread(activeChatId, false); fetchChatContacts()
    } catch (e) { console.error(e) } finally { setIsSendingChat(false) }
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
          <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'messages' ? 'bg-primary/20 text-primary border border-primary/30 glow-cyan' : 'text-slate-400 hover:bg-[#1e2d47]'}`}>
            <MessageSquare className="w-4 h-4" /> Messages
            {chatContacts.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0) > 0 && <span className="ml-auto bg-primary text-[#0a0c14] text-[10px] px-1.5 py-0.5 rounded-full">{chatContacts.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0)}</span>}
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
            <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
              
              {/* Top Navigation / Notification Bar */}
              <div className="absolute right-0 top-0 flex items-center gap-4 z-50">
                <button onClick={handleNotificationClick} className="relative p-2 text-slate-400 hover:text-white transition-colors bg-[#111827] border border-[#1e2d47] rounded-full">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full glow-cyan border-2 border-[#111827]"></span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-12 right-0 w-80 bg-[#111827] border border-[#1e2d47] rounded-2xl shadow-2xl overflow-hidden z-50">
                      <div className="p-4 border-b border-[#1e2d47] bg-[#0d1424]">
                        <h3 className="font-bold text-white">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-slate-500">No notifications yet</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className={`p-4 border-b border-[#1e2d47]/50 text-sm ${!n.is_read ? 'bg-primary/5' : ''}`}>
                              <p className="text-slate-200 mb-1 leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(n.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between mb-8 pr-16">
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

          {activeTab === 'messages' && (
            <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[calc(100vh-120px)] flex rounded-2xl overflow-hidden border border-[#1e2d47] shadow-2xl">
              {/* Left Sidebar */}
              <div className={`flex flex-col bg-[#111827] border-r border-[#1e2d47] w-[300px] shrink-0 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-[#1e2d47] bg-[#0d1424]">
                  <h2 className="font-bold text-white mb-3">Conversations</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={chatSearch} onChange={e => setChatSearch(e.target.value)} placeholder="Search..." className="w-full bg-[#1e2d47] text-white text-sm pl-9 pr-4 py-2 rounded-lg outline-none placeholder:text-slate-500" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {chatContacts.filter((c: any) => c.contact_name.toLowerCase().includes(chatSearch.toLowerCase())).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6 text-center">
                      <MessageSquare className="w-8 h-8 opacity-40 mb-2" />
                      <p className="text-sm">No conversations yet</p>
                    </div>
                  ) : chatContacts.filter((c: any) => c.contact_name.toLowerCase().includes(chatSearch.toLowerCase())).map((contact: any) => (
                    <div key={contact.contact_id} onClick={() => setActiveChatId(contact.contact_id)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b border-[#1e2d47]/40 hover:bg-[#1a253a] ${activeChatId === contact.contact_id ? 'bg-[#1a253a]' : ''}`}>
                      <ChatAvatar name={contact.contact_name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="font-semibold text-white text-sm truncate">{contact.contact_name}</span>
                          <span className={`text-[11px] shrink-0 ml-2 ${contact.unread_count > 0 ? 'text-primary font-semibold' : 'text-slate-500'}`}>{new Date(contact.latest_timestamp).toLocaleDateString(undefined, {month:'short',day:'numeric'})}</span>
                        </div>
                        <div className="flex justify-between items-center mt-0.5">
                          <p className="text-xs text-slate-400 truncate pr-2">{contact.latest_message}</p>
                          {contact.unread_count > 0 && <span className="shrink-0 bg-primary text-[#0a0c14] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{contact.unread_count}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Right Chat */}
              <div className={`flex-1 flex flex-col min-w-0 bg-[#0a0c14] ${!activeChatId ? 'hidden md:flex' : 'flex'}`}
                style={{backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e2d47' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}>
                {!activeChatId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <div className="w-16 h-16 rounded-full bg-[#1e2d47]/60 flex items-center justify-center mb-4"><MessageSquare className="w-7 h-7 text-slate-400" /></div>
                    <p className="text-sm">Select a conversation to chat</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#111827] border-b border-[#1e2d47] shrink-0">
                      <button onClick={() => setActiveChatId(null)} className="md:hidden text-slate-400 hover:text-white mr-1"><span className="material-symbols-outlined text-xl">arrow_back_ios</span></button>
                      {chatContacts.find((c: any) => c.contact_id === activeChatId) && <ChatAvatar name={chatContacts.find((c: any) => c.contact_id === activeChatId).contact_name} />}
                      <div>
                        <h2 className="font-semibold text-white leading-tight">{chatContacts.find((c: any) => c.contact_id === activeChatId)?.contact_name}</h2>
                        <p className="text-[11px] text-slate-400 capitalize">{chatContacts.find((c: any) => c.contact_id === activeChatId)?.contact_role}</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                      {isLoadingThread ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
                        <>
                          {chatThread.length === 0 && <div className="flex justify-center py-10"><span className="text-xs bg-[#1e2d47]/80 text-slate-400 px-4 py-2 rounded-full">Start the conversation!</span></div>}
                          {chatThread.map((msg: any, i: number) => {
                            const isMe = msg.sender_id === internalId
                            const prev = chatThread[i - 1]
                            const showDate = i === 0 || new Date(msg.timestamp).toDateString() !== new Date(prev.timestamp).toDateString()
                            return (
                              <div key={msg.id}>
                                {showDate && <div className="flex justify-center my-4"><span className="text-[11px] bg-[#1e2d47]/90 text-slate-300 px-3 py-1 rounded-full">{new Date(msg.timestamp).toLocaleDateString(undefined, {weekday:'long',month:'long',day:'numeric'})}</span></div>}
                                <div className={`flex mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-primary text-[#0a0c14] rounded-br-sm' : 'bg-[#1e2d47] text-slate-100 rounded-bl-sm'}`}>
                                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                    <span className={`text-[10px] mt-1 flex justify-end ${isMe ? 'text-[#0a0c14]/60' : 'text-slate-500'}`}>{new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} {isMe && (msg.is_read ? '✓✓' : '✓')}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>
                    <div className="shrink-0 bg-[#111827] border-t border-[#1e2d47] px-4 py-3">
                      <form onSubmit={sendChatMessage} className="flex items-center gap-3">
                        <input value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Type a message" className="flex-1 bg-[#1e2d47] text-white text-sm px-5 py-3 rounded-full outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary/40" />
                        <button type="submit" disabled={!chatMessage.trim() || isSendingChat} className="w-11 h-11 rounded-full bg-primary hover:bg-primary/90 text-[#0a0c14] flex items-center justify-center shrink-0 disabled:opacity-40 transition-all">
                          {isSendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                        </button>
                      </form>
                    </div>
                  </>
                )}
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
