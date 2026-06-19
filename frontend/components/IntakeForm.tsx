"use client"
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { Loader2, Upload, CheckCircle2, ChevronRight, Rocket, FileText, Users, DollarSign, Globe, Swords } from 'lucide-react'

const FIELDS = [
  {
    key: 'startup_name', label: 'Startup Name', placeholder: 'e.g. ContractIQ', icon: Rocket,
    required: true, type: 'input', hint: 'The name of your company or project'
  },
  {
    key: 'problem_statement', label: 'Problem Statement', required: true,
    placeholder: 'Describe the pain point you are solving. Include who suffers from it and the scale of the problem.',
    icon: FileText, type: 'textarea', hint: 'Be specific — include data, scale, and who is most affected'
  },
  {
    key: 'proposed_solution', label: 'Proposed Solution', required: true,
    placeholder: 'How does your product/service solve the problem? What is the core innovation?',
    icon: Rocket, type: 'textarea', hint: 'Explain what you built and why it works better than alternatives'
  },
  {
    key: 'target_audience', label: 'Target Audience', required: true,
    placeholder: 'Who are your primary customers? Include demographics, company size, role, geography.',
    icon: Users, type: 'textarea', hint: 'Be specific — avoid "everyone". Who is your first customer?'
  },
  {
    key: 'business_model', label: 'Business Model', required: true,
    placeholder: 'How do you make money? (e.g. SaaS subscription $X/month, one-time license, usage-based, marketplace fee)',
    icon: DollarSign, type: 'textarea', hint: 'Include pricing strategy and when customers first pay you'
  },
  {
    key: 'market_details', label: 'Market Details (Optional)',
    placeholder: 'Industry, geography, estimated market size, growth trends you know about',
    icon: Globe, type: 'textarea', hint: 'Any market research or data you already have'
  },
  {
    key: 'competitor_info', label: 'Known Competitors (Optional)',
    placeholder: 'List competitors you are aware of and how you differ from each',
    icon: Swords, type: 'textarea', hint: 'Include direct and indirect competitors'
  },
]

export default function IntakeForm() {
  const { intake, setIntake, setPhase, setLoading, isLoading } = useStore()
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [uploadedFile, setUploadedFile] = useState<string>('')

  const isValid = intake.startup_name.trim() && intake.problem_statement.trim() &&
    intake.proposed_solution.trim() && intake.target_audience.trim() && intake.business_model.trim()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadStatus('uploading')
    setUploadedFile(file.name)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/upload', { method: 'POST', body: fd })
      setUploadStatus(res.ok ? 'done' : 'error')
    } catch {
      setUploadStatus('error')
    }
  }

  const handleContinue = () => {
    if (!isValid) return
    setPhase('interrogation')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          <span className="w-2 h-2 bg-blue-400 rounded-full pulse-dot" />
          PHASE 1 — FOUNDER INTAKE
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Tell us about your startup</h2>
        <p className="text-slate-400 max-w-lg mx-auto">
          Fill in the details below. The more context you provide, the more accurate and actionable your intelligence report will be.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        {FIELDS.map(({ key, label, placeholder, icon: Icon, required, type, hint }) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ag-card p-5"
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 text-blue-400 shrink-0" />
              <label className="text-sm font-semibold text-slate-200">
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
              </label>
            </div>
            {hint && <p className="text-xs text-slate-500 mb-3 ml-6">{hint}</p>}
            {type === 'input' ? (
              <input
                className="w-full bg-[#0d1424] border border-[#1e2d47] text-slate-100 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                placeholder={placeholder}
                value={(intake as any)[key] || ''}
                onChange={(e) => setIntake(key, e.target.value)}
              />
            ) : (
              <textarea
                rows={key === 'problem_statement' || key === 'proposed_solution' ? 4 : 3}
                className="w-full bg-[#0d1424] border border-[#1e2d47] text-slate-100 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-y placeholder:text-slate-600"
                placeholder={placeholder}
                value={(intake as any)[key] || ''}
                onChange={(e) => setIntake(key, e.target.value)}
              />
            )}
          </motion.div>
        ))}

        {/* File Upload */}
        <div className="ag-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="w-4 h-4 text-purple-400" />
            <label className="text-sm font-semibold text-slate-200">
              Founder Demo Video / Pitch Deck
              <span className="text-slate-500 font-normal ml-2">(Optional)</span>
            </label>
          </div>
          <p className="text-xs text-slate-500 mb-3 ml-6">
            Upload your pitch video (.mp4, .mov) or deck (.pdf) — AI will analyze it for founder signals
          </p>
          <label className={`flex items-center gap-3 p-4 rounded-xl border border-dashed cursor-pointer transition-all
            ${uploadStatus === 'done' ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400' :
              uploadStatus === 'error' ? 'border-red-500/30 bg-red-500/5 text-red-400' :
              uploadStatus === 'uploading' ? 'border-blue-500/30 bg-blue-500/5 text-blue-400 animate-pulse' :
              'border-[#1e2d47] hover:border-purple-500/40 text-slate-500 hover:text-slate-300'}`}
          >
            {uploadStatus === 'done' ? (
              <><CheckCircle2 className="w-5 h-5 shrink-0" /> {uploadedFile} — Uploaded & processing</>
            ) : uploadStatus === 'uploading' ? (
              <><Loader2 className="w-5 h-5 animate-spin shrink-0" /> Uploading {uploadedFile}...</>
            ) : uploadStatus === 'error' ? (
              <><Upload className="w-5 h-5 shrink-0" /> Upload failed — try again</>
            ) : (
              <><Upload className="w-5 h-5 shrink-0" /> Click to upload (.mp4, .mov, .pdf, .txt, .csv)</>
            )}
            <input
              type="file"
              className="hidden"
              accept="video/mp4,video/quicktime,application/pdf,.txt,.csv"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: isValid ? 1.01 : 1 }}
          whileTap={{ scale: isValid ? 0.99 : 1 }}
          onClick={handleContinue}
          disabled={!isValid || isLoading}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
            ${isValid
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 cursor-pointer'
              : 'bg-[#1a2235] text-slate-600 cursor-not-allowed border border-[#1e2d47]'
            }`}
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
          ) : (
            <>Enter Investor Interrogation Room <ChevronRight className="w-5 h-5" /></>
          )}
        </motion.button>
        {!isValid && (
          <p className="text-center text-xs text-slate-600">Fill in all required fields (*) to continue</p>
        )}
      </div>
    </motion.div>
  )
}
