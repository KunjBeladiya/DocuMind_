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
