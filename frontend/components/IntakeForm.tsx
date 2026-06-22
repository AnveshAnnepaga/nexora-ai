"use client"
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { Loader2, Upload, Camera, Mic, Square, Play, RotateCcw } from 'lucide-react'

type VideoMode = 'upload' | 'camera' | 'audio'

export default function IntakeForm() {
  const { intake, setIntake, setPhase, setLoading, isLoading } = useStore()
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [ideaMode, setIdeaMode] = useState<'text' | 'pdf'>('text')
  const [videoMode, setVideoMode] = useState<VideoMode>('upload')

  // Camera / Audio state
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string>('')
  const [cameraError, setCameraError] = useState<string>('')
  const [recordingTime, setRecordingTime] = useState(0)

  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const playbackVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobEvent['data'][]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const isValid = intake.idea_text.trim().length > 0 || intake.pdf_content.trim().length > 0

  // Clean up stream when switching modes
  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [])

  useEffect(() => {
    if (videoMode !== 'camera' && videoMode !== 'audio') {
      stopStream()
    }
  }, [videoMode])

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
    setRecordingTime(0)
  }

  // ── Camera ──────────────────────────────────────────────
  const startCameraPreview = async () => {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        videoPreviewRef.current.play()
      }
    } catch (err) {
      setCameraError('Camera access denied. Please allow camera permissions and try again.')
    }
  }

  const startCameraRecording = () => {
    if (!streamRef.current) return
    chunksRef.current = []
    // Try video/webm first, fallback to default
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8'
      : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : ''
    const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
    const mr = new MediaRecorder(streamRef.current, options)
    mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      // Build blob from all collected chunks
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })
      const url = URL.createObjectURL(blob)
      setRecordedBlob(blob)
      setRecordedUrl(url)
      setIntake('video_content', 'recorded-video.webm')
      // Stop the camera stream AFTER blob is created
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
    // Collect data every 200ms for reliable chunk capture
    mr.start(200)
    mediaRecorderRef.current = mr
    setIsRecording(true)
    setRecordingTime(0)
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
  }

  const stopCameraRecording = () => {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
  }

  // ── Audio ──────────────────────────────────────────────
  const startAudioRecording = async () => {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setRecordedBlob(blob)
        setRecordedUrl(url)
        setIntake('video_content', 'recorded-audio.webm')
        stopStream()
      }
      mr.start()
      mediaRecorderRef.current = mr
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch (err) {
      setCameraError('Microphone access denied. Please allow microphone permissions and try again.')
    }
  }

  const stopAudioRecording = () => {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
  }

  const resetRecording = () => {
    setRecordedBlob(null)
    setRecordedUrl('')
    setIntake('video_content', '')
    setRecordingTime(0)
    setCameraError('')
    if (videoMode === 'camera') startCameraPreview()
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // ── File Upload ──────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'pdf') => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadStatus('uploading')
    
    // For video/audio uploads, store it as a blob so handleContinue can transcribe it
    if (type === 'video') {
      setRecordedBlob(file)
      setRecordedUrl(URL.createObjectURL(file))
      setIntake('video_content', file.name)
      setUploadStatus('done')
      return
    }

    setTimeout(() => {
      setUploadStatus('done')
      setIntake('pdf_content', `[Simulated PDF content for ${file.name}]: Pitch deck details...`)
    }, 800)
  }

  const [isTranscribing, setIsTranscribing] = useState(false)

  const handleContinue = async () => {
    if (!isValid) return
    
    // If we have a recorded or uploaded media blob, transcribe it first
    if (recordedBlob) {
      setIsTranscribing(true)
      try {
        const formData = new FormData()
        formData.append('file', recordedBlob, intake.video_content || 'recording.webm')
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/transcribe`, {
          method: 'POST',
          body: formData
        })
        
        if (!res.ok) {
          throw new Error('Transcription failed')
        }
        
        const data = await res.json()
        const transcript = data.transcript
        
        // Feed the transcribed text into the store for the AI to analyze
        setIntake('video_content', `[Founder Media Transcript]: ${transcript}`)
      } catch (err) {
        console.error("Transcription error:", err)
        // Fallback if API fails
        setIntake('video_content', '[Media provided but transcription failed. Proceeding with text only.]')
      } finally {
        setIsTranscribing(false)
      }
    }
    
    setPhase('interrogation')
  }

  // ── Tab change handler ──────────────────────────────────────────────
  const handleModeChange = (mode: VideoMode) => {
    stopStream()
    setRecordedBlob(null)
    setRecordedUrl('')
    setIntake('video_content', '')
    setUploadStatus('idle')
    setCameraError('')
    setVideoMode(mode)
    if (mode === 'camera') setTimeout(startCameraPreview, 100)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto pt-8 flex flex-col gap-8"
    >
      {/* Header */}
      <section className="flex flex-col gap-2">
        <h2 className="font-display-xl text-headline-lg-mobile text-primary leading-tight tracking-wide orbitron">Launch Your Analysis</h2>
        <p className="font-body-md text-on-surface-variant opacity-80">Give NEXORA what it needs to evaluate your startup.</p>
      </section>

      {/* Startup Name */}
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

      {/* Section A: Video / Camera / Audio */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-label-caps text-on-surface tracking-widest text-xs uppercase">A. FOUNDER PITCH MEDIA</h3>
          <span className="font-data-mono text-outline text-[10px] bg-surface-variant/30 px-2 py-0.5 rounded">OPTIONAL</span>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-[#111827] rounded-xl p-1 border border-[#1e2d47] gap-1">
          {([
            { key: 'upload', icon: <Upload className="w-3.5 h-3.5" />, label: 'Upload' },
            { key: 'camera', icon: <Camera className="w-3.5 h-3.5" />, label: 'Camera' },
            { key: 'audio',  icon: <Mic className="w-3.5 h-3.5" />,    label: 'Audio'  },
          ] as { key: VideoMode; icon: React.ReactNode; label: string }[]).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => handleModeChange(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                videoMode === key
                  ? 'bg-primary text-[#0a0c14] shadow-[0_0_10px_rgba(0,212,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-[#1e2d47]'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ── Upload Tab ── */}
        <AnimatePresence mode="wait">
          {videoMode === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className={`relative rounded-xl aspect-video glass-panel flex flex-col items-center justify-center gap-3 group cursor-pointer overflow-hidden transition-all duration-300 hover:border-primary/50 ${intake.video_content ? 'border-primary/50' : 'dashed-border'}`}>
                {uploadStatus === 'uploading' && <div className="scan-line absolute top-0 left-0 w-full z-10"></div>}
                {!intake.video_content && uploadStatus !== 'uploading' ? (
                  <div className="flex flex-col items-center gap-3">
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
            </motion.div>
          )}

          {/* ── Camera Tab ── */}
          {videoMode === 'camera' && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              {cameraError ? (
                <div className="rounded-xl bg-red-900/20 border border-red-500/40 p-4 text-center text-sm text-red-400">{cameraError}</div>
              ) : recordedUrl ? (
                /* Playback */
                <div className="flex flex-col gap-3">
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
                    <video key={recordedUrl} src={recordedUrl} controls playsInline className="w-full h-full object-contain bg-black" />
                    <div className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span> RECORDED ({Math.round((recordedBlob?.size || 0) / 1024)} KB)
                    </div>
                  </div>
                  <button onClick={resetRecording} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#1e2d47] text-slate-400 hover:text-white hover:border-primary/50 text-sm transition-all">
                    <RotateCcw className="w-4 h-4" /> Re-record
                  </button>
                </div>
              ) : (
                /* Live Camera Preview */
                <div className="flex flex-col gap-3">
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
                    <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    {isRecording && (
                      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-white text-[11px] font-mono">{formatTime(recordingTime)}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={isRecording ? stopCameraRecording : startCameraRecording}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                        : 'bg-primary hover:bg-primary/90 text-[#0a0c14] shadow-[0_0_15px_rgba(0,212,255,0.4)]'
                    }`}
                  >
                    {isRecording ? <><Square className="w-4 h-4 fill-white" /> Stop Recording</> : <><span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span> Start Recording</>}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Audio Tab ── */}
          {videoMode === 'audio' && (
            <motion.div key="audio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              {cameraError ? (
                <div className="rounded-xl bg-red-900/20 border border-red-500/40 p-4 text-center text-sm text-red-400">{cameraError}</div>
              ) : recordedUrl ? (
                /* Audio Playback */
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl bg-[#111827] border border-[#1e2d47] p-6 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center">
                      <Mic className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-sm text-emerald-400 font-semibold">✓ Audio Recorded ({formatTime(recordingTime)})</p>
                    <audio src={recordedUrl} controls className="w-full" />
                  </div>
                  <button onClick={resetRecording} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#1e2d47] text-slate-400 hover:text-white hover:border-primary/50 text-sm transition-all">
                    <RotateCcw className="w-4 h-4" /> Re-record
                  </button>
                </div>
              ) : (
                /* Mic Recording UI */
                <div className="rounded-xl bg-[#111827] border border-[#1e2d47] p-8 flex flex-col items-center gap-5">
                  <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording ? 'bg-red-500/20 border-2 border-red-500' : 'bg-primary/10 border-2 border-primary/40'
                  }`}>
                    {isRecording && (
                      <>
                        <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></span>
                        <span className="absolute inset-[-8px] rounded-full border border-red-500/30 animate-ping" style={{animationDelay: '0.3s'}}></span>
                      </>
                    )}
                    <Mic className={`w-8 h-8 ${isRecording ? 'text-red-400' : 'text-primary'}`} />
                  </div>

                  {isRecording && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="text-red-400 font-mono text-sm">{formatTime(recordingTime)}</span>
                    </div>
                  )}
                  {!isRecording && <p className="text-slate-400 text-sm text-center">Tap record and deliver your elevator pitch as a voice note.</p>}

                  <button
                    onClick={isRecording ? stopAudioRecording : startAudioRecording}
                    className={`px-8 py-3 rounded-full font-semibold text-sm transition-all flex items-center gap-2 ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                        : 'bg-primary hover:bg-primary/90 text-[#0a0c14] shadow-[0_0_15px_rgba(0,212,255,0.4)]'
                    }`}
                  >
                    {isRecording ? <><Square className="w-4 h-4 fill-white" /> Stop</> : <><Mic className="w-4 h-4" /> Start Recording</>}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Section B: Idea Input */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-label-caps text-on-surface tracking-widest text-xs uppercase">B. PROJECT CORE</h3>
          <div className="flex bg-surface-container-high rounded-full p-1 border border-outline-variant/30">
            <button onClick={() => setIdeaMode('text')} className={`px-4 py-1.5 rounded-full font-label-caps text-[10px] transition-all duration-300 ${ideaMode === 'text' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>WRITE</button>
            <button onClick={() => setIdeaMode('pdf')}  className={`px-4 py-1.5 rounded-full font-label-caps text-[10px] transition-all duration-300 ${ideaMode === 'pdf'  ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>PDF</button>
          </div>
        </div>

        {ideaMode === 'text' ? (
          <div className="relative">
            <textarea
              className="w-full h-48 bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl p-4 font-body-sm text-on-surface focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-all resize-none outline-none placeholder:text-outline/40 custom-scrollbar"
              maxLength={1000}
              placeholder="Describe your startup's unique value proposition, target market, and technical advantage..."
              value={intake.idea_text || ''}
              onChange={(e) => setIntake('idea_text', e.target.value)}
            />
            <div className="absolute bottom-4 right-4 font-data-mono text-[10px] text-outline">
              <span className={intake.idea_text.length > 900 ? 'text-error' : 'text-primary'}>{intake.idea_text.length}</span>/1000
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label className={`border border-outline-variant/30 bg-surface-container-lowest/50 rounded-xl p-8 flex flex-col items-center gap-4 text-center cursor-pointer hover:border-primary/50 transition-all ${intake.pdf_content ? 'border-primary/50' : ''}`}>
              <span className="material-symbols-outlined text-outline text-4xl">picture_as_pdf</span>
              <p className="font-body-sm text-on-surface-variant">{intake.pdf_content ? 'PDF Loaded Successfully' : 'Drop your executive summary or pitch deck here.'}</p>
              <div className="border border-outline-variant hover:border-primary px-6 py-2 rounded-full font-label-caps text-[11px] text-on-surface transition-all">
                {intake.pdf_content ? 'REPLACE FILE' : 'CHOOSE FILE'}
              </div>
              <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'pdf')} />
            </label>
          </div>
        )}
      </section>

      {/* CTA */}
      <div className="mt-8 mb-24">
        <button
          onClick={handleContinue}
          disabled={!isValid || isLoading || isTranscribing}
          className={`w-full font-display-xl py-5 rounded-xl flex items-center justify-center gap-2 transition-all group overflow-hidden relative orbitron
            ${isValid
              ? 'bg-primary-container text-on-primary-container glow-cyan hover:scale-[1.02] active:scale-95 cursor-pointer'
              : 'bg-surface-container border border-outline-variant/30 text-outline cursor-not-allowed'
            }`}
        >
          {isTranscribing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="relative z-10 tracking-widest text-sm">TRANSCRIBING PITCH...</span>
            </>
          ) : (
            <>
              <span className="relative z-10 tracking-widest text-sm">BEGIN NEXORA ANALYSIS</span>
              <span className="material-symbols-outlined relative z-10 group-hover:translate-x-2 transition-transform">arrow_right_alt</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}
