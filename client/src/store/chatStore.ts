import { create } from 'zustand';
import type { ChatResponse, MessageResponse } from '../types';
import { chatsApi } from '../services/api';

interface ChatState {
  chats: ChatResponse[];
  activeChatId: string | null;
  // Messages keyed by chatId
  messages: Record<string, MessageResponse[]>;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  uploadProgress: number | null;

  fetchChats: () => Promise<void>;
  createChat: (title: string) => Promise<ChatResponse>;
  deleteChat: (chatId: string) => Promise<void>;
  setActiveChat: (chatId: string) => void;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, question: string) => Promise<void>;
  uploadPdf: (chatId: string, file: File) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  messages: {},
  isLoadingChats: false,
  isLoadingMessages: false,
  isSending: false,
  uploadProgress: null,

  fetchChats: async () => {
    set({ isLoadingChats: true });
    try {
      const chats = await chatsApi.list();
      set({ chats, isLoadingChats: false });
    } catch {
      set({ isLoadingChats: false });
    }
  },

  createChat: async (title) => {
    const chat = await chatsApi.create({ title });
    set((state) => ({ chats: [chat, ...state.chats] }));
    return chat;
  },

  deleteChat: async (chatId) => {
    await chatsApi.delete(chatId);
    set((state) => {
      const updatedChats = state.chats.filter((c) => c.id !== chatId);
      const updatedMessages = { ...state.messages };
      delete updatedMessages[chatId];
      return {
        chats: updatedChats,
        messages: updatedMessages,
        activeChatId: state.activeChatId === chatId ? null : state.activeChatId,
      };
    });
  },

  setActiveChat: (chatId) => {
    set({ activeChatId: chatId });
    const existing = get().messages[chatId];
    if (!existing) {
      get().fetchMessages(chatId);
    }
  },

  fetchMessages: async (chatId) => {
    set({ isLoadingMessages: true });
    try {
      const msgs = await chatsApi.getMessages(chatId);
      set((state) => ({
        messages: { ...state.messages, [chatId]: msgs },
        isLoadingMessages: false,
      }));
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (chatId, question) => {
    // Optimistically add user message
    const tempUserMsg: MessageResponse = {
      id: `temp-user-${Date.now()}`,
      content: question,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), tempUserMsg],
      },
      isSending: true,
    }));

    try {
      const res = await chatsApi.ask(chatId, { question });
      const botMsg: MessageResponse = {
        id: `bot-${Date.now()}`,
        content: res.answer,
        role: 'assistant',
        created_at: new Date().toISOString(),
      };
      set((state) => ({
        messages: {
          ...state.messages,
          [chatId]: [...(state.messages[chatId] || []), botMsg],
        },
        isSending: false,
      }));
    } catch (err) {
      // Remove optimistic user message on failure
      set((state) => ({
        messages: {
          ...state.messages,
          [chatId]: (state.messages[chatId] || []).filter(
            (m) => m.id !== tempUserMsg.id
          ),
        },
        isSending: false,
      }));
      throw err;
    }
  },

  uploadPdf: async (chatId, file) => {
    set({ uploadProgress: 0 });
    await chatsApi.uploadPdf(chatId, file, (pct) => {
      set({ uploadProgress: pct });
    });
    set({ uploadProgress: null });
    // Refresh messages after upload
    await get().fetchMessages(chatId);
  },
}));
