"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { Loader2, Send, Search, MessageSquare } from 'lucide-react'

interface Contact {
  contact_id: number;
  contact_name: string;
  contact_role: string;
  latest_message: string;
  latest_timestamp: string;
  unread_count: number;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  timestamp: string;
  is_read: boolean;
}

// Generate a consistent color from a name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-violet-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600',
    'bg-sky-600', 'bg-pink-600', 'bg-teal-600', 'bg-orange-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const color = getAvatarColor(name)
  const sizeClass = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-base'
  return (
    <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-bold text-white shrink-0`}>
      {initials}
    </div>
  )
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatSidebarTime(ts: string) {
  const date = new Date(ts)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) return formatTime(ts)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function MessagesPage() {
  const { isLoaded, user } = useUser()
  const internalId = user?.publicMetadata?.internal_id as number | undefined

  const [contacts, setContacts] = useState<Contact[]>([])
  const [activeContactId, setActiveContactId] = useState<number | null>(null)
  const [thread, setThread] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoadingContacts, setIsLoadingContacts] = useState(true)
  const [isLoadingThread, setIsLoadingThread] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

  const fetchContacts = async () => {
    if (!internalId) return
    try {
      const res = await fetch(`${API}/api/v1/messages/contacts/${internalId}`)
      if (res.ok) setContacts(await res.json())
    } catch (e) {
      console.error("Failed to fetch contacts", e)
    } finally {
      setIsLoadingContacts(false)
    }
  }

  const fetchThread = async (contactId: number, showLoading = true) => {
    if (!internalId) return
    if (showLoading) setIsLoadingThread(true)
    try {
      const res = await fetch(`${API}/api/v1/messages/thread/${internalId}/${contactId}`)
      if (res.ok) {
        const data = await res.json()
        setThread(prev => {
          if (prev.length !== data.length || showLoading) return data
          return prev
        })
      }
    } catch (e) {
      console.error("Failed to fetch thread", e)
    } finally {
      if (showLoading) setIsLoadingThread(false)
    }
  }

  useEffect(() => {
    if (isLoaded && internalId) {
      fetchContacts()
      const interval = setInterval(fetchContacts, 8000)
      return () => clearInterval(interval)
    }
  }, [isLoaded, internalId])

  useEffect(() => {
    if (activeContactId && internalId) {
      fetchThread(activeContactId, true)
      inputRef.current?.focus()
      const interval = setInterval(() => fetchThread(activeContactId, false), 4000)
      return () => clearInterval(interval)
    } else {
      setThread([])
    }
  }, [activeContactId, internalId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newMessage.trim() || !activeContactId || !internalId) return
    setIsSending(true)
    const msgText = newMessage.trim()
    setNewMessage('')
    try {
      const res = await fetch(`${API}/api/v1/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: internalId, receiver_id: activeContactId, subject: 'Chat', message: msgText })
      })
      if (!res.ok) {
        const errorText = await res.text()
        console.error("Backend error response:", errorText)
        alert("Failed to send message: " + errorText)
        throw new Error(errorText)
      }
      fetchThread(activeContactId, false)
      fetchContacts()
    } catch (e) {
      console.error("Send failed", e)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.contact_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilter === 'all' || (activeFilter === 'unread' && c.unread_count > 0)
    return matchesSearch && matchesFilter
  })

  const activeContact = contacts.find(c => c.contact_id === activeContactId)

  if (isLoadingContacts) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col px-4 pb-4 pt-0">
      {/* Header */}
      <div className="py-4 shrink-0">
        <h1 className="text-2xl font-bold font-orbitron text-white">Messages</h1>
      </div>

      {/* Main chat layout */}
      <div className="flex-1 flex rounded-2xl overflow-hidden border border-[#1e2d47] shadow-2xl min-h-0">

        {/* ── Left Sidebar ── */}
        <div className={`flex flex-col bg-[#111827] border-r border-[#1e2d47] w-full md:w-[340px] shrink-0 ${activeContactId ? 'hidden md:flex' : 'flex'}`}>

          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#1e2d47] bg-[#0d1424] shrink-0">
            <h2 className="text-lg font-bold text-white mb-3">Chats</h2>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search or start new chat"
                className="w-full bg-[#1e2d47] text-white text-sm pl-9 pr-4 py-2.5 rounded-lg outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>
            {/* Filters */}
            <div className="flex gap-2 mt-3">
              {(['all', 'unread'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${activeFilter === f ? 'bg-primary text-[#0a0c14]' : 'bg-[#1e2d47] text-slate-400 hover:text-white'}`}
                >
                  {f}
                  {f === 'unread' && contacts.filter(c => c.unread_count > 0).length > 0 && (
                    <span className="ml-1 text-[10px]">({contacts.filter(c => c.unread_count > 0).length})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 p-6 text-center">
                <MessageSquare className="w-10 h-10 opacity-40" />
                <p className="text-sm">{searchQuery ? 'No contacts found' : 'No conversations yet'}</p>
              </div>
            ) : (
              filteredContacts.map(contact => (
                <div
                  key={contact.contact_id}
                  onClick={() => setActiveContactId(contact.contact_id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b border-[#1e2d47]/40 hover:bg-[#1a253a] ${activeContactId === contact.contact_id ? 'bg-[#1a253a]' : ''}`}
                >
                  <Avatar name={contact.contact_name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-white text-sm truncate">{contact.contact_name}</span>
                      <span className={`text-[11px] shrink-0 ml-2 ${contact.unread_count > 0 ? 'text-primary font-semibold' : 'text-slate-500'}`}>
                        {formatSidebarTime(contact.latest_timestamp)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className="text-xs text-slate-400 truncate pr-2">{contact.latest_message}</p>
                      {contact.unread_count > 0 && (
                        <span className="shrink-0 bg-primary text-[#0a0c14] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {contact.unread_count}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-600 capitalize">{contact.contact_role}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right Chat Window ── */}
        <div className={`flex-1 flex flex-col min-w-0 ${!activeContactId ? 'hidden md:flex' : 'flex'}`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e2d47' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: '#0a0c14',
          }}
        >
          {!activeContactId ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <div className="w-20 h-20 rounded-full bg-[#1e2d47]/60 flex items-center justify-center mb-5">
                <MessageSquare className="w-9 h-9 text-slate-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">Nexora Messages</h3>
              <p className="text-sm text-center max-w-xs">Select a conversation from the list to start chatting with a founder or investor.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[#111827] border-b border-[#1e2d47] shrink-0">
                <button onClick={() => setActiveContactId(null)} className="md:hidden text-slate-400 hover:text-white mr-1">
                  <span className="material-symbols-outlined text-xl">arrow_back_ios</span>
                </button>
                {activeContact && <Avatar name={activeContact.contact_name} size="sm" />}
                <div>
                  <h2 className="font-semibold text-white leading-tight">{activeContact?.contact_name}</h2>
                  <p className="text-[11px] text-slate-400 capitalize">{activeContact?.contact_role}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {isLoadingThread ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                  <>
                    {thread.length === 0 && (
                      <div className="flex justify-center py-10">
                        <span className="text-xs bg-[#1e2d47]/80 text-slate-400 px-4 py-2 rounded-full">
                          Say hello to {activeContact?.contact_name}! 👋
                        </span>
                      </div>
                    )}
                    {thread.map((msg, i) => {
                      const isMe = msg.sender_id === internalId
                      const prevMsg = thread[i - 1]
                      const showDate = i === 0 || new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString()

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <span className="text-[11px] bg-[#1e2d47]/90 text-slate-300 px-3 py-1 rounded-full backdrop-blur-sm">
                                {new Date(msg.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                              </span>
                            </div>
                          )}
                          <div className={`flex mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`relative max-w-[70%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                                isMe
                                  ? 'bg-primary text-[#0a0c14] rounded-br-sm'
                                  : 'bg-[#1e2d47] text-slate-100 rounded-bl-sm'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                              <span className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'justify-end text-[#0a0c14]/60' : 'text-slate-500'}`}>
                                {formatTime(msg.timestamp)}
                                {isMe && (
                                  <span className="text-[10px]">{msg.is_read ? '✓✓' : '✓'}</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="shrink-0 bg-[#111827] border-t border-[#1e2d47] px-4 py-3">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder="Type a message"
                    className="flex-1 bg-[#1e2d47] text-white text-sm px-5 py-3 rounded-full outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary/40 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="w-11 h-11 rounded-full bg-primary hover:bg-primary/90 text-[#0a0c14] flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
