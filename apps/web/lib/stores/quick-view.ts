'use client';

import { create } from 'zustand';

interface QuickViewState {
  slug: string | null;
  isOpen: boolean;
  open: (slug: string) => void;
  close: () => void;
}

export const useQuickViewStore = create<QuickViewState>((set) => ({
  slug: null,
  isOpen: false,
  open: (slug) => set({ slug, isOpen: true }),
  close: () => set({ isOpen: false }),
}));
