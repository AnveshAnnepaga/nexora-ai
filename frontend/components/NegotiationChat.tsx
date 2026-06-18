"use client"
import React, { useState, useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Send, User, Bot, Loader2, TrendingUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useStore } from '@/store/useStore'

interface Message {
  role: 'user' | 'investor'
  content: string
}

export default function NegotiationChat() {
  const { fullEvaluation } = useStore()

  // Build a personalized opening message using the real evaluation
  const investorName = fullEvaluation?.startup_context?.startup_name || "your startup"
  const initialMsg = fullEvaluation?.investor_feedback?.feedback
    ? `I've completed my full evaluation of **${investorName}**. Here is my preliminary assessment:\n\n${fullEvaluation.investor_feedback.feedback}\n\n---\n\nNow let's negotiate. What valuation are you seeking, and how do you defend your competitive moat given the market analysis?`
    : `I've reviewed your pitch and evaluation for **${investorName}**. What valuation are you looking for, and how do you defend your technical moat?`

  const [messages, setMessages] = useState<Message[]>([
    { role: 'investor', content: initialMsg }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_input: userMsg.content,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          // Pass full evaluation context so investor agent is informed
          startup_context: fullEvaluation?.startup_context || {},
          investor_feedback: fullEvaluation?.investor_feedback || {},
          market_intelligence: fullEvaluation?.market_intelligence || {},
          business_validation: fullEvaluation?.business_validation || {},
          strategy_output: fullEvaluation?.strategy || {},
        })
      })
      const data = await response.json()

      setMessages(prev => [...prev, { role: 'investor', content: data.reply }])
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { role: 'investor', content: "⚠️ Network error connecting to Investor Agent. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-lg border-slate-200 bg-white mt-8 mb-16">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Live Investor Negotiation
          <span className="ml-auto text-xs font-normal bg-green-500 text-white px-2 py-1 rounded-full">
            Context-Aware
          </span>
        </CardTitle>
        <p className="text-slate-300 text-sm mt-1">
          The AI investor has read your full evaluation report. Defend your startup and negotiate terms.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[480px] overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'investor' && (
                <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center shrink-0 shadow">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div className={`px-4 py-3 rounded-2xl max-w-[78%] shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
              }`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <ReactMarkdown>{msg.content.replace(/\+\+([^+]+)\+\+/g, '**$1**')}</ReactMarkdown>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 shadow">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center shadow">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-500 italic flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Investor is analyzing your response...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Defend your business model, share your metrics, negotiate terms..."
            className="min-h-[70px] resize-none flex-1"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="h-[70px] px-6 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-center text-xs text-slate-400 pb-3">Press Enter to send · Shift+Enter for new line</p>
      </CardContent>
    </Card>
  )
}
