"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { Loader2 } from 'lucide-react'

export default function IntakeForm() {
  const { intake, setIntake, setPhase, setLoading, isLoading } = useStore()
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [uploadedFile, setUploadedFile] = useState<string>('')
  
  const [ideaMode, setIdeaMode] = useState<'text' | 'pdf'>('text')

  // Idea text or PDF is compulsory
  const isValid = intake.idea_text.trim().length > 0 || intake.pdf_content.trim().length > 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'pdf') => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadStatus('uploading')
    setUploadedFile(file.name)
    
    setTimeout(() => {
      setUploadStatus('done')
      if (type === 'pdf') {
        setIntake('pdf_content', `[Simulated PDF content for ${file.name}]: Pitch deck details...`)
      } else {
        setIntake('video_content', file.name)
      }
    }, 800)
  }

  const handleContinue = () => {
    if (!isValid) return
    setPhase('interrogation')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto pt-8 flex flex-col gap-8"
    >
      {/* Header & Subtext */}
      <section className="flex flex-col gap-2">
        <h2 className="font-display-xl text-headline-lg-mobile text-primary leading-tight tracking-wide orbitron">Launch Your Analysis</h2>
        <p className="font-body-md text-on-surface-variant opacity-80">Give NEXORA what it needs to evaluate your startup.</p>
      </section>

      {/* Startup Name Input */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-label-caps text-on-surface tracking-widest text-xs uppercase">Startup Name</h3>
          <span className="font-data-mono text-outline text-[10px] bg-surface-variant/30 px-2 py-0.5 rounded">OPTIONAL</span>
        </div>
        <input
          className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-all outline-none placeholder:text-outline/40"
          placeholder="Enter startup name..."
          value={intake.startup_name || ''}
          onChange={(e) => setIntake('startup_name', e.target.value)}
        />
      </section>

      {/* Section A: Founder Video Upload */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-label-caps text-on-surface tracking-widest text-xs uppercase">A. FOUNDER VIDEO</h3>
          <span className="font-data-mono text-outline text-[10px] bg-surface-variant/30 px-2 py-0.5 rounded">OPTIONAL</span>
        </div>
        
        <label className={`relative rounded-xl aspect-video glass-panel flex flex-col items-center justify-center gap-3 group cursor-pointer overflow-hidden transition-all duration-300 hover:border-primary/50 ${intake.video_content ? 'border-primary/50' : 'dashed-border'}`}>
          {uploadStatus === 'uploading' && <div className="scan-line absolute top-0 left-0 w-full z-10"></div>}
          
          {!intake.video_content && uploadStatus !== 'uploading' ? (
            <div className="video-default-state flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-primary-container text-4xl group-hover:scale-110 transition-transform duration-300" style={{fontVariationSettings: "'FILL' 0"}}>videocam</span>
              <div className="bg-primary text-on-primary font-label-caps py-2 px-6 rounded-full text-[11px] glow-cyan hover:brightness-110 active:scale-95 transition-all">UPLOAD VIDEO</div>
              <p className="font-body-sm text-outline text-[11px]">MP4, MOV up to 500MB</p>
            </div>
          ) : uploadStatus === 'uploading' ? (
             <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <div className="absolute inset-0 bg-surface-container-lowest/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2 animate-in fade-in duration-500">
              <span className="material-symbols-outlined text-tertiary text-5xl">check_circle</span>
              <p className="font-display-xl text-tertiary tracking-widest text-xs orbitron">VIDEO UPLOADED ✓</p>
              <p className="font-data-mono text-outline text-[10px]">{intake.video_content}</p>
            </div>
          )}
          <input type="file" className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} />
        </label>
      </section>

      {/* Section B: Idea Input */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-label-caps text-on-surface tracking-widest text-xs uppercase">B. PROJECT CORE</h3>
          <div className="flex bg-surface-container-high rounded-full p-1 border border-outline-variant/30">
            <button
              onClick={() => setIdeaMode('text')}
              className={`px-4 py-1.5 rounded-full font-label-caps text-[10px] transition-all duration-300 ${ideaMode === 'text' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              WRITE
            </button>
            <button
              onClick={() => setIdeaMode('pdf')}
              className={`px-4 py-1.5 rounded-full font-label-caps text-[10px] transition-all duration-300 ${ideaMode === 'pdf' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              PDF
            </button>
          </div>
        </div>

        {/* Description State */}
        {ideaMode === 'text' ? (
          <div className="relative">
            <textarea
              className="w-full h-48 bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl p-4 font-body-sm text-on-surface focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-all resize-none outline-none placeholder:text-outline/40 custom-scrollbar"
              maxLength={1000}
              placeholder="Describe your startup's unique value proposition, target market, and technical advantage..."
              value={intake.idea_text || ''}
              onChange={(e) => setIntake('idea_text', e.target.value)}
            ></textarea>
            <div className="absolute bottom-4 right-4 font-data-mono text-[10px] text-outline">
              <span className={intake.idea_text.length > 900 ? 'text-error' : 'text-primary'}>{intake.idea_text.length}</span>/1000
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label className={`border border-outline-variant/30 bg-surface-container-lowest/50 rounded-xl p-8 flex flex-col items-center gap-4 text-center cursor-pointer hover:border-primary/50 transition-all ${intake.pdf_content ? 'border-primary/50' : ''}`}>
              <span className="material-symbols-outlined text-outline text-4xl">picture_as_pdf</span>
              <p className="font-body-sm text-on-surface-variant">
                {intake.pdf_content ? 'PDF Loaded Successfully' : 'Drop your executive summary or pitch deck here.'}
              </p>
              <div className="border border-outline-variant hover:border-primary px-6 py-2 rounded-full font-label-caps text-[11px] text-on-surface transition-all">
                {intake.pdf_content ? 'REPLACE FILE' : 'CHOOSE FILE'}
              </div>
              <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'pdf')} />
            </label>
          </div>
        )}
      </section>

      {/* Action CTA */}
      <div className="mt-8 mb-24">
        <button
          onClick={handleContinue}
          disabled={!isValid || isLoading}
          className={`w-full font-display-xl py-5 rounded-xl flex items-center justify-center gap-2 transition-all group overflow-hidden relative orbitron
            ${isValid
              ? 'bg-primary-container text-on-primary-container glow-cyan hover:scale-[1.02] active:scale-95 cursor-pointer'
              : 'bg-surface-container border border-outline-variant/30 text-outline cursor-not-allowed'
            }`}
        >
          <span className="relative z-10 tracking-widest text-sm">BEGIN NEXORA ANALYSIS</span>
          <span className="material-symbols-outlined relative z-10 group-hover:translate-x-2 transition-transform">arrow_right_alt</span>
        </button>
      </div>
    </motion.div>
  )
}
