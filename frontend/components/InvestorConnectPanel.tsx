"use client"
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, User, Briefcase } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

export default function InvestorConnectPanel() {
  const [investors, setInvestors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/investors`)
        if (res.ok) {
          const data = await res.json()
          setInvestors(data)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInvestors()
  }, [])

  const handleConnect = async (investorId: number) => {
    // Here we would trigger a message or connection request
    alert(`Connection request sent to investor!`)
  }

  if (isLoading) return <div className="text-center py-4 text-slate-400">Loading Investors...</div>
  if (investors.length === 0) return <div className="text-center py-4 text-slate-400">No matching investors found.</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {investors.map((inv) => (
        <div key={inv.id} className="bg-[#0d1424] border border-[#1e2d47] rounded-xl p-5 hover:border-blue-500/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-white">{inv.user.full_name}</h3>
              <p className="text-xs text-blue-400 font-medium flex items-center gap-1 mt-1"><Briefcase className="w-3 h-3" /> {inv.fund_name}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {inv.user.full_name.charAt(0)}
            </div>
          </div>
          
          <div className="space-y-2 mb-6 text-sm">
            <p className="flex justify-between"><span className="text-slate-500">Focus</span><span className="text-slate-300 font-medium">{inv.investment_focus}</span></p>
            <p className="flex justify-between"><span className="text-slate-500">Ticket Size</span><span className="text-slate-300 font-medium">{inv.ticket_size}</span></p>
          </div>
          
          <button 
            onClick={() => handleConnect(inv.id)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2"
          >
            <Send className="w-4 h-4" /> Connect & Pitch
          </button>
        </div>
      ))}
    </div>
  )
}
