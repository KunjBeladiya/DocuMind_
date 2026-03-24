import { create } from 'zustand';
import type { SummaryResponse } from '../types';
import { summariesApi } from '../services/api';

interface SummaryState {
  summaries: Record<string, SummaryResponse[]>;
  isLoading: boolean;
  isGenerating: boolean;

  fetchSummaries: (chatId: string) => Promise<void>;
  generateSummary: (chatId: string, type: string) => Promise<void>;
  deleteSummary: (chatId: string, summaryId: string) => Promise<void>;
}

export const useSummaryStore = create<SummaryState>((set) => ({
  summaries: {},
  isLoading: false,
  isGenerating: false,

  fetchSummaries: async (chatId: string) => {
    set({ isLoading: true });
    try {
      const fetchedSummaries = await summariesApi.listByChat(chatId);
      // Ensure latest generated summaries appear at top
      fetchedSummaries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      set((state) => ({
        summaries: { ...state.summaries, [chatId]: fetchedSummaries },
        isLoading: false,
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  generateSummary: async (chatId: string, type: string) => {
    set({ isGenerating: true });
    try {
      const generatedSummary = await summariesApi.create(chatId, { type });
      set((state) => ({
        summaries: {
          ...state.summaries,
          // Prepend the new summary
          [chatId]: [generatedSummary, ...(state.summaries[chatId] || [])],
        },
        isGenerating: false,
      }));
    } catch (err) {
      set({ isGenerating: false });
      throw err;
    }
  },

  deleteSummary: async (chatId: string, summaryId: string) => {
    await summariesApi.delete(summaryId);
    set((state) => ({
      summaries: {
        ...state.summaries,
        [chatId]: (state.summaries[chatId] || []).filter((s) => s.id !== summaryId),
      },
    }));
  },
}));
