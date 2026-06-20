"use client"
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import InvestorConnectPanel from '@/components/InvestorConnectPanel'

function PitchDeckViewer({ pitchDeck }: { pitchDeck: any }) {
  const [slide, setSlide] = useState(0)
  const slides = pitchDeck?.slides || []
  if (!slides.length) return null
  const cur = slides[slide]
  return (
    <div className="space-y-4">
      {/* Slide Dots */}
      <div className="flex gap-2 mb-4 flex-wrap overflow-x-auto no-scrollbar">
        {slides.map((_: any, i: number) => (
          <button key={i} onClick={() => setSlide(i)}
            className={`w-8 h-8 rounded-lg text-xs font-data-mono font-bold transition-all shrink-0
              ${i === slide ? 'bg-primary text-on-primary shadow-[0_0_8px_#00d4ff]' : 'bg-surface-container-highest text-outline hover:bg-surface-variant'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {/* Slide Card */}
      <div className="glass-panel border-l-4 border-primary rounded-xl p-8 min-h-[280px] relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 opacity-5 group-hover:opacity-10 transition-opacity">
          <span className="material-symbols-outlined text-9xl">presentation</span>
        </div>
        <div className="flex items-start justify-between mb-6 relative z-10">
          <div>
            <span className="font-label-caps text-[10px] text-primary uppercase tracking-widest">SLIDE {cur.slide_number} / {slides.length}</span>
            <h4 className="font-display-xl text-2xl font-bold text-on-surface mt-1">{cur.title}</h4>
          </div>
        </div>
        <ul className="space-y-4 relative z-10">
          {(cur.bullets || cur.content_bullets || []).map((b: string, i: number) => (
            <li key={i} className="flex gap-4 items-start text-on-surface-variant">
              <span className="w-6 h-6 bg-primary/10 border border-primary/30 rounded flex items-center justify-center font-data-mono text-[10px] text-primary shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-sm leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Nav Buttons */}
      <div className="flex gap-4 mt-4">
        <button onClick={() => setSlide(Math.max(0, slide - 1))} disabled={slide === 0}
          className="flex items-center gap-2 px-6 py-2 border border-outline-variant/30 disabled:opacity-30 hover:bg-surface-variant text-on-surface-variant rounded-lg font-label-caps text-[10px] transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_left</span> PREV
        </button>
        <button onClick={() => setSlide(Math.min(slides.length - 1, slide + 1))} disabled={slide === slides.length - 1}
          className="flex items-center gap-2 px-6 py-2 bg-primary/10 border border-primary/30 hover:bg-primary/20 disabled:opacity-30 text-primary rounded-lg font-label-caps text-[10px] transition-all ml-auto"
        >
          NEXT <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>
    </div>
  )
}

export default function StrategicOutput() {
  const { budget, pitchDeck, roadmap, subscriptionPlan, fundingReadiness, teamAnalysis, intake } = useStore()

  if (!budget && !pitchDeck) return null

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto mt-8 border-t border-outline-variant/20 pt-8">

      {/* ── Section: Roadmap ───────────────────────────────────────── */}
      {roadmap && (
        <section className="space-y-4" id="roadmap">
          <h2 className="font-display-xl text-headline-lg-mobile text-on-surface orbitron">LAUNCH ROADMAP</h2>
          <div className="glass-panel rounded-xl overflow-hidden">
             
             {/* Timeline Flow */}
             <div className="p-6 space-y-6">
               {[
                 { key: 'day_30', label: '30 DAYS', color: 'bg-primary shadow-[0_0_8px_#00D4FF]', title: 'MVP Alpha Testing' },
                 { key: 'day_90', label: '90 DAYS', color: 'bg-secondary shadow-[0_0_8px_#6800ec]', title: 'Market Validation' },
                 { key: 'month_6', label: '6 MONTHS', color: 'bg-tertiary shadow-[0_0_8px_#00ff94]', title: 'Growth Engine' },
                 { key: 'year_1', label: '1 YEAR', color: 'bg-error shadow-[0_0_8px_#ffb4ab]', title: 'Scale & Series A' },
               ].map(({ key, label, color, title }, i) => (
                 <div key={key} className="flex gap-4">
                   <div className="shrink-0 flex flex-col items-center">
                     <div className="font-label-caps text-[10px] text-outline mb-2 w-16 text-right">{label}</div>
                   </div>
                   <div className="shrink-0 flex flex-col items-center">
                     <div className={`w-3 h-3 rounded-full ${color}`}></div>
                     {i !== 3 && <div className="w-0.5 h-full bg-outline-variant/30 my-1"></div>}
                   </div>
                   <div className="pb-6">
                     <div className="font-body-md font-semibold text-on-surface">{title}</div>
                     <ul className="text-xs text-on-surface-variant mt-2 space-y-1">
                       {((roadmap as any)[key] || []).map((item: string, j: number) => (
                         <li key={j} className="flex gap-2">
                           <span className="text-outline shrink-0">-</span> {item}
                         </li>
                       ))}
                     </ul>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </section>
      )}

      {/* ── Section: Pitch Deck ────────────────────────────────────── */}
      {pitchDeck && (
        <section className="space-y-4" id="pitchdeck">
          <h2 className="font-display-xl text-headline-lg-mobile text-on-surface orbitron">PITCH DECK GENERATOR</h2>
          <PitchDeckViewer pitchDeck={pitchDeck} />
        </section>
      )}

      {/* ── Section: Financial Strategy ────────────────────────────── */}
      {budget && (
        <section className="space-y-4" id="financial">
          <h2 className="font-display-xl text-headline-lg-mobile text-on-surface orbitron">FINANCIAL STRATEGY</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel rounded-xl p-4 border-l-4 border-primary hover:bg-primary/5 transition-colors">
              <span className="font-label-caps text-[10px] text-outline">MVP BUILD COST</span>
              <div className="orbitron text-2xl font-bold text-on-surface mt-1">{budget.mvp_cost || 'N/A'}</div>
            </div>
            <div className="glass-panel rounded-xl p-4 border-l-4 border-secondary hover:bg-secondary/5 transition-colors">
              <span className="font-label-caps text-[10px] text-outline">6-MONTH BUDGET</span>
              <div className="orbitron text-2xl font-bold text-on-surface mt-1">{budget.budget_6m || 'N/A'}</div>
            </div>
            <div className="glass-panel rounded-xl p-4 border-l-4 border-tertiary hover:bg-tertiary/5 transition-colors">
              <span className="font-label-caps text-[10px] text-outline">12-MONTH BUDGET</span>
              <div className="orbitron text-2xl font-bold text-on-surface mt-1">{budget.budget_12m || 'N/A'}</div>
            </div>
          </div>

          <div className="glass-panel border-l-2 border-primary/40 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl">account_balance</span>
            </div>
            <div className="flex-1">
              <p className="font-label-caps text-[10px] text-outline">RECOMMENDED FUNDING ASK (SEED STAGE)</p>
              <p className="orbitron text-3xl font-black text-primary drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]">{budget.funding_ask}</p>
            </div>
            <div className="flex flex-col gap-2 md:text-right border-t md:border-t-0 md:border-l border-outline-variant/30 pt-4 md:pt-0 md:pl-6">
              <div>
                <p className="font-label-caps text-[9px] text-outline">MONTHLY BURN</p>
                <p className="font-data-mono text-on-surface font-bold">{budget.burn_rate_monthly}</p>
              </div>
              <div>
                <p className="font-label-caps text-[9px] text-outline">RUNWAY</p>
                <p className="font-data-mono text-on-surface font-bold">{budget.runway_months} months</p>
              </div>
            </div>
          </div>

          {budget.breakdown && (
            <div className="glass-panel rounded-xl p-6">
              <span className="font-label-caps text-[10px] text-outline block mb-4">CAPITAL ALLOCATION</span>
              <div className="space-y-3">
                {Object.entries(budget.breakdown).map(([cat, data]: any) => (
                  <div key={cat} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/10 pb-2">
                    <span className="font-body-sm font-medium text-on-surface capitalize w-48 shrink-0">{cat.replace(/_/g, ' ')}</span>
                    <span className="font-data-mono text-primary font-bold">{data.amount}</span>
                    <span className="text-[11px] text-on-surface-variant sm:ml-auto">{data.notes}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Section: Team Analysis ─────────────────────────────────── */}
      {teamAnalysis && (
        <section className="space-y-4" id="team">
          <h2 className="font-display-xl text-headline-lg-mobile text-on-surface orbitron">TEAM READINESS</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { label: 'TEAM BALANCE', val: teamAnalysis.team_balance_score, color: 'primary' },
               { label: 'TECHNICAL', val: teamAnalysis.tech_score, color: 'secondary' },
               { label: 'BUSINESS', val: teamAnalysis.business_score, color: 'tertiary' },
               { label: 'CREATIVE', val: teamAnalysis.creative_score, color: 'error' },
             ].map(({ label, val, color }) => (
               <div key={label} className="glass-panel border border-outline-variant/20 rounded-xl p-4 text-center">
                 <p className={`orbitron text-2xl font-black text-${color}`}>{val || '?'}</p>
                 <p className="font-label-caps text-[9px] text-outline mt-1">{label}</p>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel rounded-lg p-5 border-t-2 border-error">
               <div className="flex items-center gap-2 text-error mb-3">
                 <span className="material-symbols-outlined text-[16px]">block</span>
                 <span className="font-label-caps text-[10px]">SKILL GAPS</span>
               </div>
               <ul className="text-xs space-y-2 text-on-surface-variant">
                 {(teamAnalysis.skill_gaps || []).map((g: string, i: number) => (
                   <li key={i} className="flex gap-2 items-start"><span className="text-error/50 mt-0.5">-</span> <span>{g}</span></li>
                 ))}
               </ul>
            </div>

            <div className="glass-panel rounded-lg p-5 border-t-2 border-primary">
               <div className="flex items-center gap-2 text-primary mb-3">
                 <span className="material-symbols-outlined text-[16px]">person_add</span>
                 <span className="font-label-caps text-[10px]">HIRING PRIORITIES</span>
               </div>
               <ul className="text-xs space-y-2 text-on-surface-variant">
                 {(teamAnalysis.missing_roles || []).map((r: any, i: number) => (
                   <li key={i} className="flex gap-2 items-start">
                     <span className={`font-label-caps text-[8px] px-1 py-0.5 rounded mt-0.5 shrink-0 ${r.priority === 'Critical' ? 'bg-error/20 text-error' : r.priority === 'High' ? 'bg-secondary/20 text-secondary' : 'bg-tertiary/20 text-tertiary'}`}>{r.priority}</span>
                     <span><strong className="text-on-surface">{r.role}</strong> — {r.reason}</span>
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
