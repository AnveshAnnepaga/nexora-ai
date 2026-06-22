"use client"
import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser, UserButton, useClerk } from '@clerk/nextjs'
import { Bell, Briefcase, PlusCircle, Users, MessageSquare, Settings, LogOut, Cpu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) router.push('/')
      else if (user?.publicMetadata?.role === 'investor') router.push('/investor/dashboard')
      else if (user?.publicMetadata?.internal_id) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/notifications/count/${user.publicMetadata.internal_id}`)
          .then(res => res.json())
          .then(data => setUnreadCount(data.unread_count))
          .catch(console.error)
      }
    }
  }, [isLoaded, isSignedIn, user, router])

  const handleNotificationClick = async () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications && user?.publicMetadata?.internal_id) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/notifications/${user.publicMetadata.internal_id}`)
        const data = await res.json()
        setNotifications(data)
        
        data.filter((n: any) => !n.is_read).forEach(async (n: any) => {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/notifications/read/${n.id}`, { method: 'PATCH' })
        })
        setUnreadCount(0)
      } catch (e) {
        console.error(e)
      }
    }
  }

  if (!isLoaded) return <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center text-white">Loading...</div>

  const navItems = [
    { name: 'Analyze New', path: '/dashboard', icon: PlusCircle },
    { name: 'My Ideas', path: '/dashboard/ideas', icon: Briefcase },
    { name: 'Investors', path: '/dashboard/investors', icon: Users },
    { name: 'Messages', path: '/dashboard/messages', icon: MessageSquare },
    { name: 'Profile Settings', path: '/profile/complete', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#111827] border-r border-[#1e2d47] p-4 flex flex-col hidden md:flex">
        <div className="mb-8 px-2 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-8 h-8 bg-gradient-to-br from-[#00d4ff] to-[#0055ff] rounded-lg flex items-center justify-center font-black">N</div>
          <span className="font-orbitron font-bold text-lg tracking-wider text-[#00d4ff] drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]">NEXORA</span>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link key={item.path} href={item.path}>
                <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary/20 text-primary border border-primary/30 glow-cyan' : 'text-slate-400 hover:bg-[#1e2d47] hover:text-white'}`}>
                  <item.icon className="w-4 h-4" /> {item.name}
                </div>
              </Link>
            )
          })}
        </nav>

        <button onClick={() => signOut()} className="mt-auto flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
        {/* Top Bar for Desktop */}
        <header className="relative z-50 h-16 border-b border-[#1e2d47] bg-[#0a0c14]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#00d4ff] to-[#0055ff] rounded flex items-center justify-center font-black text-[10px]">N</div>
          </div>
          <div className="ml-auto flex items-center gap-4 relative">
            <button onClick={handleNotificationClick} className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full glow-cyan"></span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-12 right-12 w-80 bg-[#111827] border border-[#1e2d47] rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-[#1e2d47] bg-[#0a0c14] flex justify-between items-center">
                    <span className="font-bold text-sm">Notifications</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No notifications yet.</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 border-b border-[#1e2d47] text-sm ${!n.is_read ? 'bg-[#1e2d47]/30' : ''}`}>
                          <p className="text-slate-200 text-xs">{n.message}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center justify-center">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
