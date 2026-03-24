import { create } from 'zustand';
import type { QuizResponse, QuizGenerateRequest, QuizSubmitRequest, QuizResultResponse } from '../types';
import { quizzesApi } from '../services/api';

interface QuizState {
  quizzes: Record<string, QuizResponse[]>;
  isLoading: boolean;
  isGenerating: boolean;

  fetchQuizzes: (chatId: string) => Promise<void>;
  generateQuiz: (chatId: string, data: QuizGenerateRequest) => Promise<QuizResponse>;
  submitQuiz: (chatId: string, quizId: string, data: QuizSubmitRequest) => Promise<QuizResultResponse>;
  deleteQuiz: (chatId: string, quizId: string) => Promise<void>;
}

export const useQuizStore = create<QuizState>((set) => ({
  quizzes: {},
  isLoading: false,
  isGenerating: false,

  fetchQuizzes: async (chatId: string) => {
    set({ isLoading: true });
    try {
      const fetchedQuizzes = await quizzesApi.listByChat(chatId);
      set((state) => ({
        quizzes: { ...state.quizzes, [chatId]: fetchedQuizzes },
        isLoading: false,
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  generateQuiz: async (chatId: string, data: QuizGenerateRequest) => {
    set({ isGenerating: true });
    try {
      const generatedQuiz = await quizzesApi.generate(chatId, data);
      set((state) => ({
        quizzes: {
          ...state.quizzes,
          [chatId]: [generatedQuiz, ...(state.quizzes[chatId] || [])],
        },
        isGenerating: false,
      }));
      return generatedQuiz;
    } catch (err) {
      set({ isGenerating: false });
      throw err;
    }
  },

  submitQuiz: async (chatId: string, quizId: string, data: QuizSubmitRequest) => {
    try {
      const result = await quizzesApi.submit(quizId, data);
      // Update the quiz status and score locally
      set((state) => {
        const chatQuizzes = state.quizzes[chatId] || [];
        const updatedQuizzes = chatQuizzes.map((q) => {
          if (q.id === quizId) {
            return {
              ...q,
              status: result.status,
              score: result.score,
              total_marks: result.total_marks,
            };
          }
          return q;
        });

        return {
          quizzes: {
            ...state.quizzes,
            [chatId]: updatedQuizzes,
          },
        };
      });
      return result;
    } catch (err) {
      throw err;
    }
  },

  deleteQuiz: async (chatId: string, quizId: string) => {
    await quizzesApi.delete(quizId);
    set((state) => ({
      quizzes: {
        ...state.quizzes,
        [chatId]: (state.quizzes[chatId] || []).filter((q) => q.id !== quizId),
      },
    }));
  },
}));
