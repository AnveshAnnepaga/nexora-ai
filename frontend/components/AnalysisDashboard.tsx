"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const CHART_COLORS = ['#00D4FF', '#6800ec', '#00ff94', '#d1bcff', '#00586b']

export default function AnalysisDashboard() {
  const {
    ideaScores, founderScores, marketResearch,
    competitorIntel, businessModelEval, swot,
    riskAssessment, healthDashboard
  } = useStore()

  if (!healthDashboard) return null

  // ── Competitor Pie Data ───────────────────────────────────
  const competitors = competitorIntel?.competitors || []
  const pieData = [
    ...competitors.map((c: any) => ({ name: c.name, value: c.market_share_pct || 10 })),
    ...(competitorIntel?.market_share_unaddressed_pct
      ? [{ name: 'Unaddressed', value: competitorIntel.market_share_unaddressed_pct }]
      : [])
  ]

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto">
      
      {/* ── Section 1: Health Score ───────────────────────────────── */}
      <section className="space-y-4" id="health">
        <div className="flex items-center justify-between">
          <h2 className="font-display-xl text-headline-lg-mobile text-on-surface orbitron">STARTUP HEALTH</h2>
          <span className="font-data-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-[10px]">REAL-TIME ANALYTICS</span>
        </div>
        <div className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center space-y-6 glow-cyan relative overflow-hidden">
          
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* The radial score background gradient simulates conic-gradient */}
            <div className="absolute inset-0 rounded-full opacity-20" style={{background: `conic-gradient(from 0deg, #00D4FF ${healthDashboard.overall_score || 0}%, #0A1628 0%)`}}></div>
            <div className="absolute inset-3 rounded-full bg-background flex flex-col items-center justify-center border border-outline-variant/30 z-10 shadow-inner">
              <span className="orbitron text-5xl font-black text-primary drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">{healthDashboard.overall_score}</span>
              <span className="font-label-caps text-[10px] text-outline tracking-widest mt-1">TOTAL SCORE</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 w-full pt-6 border-t border-outline-variant/30">
            <div className="space-y-2">
              <div className="flex justify-between font-label-caps text-[10px]">
                <span className="text-on-surface-variant">IDEA</span>
                <span className="text-primary">{healthDashboard.idea_score || 0}%</span>
              </div>
              <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-primary glow-cyan transition-all duration-1000" style={{width: `${healthDashboard.idea_score || 0}%`}}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-label-caps text-[10px]">
                <span className="text-on-surface-variant">MARKET</span>
                <span className="text-secondary">{healthDashboard.market_score || 0}%</span>
              </div>
              <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-secondary shadow-[0_0_8px_#d1bcff] transition-all duration-1000" style={{width: `${healthDashboard.market_score || 0}%`}}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-label-caps text-[10px]">
                <span className="text-on-surface-variant">PRODUCT</span>
                <span className="text-tertiary">{healthDashboard.product_score || 0}%</span>
              </div>
              <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-tertiary shadow-[0_0_8px_#00ff94] transition-all duration-1000" style={{width: `${healthDashboard.product_score || 0}%`}}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-label-caps text-[10px]">
                <span className="text-on-surface-variant">FINANCIAL</span>
                <span className="text-error">{healthDashboard.financial_score || 0}%</span>
              </div>
              <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-error shadow-[0_0_8px_#ffb4ab] transition-all duration-1000" style={{width: `${healthDashboard.financial_score || 0}%`}}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-label-caps text-[10px]">
                <span className="text-on-surface-variant">GROWTH</span>
                <span className="text-primary-container">{healthDashboard.growth_potential || 0}%</span>
              </div>
              <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-primary-container shadow-[0_0_8px_#00d4ff] transition-all duration-1000" style={{width: `${healthDashboard.growth_potential || 0}%`}}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-label-caps text-[10px]">
                <span className="text-on-surface-variant">RISK</span>
                <span className="text-tertiary-fixed">{healthDashboard.risk_score || 0}%</span>
              </div>
              <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-fixed shadow-[0_0_8px_#5bffa1] transition-all duration-1000" style={{width: `${healthDashboard.risk_score || 0}%`}}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Market ────────────────────────────────────── */}
      {marketResearch && (
        <section className="space-y-4" id="market">
          <h2 className="font-display-xl text-headline-lg-mobile text-on-surface orbitron">MARKET DYNAMICS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel rounded-xl p-4 border-l-4 border-primary hover:bg-primary/5 transition-colors">
              <span className="font-label-caps text-[10px] text-outline">TAM (TOTAL ADDRESSABLE)</span>
              <div className="orbitron text-2xl font-bold text-on-surface mt-1">{marketResearch.tam || 'N/A'}</div>
            </div>
            <div className="glass-panel rounded-xl p-4 border-l-4 border-secondary hover:bg-secondary/5 transition-colors">
              <span className="font-label-caps text-[10px] text-outline">SAM (SERVICEABLE ADDRESSABLE)</span>
              <div className="orbitron text-2xl font-bold text-on-surface mt-1">{marketResearch.sam || 'N/A'}</div>
            </div>
            <div className="glass-panel rounded-xl p-4 border-l-4 border-tertiary hover:bg-tertiary/5 transition-colors">
              <span className="font-label-caps text-[10px] text-outline">SOM (SERVICEABLE OBTAINABLE)</span>
              <div className="orbitron text-2xl font-bold text-on-surface mt-1">{marketResearch.som || 'N/A'}</div>
            </div>
          </div>
          {marketResearch.future_demand && (
            <div className="glass-panel rounded-xl p-4 border-l-2 border-primary/40 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-10">
                 <span className="material-symbols-outlined text-6xl">monitoring</span>
               </div>
               <span className="font-label-caps text-[10px] text-outline block mb-2">FUTURE DEMAND PREDICTION</span>
               <p className="text-body-sm text-on-surface-variant leading-relaxed">{marketResearch.future_demand}</p>
            </div>
          )}
        </section>
      )}

      {/* ── Section 3: Competitors ─────────────────────────────────── */}
      {competitorIntel && competitors.length > 0 && (
        <section className="space-y-4" id="competitors">
          <h2 className="font-display-xl text-headline-lg-mobile text-on-surface orbitron">COMPETITOR RADAR</h2>
          <div className="glass-panel rounded-xl p-6 flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-48 h-48 shrink-0">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={2}>
                      {pieData.map((_: any, index: number) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid #1e2d47', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center font-label-caps text-[10px] text-center leading-tight pointer-events-none text-primary">
                    SHARE<br/>ANALYSIS
                </div>
            </div>
            
            <div className="w-full space-y-3">
              {competitors.map((c: any, i: number) => (
                <div key={i} className="flex flex-col p-3 bg-surface-container-highest/20 border border-outline-variant/10 rounded-lg group cursor-pointer hover:bg-surface-container-highest/40 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{background: CHART_COLORS[i % CHART_COLORS.length]}}></div>
                      <span className="font-body-md font-medium text-on-surface">{c.name}</span>
                    </div>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noreferrer" className="material-symbols-outlined text-outline group-hover:text-primary text-sm transition-colors">open_in_new</a>
                    )}
                  </div>
                  <div className="flex items-center gap-4 pl-5">
                    <span className="font-data-mono text-[10px] text-outline">Share: <span className="text-on-surface">{c.market_share_pct}%</span></span>
                    <span className="font-data-mono text-[10px] text-outline">Gap: <span className="text-secondary">{c.gap || 'N/A'}</span></span>
                  </div>
                </div>
              ))}
              
              {competitorIntel.competitive_advantage_score && (
                <div className="mt-4 p-3 border border-primary/20 bg-primary/5 rounded-lg flex items-center justify-between">
                  <span className="font-label-caps text-[10px] text-primary">COMPETITIVE ADVANTAGE SCORE</span>
                  <span className="font-orbitron font-bold text-primary">{competitorIntel.competitive_advantage_score}/100</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 4: SWOT ────────────────────────────────────────── */}
      {swot && (
        <section className="space-y-4" id="swot">
          <h2 className="font-display-xl text-headline-lg-mobile text-on-surface orbitron">S.W.O.T. ANALYSIS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Strengths */}
            <div className="glass-panel rounded-lg p-5 border-t-2 border-tertiary-fixed min-h-[140px] flex flex-col gap-3">
              <div className="flex items-center gap-2 text-tertiary-fixed">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span className="font-label-caps text-[10px] uppercase">STRENGTHS</span>
              </div>
              <ul className="text-xs space-y-2 text-on-surface-variant">
                {(swot.strengths || []).map((s: string, i: number) => (
                  <li key={i} className="flex gap-2 items-start"><span className="text-tertiary-fixed/50 mt-0.5">•</span> <span>{s}</span></li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="glass-panel rounded-lg p-5 border-t-2 border-error min-h-[140px] flex flex-col gap-3">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span className="font-label-caps text-[10px] uppercase">WEAKNESSES</span>
              </div>
              <ul className="text-xs space-y-2 text-on-surface-variant">
                {(swot.weaknesses || []).map((w: string, i: number) => (
                  <li key={i} className="flex gap-2 items-start"><span className="text-error/50 mt-0.5">•</span> <span>{w}</span></li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="glass-panel rounded-lg p-5 border-t-2 border-primary min-h-[140px] flex flex-col gap-3">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[18px]">insights</span>
                <span className="font-label-caps text-[10px] uppercase">OPPORTUNITIES</span>
              </div>
              <ul className="text-xs space-y-2 text-on-surface-variant">
                {(swot.opportunities || []).map((o: string, i: number) => (
                  <li key={i} className="flex gap-2 items-start"><span className="text-primary/50 mt-0.5">•</span> <span>{o}</span></li>
                ))}
              </ul>
            </div>

            {/* Threats */}
            <div className="glass-panel rounded-lg p-5 border-t-2 border-secondary min-h-[140px] flex flex-col gap-3">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-[18px]">priority_high</span>
                <span className="font-label-caps text-[10px] uppercase">THREATS</span>
              </div>
              <ul className="text-xs space-y-2 text-on-surface-variant">
                {(swot.threats || []).map((t: string, i: number) => (
                  <li key={i} className="flex gap-2 items-start"><span className="text-secondary/50 mt-0.5">•</span> <span>{t}</span></li>
                ))}
              </ul>
            </div>

          </div>
        </section>
      )}

      {/* ── Section 5: Risk Assessment ───────────────────────────── */}
      {riskAssessment && (
        <section className="space-y-4" id="risks">
          <h2 className="font-display-xl text-headline-lg-mobile text-on-surface orbitron">RISK PROFILES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {[
               ['legal_regulatory', 'Legal & Regulatory', 'gavel'],
               ['market', 'Market Risk', 'monitoring'],
               ['financial', 'Financial Risk', 'attach_money'],
               ['product_tech', 'Product & Tech', 'memory'],
               ['competitive', 'Competitive', 'swords'],
               ['execution_team', 'Execution & Team', 'groups'],
             ].map(([key, label, icon]) => {
               const risk = (riskAssessment as any)[key]
               if (!risk) return null
               const isHigh = risk.level === 'High' || risk.level === 'Critical'
               const isMed = risk.level === 'Medium'
               return (
                 <div key={key} className="glass-panel rounded-lg p-4 flex gap-4 items-start hover:border-outline-variant transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isHigh ? 'bg-error/10 text-error' : isMed ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                         <span className="font-label-caps text-[10px] text-on-surface uppercase">{label}</span>
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isHigh ? 'bg-error/20 text-error' : isMed ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>{risk.level}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">{risk.description}</p>
                    </div>
                 </div>
               )
             })}
          </div>
        </section>
      )}

    </div>
  )
}
