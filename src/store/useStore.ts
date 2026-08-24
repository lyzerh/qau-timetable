import { create } from 'zustand';

type AppState = {
  viewingWeek: number | null; // null means auto-calculate current week
  setViewingWeek: (week: number | null) => void;
};

export const useStore = create<AppState>((set) => ({
  viewingWeek: null,
  setViewingWeek: (week) => set({ viewingWeek: week }),
}));
