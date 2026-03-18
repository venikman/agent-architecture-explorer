import { create } from 'zustand';

interface AppState {
  activeView: string;
  setActiveView: (id: string) => void;
  healthcareMode: boolean;
  toggleHealthcare: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'augmented-llm',
  setActiveView: (id) => set({ activeView: id }),
  healthcareMode: false,
  toggleHealthcare: () => set((s) => ({ healthcareMode: !s.healthcareMode })),
}));
