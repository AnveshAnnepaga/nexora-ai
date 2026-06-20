import { create } from 'zustand';

interface AuthStore {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  role: 'entrepreneur' | 'investor' | null;
  login: (userData: any, token: string, role: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  role: null,
  login: (userData, token, role) => set({ 
    isAuthenticated: true, 
    user: userData, 
    token, 
    role: role as 'entrepreneur' | 'investor' 
  }),
  logout: () => set({ 
    isAuthenticated: false, 
    user: null, 
    token: null, 
    role: null 
  }),
}));
