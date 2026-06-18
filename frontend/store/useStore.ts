import { create } from 'zustand';

interface AppState {
  startupContext: any | null;
  businessValidation: any | null;
  marketIntelligence: any | null;
  founderAnalysis: any | null;
  investorFeedback: any | null;
  strategy: any | null;
  isLoading: boolean;
  // Full evaluation result stored for negotiation context
  fullEvaluation: any | null;
  setResults: (data: any) => void;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  startupContext: null,
  businessValidation: null,
  marketIntelligence: null,
  founderAnalysis: null,
  investorFeedback: null,
  strategy: null,
  isLoading: false,
  fullEvaluation: null,
  setResults: (data) => set({
    startupContext: data.startup_context,
    businessValidation: data.business_validation,
    marketIntelligence: data.market_intelligence,
    founderAnalysis: data.founder_analysis,
    investorFeedback: data.investor_feedback,
    strategy: data.strategy,
    // Store full context so negotiation can use it
    fullEvaluation: {
      startup_context: data.startup_context,
      business_validation: data.business_validation,
      market_intelligence: data.market_intelligence,
      founder_analysis: data.founder_analysis,
      investor_feedback: data.investor_feedback,
      strategy: data.strategy,
    },
  }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
