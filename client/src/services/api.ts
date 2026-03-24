import axios from 'axios';
import type {
  UserRegister,
  UserLogin,
  TokenResponse,
  UserResponse,
  ChatCreate,
  ChatResponse,
  MessageResponse,
  QuestionRequest,
  ChatUpdate,
  SummaryCreate,
  SummaryResponse,
  QuizGenerateRequest,
  QuizSubmitRequest,
  QuizResponse,
  QuizResultResponse,
} from '../types';
import { useAuthStore } from '../store/authStore';

const BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');

      // ✅ update Zustand state
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: UserRegister): Promise<UserResponse> =>
    api.post<UserResponse>('/auth/register', data).then((r) => r.data),

  login: (data: UserLogin): Promise<TokenResponse> =>
    api.post<TokenResponse>('/auth/login', data).then((r) => r.data),
};

// ─── Chats ─────────────────────────────────────────────────────────────────
export const chatsApi = {
  list: (): Promise<ChatResponse[]> =>
    api.get<ChatResponse[]>('/chats/').then((r) => r.data),

  create: (data: ChatCreate): Promise<ChatResponse> =>
    api.post<ChatResponse>('/chats/', data).then((r) => r.data),

  get: (chatId: string): Promise<ChatResponse> =>
    api.get<ChatResponse>(`/chats/${chatId}`).then((r) => r.data),

  update: (chatId: string, data: ChatUpdate): Promise<ChatResponse> =>
    api.patch<ChatResponse>(`/chats/${chatId}`, data).then((r) => r.data),

  delete: (chatId: string): Promise<void> =>
    api.delete(`/chats/${chatId}`).then(() => undefined),

  getMessages: (chatId: string): Promise<MessageResponse[]> =>
    api.get<MessageResponse[]>(`/chats/${chatId}/messages`).then((r) => r.data),

  ask: (chatId: string, data: QuestionRequest): Promise<{ answer: string }> =>
    api.post<{ answer: string }>(`/chats/${chatId}/ask`, data).then((r) => r.data),

  uploadPdf: (chatId: string, file: File, onProgress?: (pct: number) => void): Promise<unknown> => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post(`/chats/${chatId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      })
      .then((r) => r.data);
  },

  listDocuments: (chatId: string): Promise<unknown> =>
    api.get(`/chats/${chatId}/documents`).then((r) => r.data),
};

// ─── Summaries ─────────────────────────────────────────────────────────────
export const summariesApi = {
  listByChat: (chatId: string): Promise<SummaryResponse[]> =>
    api.get<SummaryResponse[]>(`/summaries/chats/${chatId}`).then((r) => r.data),

  create: (chatId: string, data: SummaryCreate): Promise<SummaryResponse> =>
    api.post<SummaryResponse>(`/summaries/chats/${chatId}`, data).then((r) => r.data),

  delete: (summaryId: string): Promise<void> =>
    api.delete(`/summaries/${summaryId}`).then(() => undefined),
};

// ─── Quizzes ───────────────────────────────────────────────────────────────
export const quizzesApi = {
  listByChat: (chatId: string): Promise<QuizResponse[]> =>
    api.get<QuizResponse[]>(`/quizzes/chats/${chatId}`).then((r) => r.data),

  get: (quizId: string): Promise<QuizResponse> =>
    api.get<QuizResponse>(`/quizzes/${quizId}`).then((r) => r.data),

  generate: (chatId: string, data: QuizGenerateRequest): Promise<QuizResponse> =>
    api.post<QuizResponse>(`/quizzes/chats/${chatId}/generate`, data).then((r) => r.data),

  submit: (quizId: string, data: QuizSubmitRequest): Promise<QuizResultResponse> =>
    api.post<QuizResultResponse>(`/quizzes/${quizId}/submit`, data).then((r) => r.data),

  delete: (quizId: string): Promise<void> =>
    api.delete(`/quizzes/${quizId}`).then(() => undefined),
};

export default api;
