"use client"
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import ReactMarkdown from 'react-markdown'
import { DollarSign, FileText, Map, CreditCard, Users, TrendingUp, BarChart3, ChevronLeft, ChevronRight, Star } from 'lucide-react'

function SectionHead({ title, icon: Icon, accent = 'blue' }: { title: string; icon?: any; accent?: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-400 border-blue-500/30',
    green: 'text-emerald-400 border-emerald-500/30',
    purple: 'text-purple-400 border-purple-500/30',
    orange: 'text-orange-400 border-orange-500/30',
  }
  return (
    <div className={`flex items-center gap-2 pb-3 mb-5 border-b ${colors[accent]}`}>
      {Icon && <Icon className="w-5 h-5" />}
      <h3 className="text-lg font-bold text-white">{title}</h3>
    </div>
  )
}

// ── Pitch Deck Slide Navigator ──────────────────────────────
function PitchDeckViewer({ pitchDeck }: { pitchDeck: any }) {
  const [slide, setSlide] = useState(0)
  const slides = pitchDeck?.slides || []
  if (!slides.length) return null
  const cur = slides[slide]
  return (
    <div>
      {/* Slide Dots */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {slides.map((_: any, i: number) => (
          <button key={i} onClick={() => setSlide(i)}
            className={`w-7 h-7 rounded-md text-xs font-bold transition-all
              ${i === slide ? 'bg-blue-600 text-white' : 'bg-[#1a2235] text-slate-500 hover:bg-[#1e2d47]'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {/* Slide Card */}
      <div className="bg-gradient-to-br from-[#0d1424] to-[#111827] border border-[#1e2d47] rounded-2xl p-8 min-h-[280px]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Slide {cur.slide_number} / {slides.length}</span>
            <h4 className="text-2xl font-black text-white mt-1">{cur.title}</h4>
          </div>
        </div>
        <ul className="space-y-3">
          {(cur.bullets || cur.content_bullets || []).map((b: string, i: number) => (
            <li key={i} className="flex gap-3 text-slate-300">
              <span className="w-6 h-6 bg-blue-600/20 border border-blue-500/30 rounded flex items-center justify-center text-xs font-bold text-blue-400 shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-sm leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Nav Buttons */}
      <div className="flex gap-3 mt-4">
        <button onClick={() => setSlide(Math.max(0, slide - 1))} disabled={slide === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a2235] disabled:opacity-30 hover:bg-[#1e2d47] text-slate-300 rounded-lg text-sm transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <button onClick={() => setSlide(Math.min(slides.length - 1, slide + 1))} disabled={slide === slides.length - 1}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 disabled:opacity-30 hover:bg-blue-500 text-white rounded-lg text-sm transition-all ml-auto"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function StrategicOutput() {
  const { budget, pitchDeck, roadmap, subscriptionPlan, investorMatching, fundingReadiness, teamAnalysis } = useStore()

  if (!budget && !pitchDeck) return null

  const readinessColor = (score: number) =>
    score >= 70 ? 'text-emerald-400' : score >= 45 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="space-y-8">

      {/* ── 4A: Budget ────────────────────────────────────────── */}
      {budget && !budget.error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
          <SectionHead title="4A — Budget Estimation" icon={DollarSign} accent="green" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'MVP Build Cost', val: budget.mvp_cost, color: 'blue' },
              { label: '6-Month Budget', val: budget.budget_6m, color: 'purple' },
              { label: '12-Month Budget', val: budget.budget_12m, color: 'orange' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-[#0d1424] border border-[#1e2d47] rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-xl font-black text-white">{val || 'N/A'}</p>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-4 mb-6">
            <Star className="w-8 h-8 text-yellow-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Recommended Funding Ask (Seed Stage)</p>
              <p className="text-2xl font-black text-gradient">{budget.funding_ask}</p>
            </div>
            <div className="ml-auto text-right text-sm">
              <p className="text-slate-500">Monthly Burn</p>
              <p className="text-white font-bold">{budget.burn_rate_monthly}</p>
              <p className="text-slate-500 mt-1">Runway</p>
              <p className="text-white font-bold">{budget.runway_months} months</p>
            </div>
          </div>
          {budget.breakdown && (
            <div className="space-y-2">
              {Object.entries(budget.breakdown).map(([cat, data]: any) => (
                <div key={cat} className="flex items-center gap-4 py-2 border-b border-[#1e2d47] last:border-0">
                  <span className="text-sm font-semibold text-slate-300 capitalize w-44 shrink-0">
                    {cat.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-bold text-white">{data.amount}</span>
                  <span className="text-xs text-slate-500 ml-auto">{data.notes}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── 4B: Pitch Deck ────────────────────────────────────── */}
      {pitchDeck && !pitchDeck.error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
          <SectionHead title="4B — Investor Pitch Deck (12 Slides)" icon={FileText} accent="purple" />
          <PitchDeckViewer pitchDeck={pitchDeck} />
        </motion.div>
      )}

      {/* ── 4C: Roadmap ───────────────────────────────────────── */}
      {roadmap && !roadmap.error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
          <SectionHead title="4C — Startup Execution Roadmap" icon={Map} accent="blue" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'day_30', label: '30-Day Sprint', color: 'from-blue-600 to-blue-700' },
              { key: 'day_90', label: '90-Day Roadmap', color: 'from-purple-600 to-purple-700' },
              { key: 'month_6', label: '6-Month Plan', color: 'from-emerald-600 to-emerald-700' },
              { key: 'year_1', label: '1-Year Vision', color: 'from-orange-600 to-orange-700' },
            ].map(({ key, label, color }) => (
              <div key={key} className="bg-[#0d1424] border border-[#1e2d47] rounded-xl overflow-hidden">
                <div className={`bg-gradient-to-r ${color} px-4 py-2.5`}>
                  <p className="font-bold text-white text-sm">{label}</p>
                </div>
                <ul className="p-4 space-y-2.5">
                  {((roadmap as any)[key] || []).map((item: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-blue-500 font-bold shrink-0 mt-0.5">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── 4D: Subscription Plan ─────────────────────────────── */}
      {subscriptionPlan && !subscriptionPlan.error && subscriptionPlan.applicable && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
          <SectionHead title="4D — Subscription Plan" icon={CreditCard} accent="purple" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {(subscriptionPlan.tiers || []).map((tier: any, i: number) => (
              <div key={i} className={`rounded-xl border p-5 relative overflow-hidden
                ${i === 1 ? 'border-blue-500/40 bg-blue-500/5' : 'border-[#1e2d47] bg-[#0d1424]'}`}
              >
                {i === 1 && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    RECOMMENDED
                  </div>
                )}
                <p className="font-bold text-white text-lg">{tier.name}</p>
                <p className="text-2xl font-black text-gradient mt-1 mb-3">{tier.price}</p>
                <ul className="space-y-1.5 mb-3">
                  {(tier.features || []).map((f: string, j: number) => (
                    <li key={j} className="text-xs text-slate-300 flex gap-2">
                      <span className="text-emerald-500 shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-500 italic">{tier.target}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-[#0d1424] rounded-lg p-3">
              <span className="text-slate-500">Free → Paid Conversion: </span>
              <span className="text-blue-400 font-semibold">{subscriptionPlan.freemium_to_paid_conversion}</span>
            </div>
            <div className="bg-[#0d1424] rounded-lg p-3">
              <span className="text-slate-500">Annual Discount: </span>
              <span className="text-emerald-400 font-semibold">{subscriptionPlan.annual_discount}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 4E: Investor Matching ─────────────────────────────── */}
      {investorMatching && !investorMatching.error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
          <SectionHead title="4E — Investor Matchmaking" icon={TrendingUp} accent="orange" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {(investorMatching.vcs || []).map((vc: any, i: number) => (
              <div key={i} className="bg-[#0d1424] border border-[#1e2d47] rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-white">{vc.name}</p>
                    <p className="text-xs text-slate-500">{vc.stage} · {vc.focus}</p>
                  </div>
                  <div className={`text-sm font-black px-2 py-1 rounded-lg
                    ${vc.compatibility_score >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                      vc.compatibility_score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-700 text-slate-400'}`}
                  >
                    {vc.compatibility_score}%
                  </div>
                </div>
                <p className="text-xs text-slate-400">{vc.why}</p>
                {vc.notable_portfolio && (
                  <p className="text-xs text-blue-400 mt-1">Portfolio: {vc.notable_portfolio}</p>
                )}
              </div>
            ))}
          </div>
          {investorMatching.yc_fit && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <p className="font-bold text-orange-300">YCombinator Fit Assessment</p>
                <span className="text-2xl font-black text-gradient-gold">{investorMatching.yc_fit.score}/100</span>
                <span className="text-sm font-bold text-orange-400">{investorMatching.yc_fit.recommendation}</span>
              </div>
              <p className="text-sm text-slate-400">{investorMatching.yc_fit.reasoning}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── 4F: Funding Readiness ─────────────────────────────── */}
      {fundingReadiness && !fundingReadiness.error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
          <SectionHead title="4F — Funding Readiness Report" icon={BarChart3} accent="blue" />
          <div className="flex items-center gap-6 mb-6">
            <div className="text-center">
              <p className={`text-5xl font-black ${readinessColor(fundingReadiness.readiness_score)}`}>
                {fundingReadiness.readiness_score}
              </p>
              <p className="text-xs text-slate-500 mt-1">Readiness Score</p>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-white mb-2">{fundingReadiness.readiness_label}</p>
              <div className="w-full bg-[#1a2235] rounded-full h-3">
                <div className={`h-3 rounded-full transition-all duration-1000
                  ${fundingReadiness.readiness_score >= 70 ? 'bg-emerald-500' :
                    fundingReadiness.readiness_score >= 45 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${fundingReadiness.readiness_score}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Timeline: {fundingReadiness.timeline_to_raise}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Missing Documents', items: fundingReadiness.missing_docs, color: 'red' },
              { label: 'Financial Gaps', items: fundingReadiness.financial_gaps, color: 'yellow' },
              { label: 'Due Diligence Gaps', items: fundingReadiness.due_diligence_gaps, color: 'orange' },
            ].map(({ label, items, color }) => (
              <div key={label} className="bg-[#0d1424] rounded-lg p-3">
                <p className={`text-xs font-bold text-${color}-400 mb-2`}>{label}</p>
                <ul className="space-y-1">
                  {(items || []).map((it: string, i: number) => (
                    <li key={i} className="text-xs text-slate-400 flex gap-1.5">
                      <span className={`text-${color}-500`}>•</span>{it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-sm font-bold text-blue-300 mb-3">🎯 Top 3 Things To Fix Before Raising</p>
            {(fundingReadiness.top_3_fixes || []).map((fix: string, i: number) => (
              <div key={i} className="flex gap-3 text-sm text-slate-300 mb-2">
                <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">{i + 1}</span>
                {fix}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── 4G: Team Analysis ─────────────────────────────────── */}
      {teamAnalysis && !teamAnalysis.error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
          <SectionHead title="4G — Team Analysis" icon={Users} accent="green" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Team Balance', val: teamAnalysis.team_balance_score },
              { label: 'Technical', val: teamAnalysis.tech_score },
              { label: 'Business', val: teamAnalysis.business_score },
              { label: 'Creative', val: teamAnalysis.creative_score },
            ].map(({ label, val }) => (
              <div key={label} className="bg-[#0d1424] border border-[#1e2d47] rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-white">{val || '?'}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-300 mb-4 italic">{teamAnalysis.team_assessment}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-red-400 mb-2">🚫 Skill Gaps</p>
              <ul className="space-y-1">
                {(teamAnalysis.skill_gaps || []).map((g: string, i: number) => (
                  <li key={i} className="text-xs text-slate-400 flex gap-2">
                    <span className="text-red-500">•</span>{g}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-400 mb-2">👤 Hiring Priorities</p>
              <ul className="space-y-2">
                {(teamAnalysis.missing_roles || []).map((r: any, i: number) => (
                  <li key={i} className="text-xs text-slate-400">
                    <span className={`font-bold ${r.priority === 'Critical' ? 'text-red-400' : r.priority === 'High' ? 'text-orange-400' : 'text-yellow-400'}`}>
                      [{r.priority}]
                    </span>{' '}
                    {r.role} — {r.reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
