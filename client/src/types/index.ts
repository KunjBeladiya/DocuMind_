// Auth types
export interface UserRegister {
  email: string;
  password: string;
  name: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// Chat types
export interface ChatCreate {
  title: string;
}

export interface ChatResponse {
  id: string;
  title: string;
  created_at: string;
}

export interface ChatUpdate {
  title: string;
}

export interface MessageResponse {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'USER' | 'ASSISTANT';
  created_at: string;
}

export interface QuestionRequest {
  question: string;
}

// API error
export interface ApiError {
  detail?: string | { loc: (string | number)[]; msg: string; type: string }[];
}

// UI state types
export type ActiveTab = 'chat' | 'summary' | 'quiz';

export type SummaryType = 'short' | 'detailed' | 'bullet';

// Summary types
export interface SummaryCreate {
  type: string;
}

export interface SummaryResponse {
  id: string;
  chat_id: string;
  type: string;
  content: string;
  created_at: string;
}

// Quiz types
export type QuizDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuizStatus = 'CREATED' | 'COMPLETED';

export interface QuizGenerateRequest {
  count: number;
  difficulty: QuizDifficulty;
}

export interface QuizSubmitRequest {
  answers: Record<string, string>;
}

export interface QuizOptionResponse {
  id: string;
  text: string;
}

export interface QuizQuestionResponse {
  id: string;
  question: string;
  options: QuizOptionResponse[];
}

export interface QuizResponse {
  id: string;
  chat_id: string;
  title: string;
  difficulty: QuizDifficulty;
  status: QuizStatus;
  score: number | null;
  total_marks: number | null;
  created_at: string;
  questions?: QuizQuestionResponse[];
}

export interface QuizResultResponse {
  score: number;
  total_marks: number;
  status: QuizStatus;
  correct_answers: Record<string, string>;
}
