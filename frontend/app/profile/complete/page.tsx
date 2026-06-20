"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function ProfileCompletePage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const role = user?.publicMetadata?.role as string | undefined
  const internalId = user?.publicMetadata?.internal_id as number | undefined

  // Shared
  const [fullName, setFullName] = useState('')

  // Founder fields
  const [linkedin, setLinkedin] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')

  // Investor fields
  const [fundName, setFundName] = useState('')
  const [ticketSize, setTicketSize] = useState('$100k - $500k')
  const [stage, setStage] = useState('Seed')
  const [sectors, setSectors] = useState('')

  useEffect(() => {
    if (internalId) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/profile/${internalId}`)
        .then(res => res.json())
        .then(data => {
          setFullName(data.full_name || '')
          setLocation(data.location || '')
          setLinkedin(data.linkedin_url || '')
          if (role === 'investor') {
            setFundName(data.fund_name || '')
            setTicketSize(data.ticket_size || '$100k - $500k')
            setStage(data.stage_preference || 'Seed')
            setSectors(data.sector_preferences || '')
          }
        })
        .catch(console.error)
    }
  }, [internalId, role])

  if (!isLoaded) return <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  if (!role || !internalId) return <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center text-white">Missing user metadata. Please log in again.</div>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (role === 'entrepreneur') {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/profile/founder/${internalId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: fullName, linkedin_url: linkedin, phone_number: phone, location })
        })
        router.push('/dashboard')
      } else if (role === 'investor') {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/profile/investor/${internalId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: fullName, fund_name: fundName, ticket_size: ticketSize, stage_preference: stage, sector_preferences: sectors, location })
        })
        router.push('/investor/dashboard')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c14] flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-[#111827] border border-[#1e2d47] rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="flex items-center gap-4 mb-2">
            <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-2xl font-bold text-white font-orbitron">Profile Settings</h1>
        </div>
        <p className="text-slate-400 text-sm mb-8">
          Update your public profile and preferences.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">FULL NAME</label>
            <input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Doe" className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors" />
          </div>

          {role === 'entrepreneur' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">LOCATION</label>
                <input required value={location} onChange={e => setLocation(e.target.value)} placeholder="San Francisco, CA" className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">LINKEDIN URL (Optional)</label>
                <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">PHONE NUMBER (Optional)</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">FIRM / FUND NAME</label>
                <input required value={fundName} onChange={e => setFundName(e.target.value)} placeholder="Acme Ventures" className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">LOCATION</label>
                <input required value={location} onChange={e => setLocation(e.target.value)} placeholder="New York, NY" className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">SECTOR FOCUS (Comma separated)</label>
                <input required value={sectors} onChange={e => setSectors(e.target.value)} placeholder="SaaS, AI, Fintech" className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">STAGE PREFERENCE</label>
                  <select value={stage} onChange={e => setStage(e.target.value)} className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors">
                    <option>Pre-Seed</option>
                    <option>Seed</option>
                    <option>Series A</option>
                    <option>Series B+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">TICKET SIZE</label>
                  <select value={ticketSize} onChange={e => setTicketSize(e.target.value)} className="w-full bg-[#0d1424] border border-[#1e2d47] rounded-lg px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors">
                    <option>$10k - $50k</option>
                    <option>$100k - $500k</option>
                    <option>$500k - $1M</option>
                    <option>$1M+</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-on-primary font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,212,255,0.4)] hover:shadow-[0_0_25px_rgba(0,212,255,0.6)] flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </form>
      </motion.div>
    </div>
  )
}
