"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import ReactMarkdown from 'react-markdown'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts'
import { AlertTriangle, TrendingUp, ShieldAlert, Target } from 'lucide-react'

// ── Score Ring ──────────────────────────────────────────────
function ScoreRing({ score, label, color = '#3b82f6', size = 90 }: {
  score: number; label: string; color?: string; size?: number
}) {
  const r = 38; const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(score, 100) / 100) * circ
  const col = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#1a2235" strokeWidth="8" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={col} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
        <text x="45" y="49" textAnchor="middle" fill="#f1f5f9" fontSize="18" fontWeight="bold">{score}</text>
      </svg>
      <span className="text-xs text-slate-400 text-center font-medium leading-tight">{label}</span>
    </div>
  )
}

// ── Risk Badge ──────────────────────────────────────────────
function RiskBadge({ level }: { level: string }) {
  const cfg: Record<string, { emoji: string; cls: string }> = {
    Low: { emoji: '🟢', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    Medium: { emoji: '🟡', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    High: { emoji: '🔴', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    Critical: { emoji: '🚨', cls: 'bg-red-700/10 text-red-300 border-red-700/30' },
  }
  const c = cfg[level] || cfg.Medium
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold ${c.cls}`}>
      {c.emoji} {level}
    </span>
  )
}

// ── Section Heading ─────────────────────────────────────────
function SectionHead({ title, icon: Icon, accent = 'blue' }: { title: string; icon?: any; accent?: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-400 border-blue-500/30',
    green: 'text-emerald-400 border-emerald-500/30',
    purple: 'text-purple-400 border-purple-500/30',
    orange: 'text-orange-400 border-orange-500/30',
    red: 'text-red-400 border-red-500/30',
  }
  return (
    <div className={`flex items-center gap-2 pb-3 mb-5 border-b ${colors[accent]}`}>
      {Icon && <Icon className="w-5 h-5" />}
      <h3 className="text-lg font-bold text-white">{title}</h3>
    </div>
  )
}

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export default function AnalysisDashboard() {
  const {
    ideaScores, founderScores, marketResearch,
    competitorIntel, businessModelEval, swot,
    riskAssessment, healthDashboard
  } = useStore()

  if (!healthDashboard) return null

  // ── Health Radar Data ─────────────────────────────────────
  const radarData = [
    { subject: 'Idea', value: healthDashboard.idea_score || 0, fullMark: 100 },
    { subject: 'Founder', value: healthDashboard.founder_score || 0, fullMark: 100 },
    { subject: 'Market', value: healthDashboard.market_score || 0, fullMark: 100 },
    { subject: 'Product', value: healthDashboard.product_score || 0, fullMark: 100 },
    { subject: 'Financial', value: healthDashboard.financial_score || 0, fullMark: 100 },
    { subject: 'Growth', value: healthDashboard.growth_potential || 0, fullMark: 100 },
    { subject: 'Risk', value: healthDashboard.risk_score || 0, fullMark: 100 },
  ]

  // ── Competitor Pie Data ───────────────────────────────────
  const competitors = competitorIntel?.competitors || []
  const pieData = [
    ...competitors.map((c: any) => ({ name: c.name, value: c.market_share_pct || 10 })),
    ...(competitorIntel?.market_share_unaddressed_pct
      ? [{ name: 'Unaddressed', value: competitorIntel.market_share_unaddressed_pct }]
      : [])
  ]

  return (
    <div className="space-y-8">

      {/* ── 3H: Health Dashboard ─────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
        <SectionHead title="3H — Startup Health Dashboard" icon={Target} accent="blue" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* Score Cards */}
          <div className="grid grid-cols-4 gap-4">
            <ScoreRing score={healthDashboard.idea_score || 0} label="Idea" />
            <ScoreRing score={healthDashboard.founder_score || 0} label="Founder" />
            <ScoreRing score={healthDashboard.market_score || 0} label="Market" />
            <ScoreRing score={healthDashboard.product_score || 0} label="Product" />
            <ScoreRing score={healthDashboard.financial_score || 0} label="Financial" />
            <ScoreRing score={healthDashboard.growth_potential || 0} label="Growth" />
            <ScoreRing score={healthDashboard.risk_score || 0} label="Risk" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-[90px] h-[90px] rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-2xl font-black text-white">{healthDashboard.overall_score}</span>
              </div>
              <span className="text-xs text-slate-300 font-bold text-center">OVERALL</span>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e2d47" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                <Radar name="Startup" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* ── 3A: Idea Scores ──────────────────────────────────── */}
      {ideaScores && !ideaScores.error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
          <SectionHead title="3A — Idea Intelligence Scores" icon={TrendingUp} accent="purple" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            {[
              ['problem_solution_fit', 'Problem-Solution Fit'],
              ['innovation', 'Innovation'],
              ['market_demand', 'Market Demand'],
              ['scalability', 'Scalability'],
              ['feasibility', 'Feasibility'],
              ['uniqueness', 'Uniqueness'],
              ['revenue_potential', 'Revenue Potential'],
              ['risk_assessment', 'Risk Assessment'],
            ].map(([key, label]) => (
              <ScoreRing key={key} score={ideaScores[key] || 0} label={label} size={80} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-emerald-400">{ideaScores.success_probability}%</p>
              <p className="text-sm text-emerald-300 mt-1 font-semibold">Success Probability</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-red-400">{ideaScores.failure_probability}%</p>
              <p className="text-sm text-red-300 mt-1 font-semibold">Failure Probability</p>
            </div>
          </div>
          {ideaScores.justifications && (
            <div className="mt-4 space-y-2">
              {Object.entries(ideaScores.justifications).map(([k, v]: any) => (
                <div key={k} className="flex gap-2 text-sm">
                  <span className="text-slate-500 shrink-0 font-medium capitalize">{k.replace(/_/g,' ')}:</span>
                  <span className="text-slate-300">{v}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── 3B: Founder Scores ───────────────────────────────── */}
      {founderScores && !founderScores.error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
          <SectionHead title="3B — Founder Intelligence Scores" accent="orange" />
          {!founderScores.has_video && (
            <div className="mb-4 flex items-center gap-2 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              No video uploaded — scores derived from written pitch and Q&A session
            </div>
          )}
          <div className="grid grid-cols-4 md:grid-cols-7 gap-4 mb-4">
            {[
              ['communication_clarity', 'Comm. Clarity'],
              ['confidence', 'Confidence'],
              ['passion', 'Passion'],
              ['domain_expertise', 'Domain Expert'],
              ['leadership_signal', 'Leadership'],
              ['presentation_quality', 'Presentation'],
              ['credibility', 'Credibility'],
            ].map(([key, label]) => (
              <ScoreRing key={key} score={founderScores[key] || 0} label={label} size={75} />
            ))}
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center mt-2">
            <p className="text-4xl font-black text-gradient">{founderScores.overall_founder_score}</p>
            <p className="text-sm text-blue-300 mt-1 font-semibold">Overall Founder Score / 100</p>
          </div>
        </motion.div>
      )}

      {/* ── 3C: Market Research ───────────────────────────────── */}
      {marketResearch && !marketResearch.error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
          <SectionHead title="3C — Market Research Engine" accent="green" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'TAM', val: marketResearch.tam, color: 'blue' },
              { label: 'SAM', val: marketResearch.sam, color: 'purple' },
              { label: 'SOM', val: marketResearch.som, color: 'emerald' },
            ].map(({ label, val, color }) => (
              <div key={label} className={`ag-card p-4 text-center border-${color}-500/20`}>
                <p className="text-2xl font-black text-white mb-1">{label}</p>
                <p className="text-sm text-slate-300">{val}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-[#0d1424] rounded-lg p-3">
              <span className="text-slate-500 font-medium">Growth Rate: </span>
              <span className="text-emerald-400 font-semibold">{marketResearch.growth_rate}</span>
            </div>
            <div className="bg-[#0d1424] rounded-lg p-3">
              <span className="text-slate-500 font-medium">Saturation: </span>
              <span className="text-yellow-400 font-semibold">{marketResearch.saturation}</span>
            </div>
          </div>
          {marketResearch.opportunities && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-400 mb-2">Top Opportunities</p>
              <div className="space-y-1">
                {marketResearch.opportunities.map((opp: string, i: number) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-blue-500 font-bold shrink-0">→</span>
                    <span className="text-slate-300">{opp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {marketResearch.future_demand && (
            <div className="mt-4 bg-[#0d1424] rounded-lg p-4 text-sm text-slate-300 italic border-l-2 border-blue-500/40">
              <p className="text-xs font-semibold text-slate-500 mb-1">3-5 Year Demand Prediction</p>
              {marketResearch.future_demand}
            </div>
          )}
        </motion.div>
      )}

      {/* ── 3D: Competitor Intel ─────────────────────────────── */}
      {competitorIntel && !competitorIntel.error && competitors.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
          <SectionHead title="3D — Competitor Intelligence" accent="red" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competitor Table */}
            <div className="space-y-3">
              {competitors.map((c: any, i: number) => (
                <div key={i} className="bg-[#0d1424] rounded-xl p-4 border border-[#1e2d47]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="font-bold text-slate-100">{c.name}</span>
                    {c.is_yc && <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-bold">YC</span>}
                    <span className="ml-auto text-xs text-slate-500">{c.market_share_pct}% share</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{c.funding}</p>
                  <p className="text-xs text-blue-400 font-medium">Gap: {c.gap}</p>
                </div>
              ))}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-sm font-semibold text-emerald-300 mb-1">
                  Competitive Advantage Score: {competitorIntel.competitive_advantage_score}/100
                </p>
                <p className="text-xs text-slate-400">{competitorIntel.competitive_advantage_summary}</p>
              </div>
            </div>
            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    dataKey="value" nameKey="name" paddingAngle={2}
                  >
                    {pieData.map((_: any, index: number) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 8, color: '#f1f5f9' }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 3E: Business Model ───────────────────────────────── */}
      {businessModelEval && !businessModelEval.error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
          <SectionHead title="3E — Business Model Evaluation" accent="green" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'CAC', val: businessModelEval.cac_estimate },
              { label: 'LTV', val: businessModelEval.ltv_estimate },
              { label: 'LTV:CAC', val: businessModelEval.ltv_cac_ratio },
              { label: 'Payback', val: businessModelEval.payback_period },
            ].map(({ label, val }) => (
              <div key={label} className="bg-[#0d1424] border border-[#1e2d47] rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 font-semibold mb-1">{label}</p>
                <p className="text-lg font-bold text-white">{val || 'N/A'}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#0d1424] rounded-lg p-4 text-sm text-slate-300 mb-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">Break-Even Estimate</p>
            {businessModelEval.breakeven_estimate}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Sustainability Score</span>
            <div className="flex-1 bg-[#1a2235] rounded-full h-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all"
                style={{ width: `${businessModelEval.sustainability_score || 0}%` }} />
            </div>
            <span className="text-sm font-bold text-white">{businessModelEval.sustainability_score}/100</span>
          </div>
        </motion.div>
      )}

      {/* ── 3F: SWOT ─────────────────────────────────────────── */}
      {swot && !swot.error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
          <SectionHead title="3F — SWOT Analysis" accent="purple" />
          <div className="grid grid-cols-2 gap-4">
            {([
              { key: 'strengths', label: '💪 Strengths', cls: 'swot-strengths' },
              { key: 'weaknesses', label: '⚠️ Weaknesses', cls: 'swot-weaknesses' },
              { key: 'opportunities', label: '🚀 Opportunities', cls: 'swot-opportunities' },
              { key: 'threats', label: '⚡ Threats', cls: 'swot-threats' },
            ] as const).map(({ key, label, cls }) => (
              <div key={key} className={`rounded-xl p-4 ${cls}`}>
                <p className="font-bold text-sm mb-3">{label}</p>
                <ul className="space-y-2">
                  {(swot[key] || []).map((item: string, i: number) => (
                    <li key={i} className="text-xs text-slate-300 flex gap-2">
                      <span className="text-slate-500 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── 3G: Risk Assessment ──────────────────────────────── */}
      {riskAssessment && !riskAssessment.error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card p-6">
          <SectionHead title="3G — Risk Detection System" icon={ShieldAlert} accent="red" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              ['legal_regulatory', '⚖️ Legal & Regulatory'],
              ['market', '📈 Market'],
              ['financial', '💰 Financial'],
              ['product_tech', '🔧 Product & Tech'],
              ['competitive', '🥊 Competitive'],
              ['execution_team', '👥 Execution & Team'],
            ].map(([key, label]) => {
              const risk = (riskAssessment as any)[key]
              if (!risk || typeof risk !== 'object') return null
              return (
                <div key={key} className="bg-[#0d1424] border border-[#1e2d47] rounded-xl p-4 flex gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-200">{label}</span>
                      <RiskBadge level={risk.level} />
                    </div>
                    <p className="text-xs text-slate-400">{risk.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
          {riskAssessment.top_risk && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-400 mb-1">🚨 Top Risk</p>
              <p className="text-sm text-slate-300">{riskAssessment.top_risk}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
