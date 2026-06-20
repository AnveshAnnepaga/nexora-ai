import { create } from 'zustand';

export interface ANTIGRAVITYStore {
  // ── Phase 1: Intake Form ─────────────────────────────
  intake: {
    startup_name: string;
    video_content: string;
    idea_text: string;
    pdf_content: string;
  };
  setIntake: (field: string, value: string) => void;
  resetIntake: () => void;

  // ── Phase 2: Interrogation ───────────────────────────
  interrogationHistory: Array<{ role: string; content: string }>;
  interrogationSummary: string;
  weakZones: string[];
  domainsCompleted: string[];
  currentDomain: string;
  addInterrogationMessage: (msg: { role: string; content: string }) => void;
  completeInterrogation: (summary: string, weakZones: string[]) => void;
  resetInterrogation: () => void;

  // ── Phase 3+4: Analysis Results ──────────────────────
  ideaScores: any | null;
  founderScores: any | null;
  marketResearch: any | null;
  competitorIntel: any | null;
  businessModelEval: any | null;
  swot: any | null;
  riskAssessment: any | null;
  healthDashboard: any | null;
  budget: any | null;
  pitchDeck: any | null;
  roadmap: any | null;
  subscriptionPlan: any | null;
  investorMatching: any | null;
  fundingReadiness: any | null;
  teamAnalysis: any | null;
  setResults: (data: any) => void;

  // ── UI State ─────────────────────────────────────────
  phase: 'intake' | 'interrogation' | 'analyzing' | 'results';
  setPhase: (phase: 'intake' | 'interrogation' | 'analyzing' | 'results') => void;
  isLoading: boolean;
  setLoading: (v: boolean) => void;
  error: string | null;
  setError: (e: string | null) => void;
}

const defaultIntake = {
  startup_name: '',
  video_content: '',
  idea_text: '',
  pdf_content: '',
};

export const useStore = create<ANTIGRAVITYStore>((set) => ({
  // Intake
  intake: { ...defaultIntake },
  setIntake: (field, value) =>
    set((s) => ({ intake: { ...s.intake, [field]: value } })),
  resetIntake: () => set({ intake: { ...defaultIntake } }),

  // Interrogation
  interrogationHistory: [],
  interrogationSummary: '',
  weakZones: [],
  domainsCompleted: [],
  currentDomain: 'A',
  addInterrogationMessage: (msg) =>
    set((s) => ({ interrogationHistory: [...s.interrogationHistory, msg] })),
  completeInterrogation: (summary, weakZones) =>
    set({ interrogationSummary: summary, weakZones }),
  resetInterrogation: () =>
    set({ interrogationHistory: [], interrogationSummary: '', weakZones: [], domainsCompleted: [], currentDomain: 'A' }),

  // Results
  ideaScores: null,
  founderScores: null,
  marketResearch: null,
  competitorIntel: null,
  businessModelEval: null,
  swot: null,
  riskAssessment: null,
  healthDashboard: null,
  budget: null,
  pitchDeck: null,
  roadmap: null,
  subscriptionPlan: null,
  investorMatching: null,
  fundingReadiness: null,
  teamAnalysis: null,
  setResults: (data) =>
    set({
      ideaScores: data.idea_scores,
      founderScores: data.founder_scores,
      marketResearch: data.market_research,
      competitorIntel: data.competitor_intel,
      businessModelEval: data.business_model_eval,
      swot: data.swot,
      riskAssessment: data.risk_assessment,
      healthDashboard: data.health_dashboard,
      budget: data.budget,
      pitchDeck: data.pitch_deck,
      roadmap: data.roadmap,
      subscriptionPlan: data.subscription_plan,
      investorMatching: data.investor_matching,
      fundingReadiness: data.funding_readiness,
      teamAnalysis: data.team_analysis,
    }),

  // UI
  phase: 'intake',
  setPhase: (phase) => set({ phase }),
  isLoading: false,
  setLoading: (v) => set({ isLoading: v }),
  error: null,
  setError: (e) => set({ error: e }),
}));
