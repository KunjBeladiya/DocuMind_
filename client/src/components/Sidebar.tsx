import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  LogOut,
  Trash2,
  BookOpen,
  Loader2,
  Menu,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { cn } from '../lib/utils';
import type { ChatResponse } from '../types';

interface SidebarProps {
  onChatSelect?: () => void;
}

export function Sidebar({ onChatSelect }: SidebarProps) {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { chats, activeChatId, isLoadingChats, fetchChats, createChat, deleteChat, setActiveChat } =
    useChatStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (showNewInput) {
      inputRef.current?.focus();
    }
  }, [showNewInput]);

  const handleCreateChat = async () => {
    const title = newChatTitle.trim() || 'New Chat';
    setIsCreating(true);
    try {
      const chat = await createChat(title);
      setActiveChat(chat.id);
      setNewChatTitle('');
      setShowNewInput(false);
      onChatSelect?.();
      toast.success('Chat created!');
    } catch {
      toast.error('Failed to create chat.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    try {
      await deleteChat(chatId);
      toast.success('Chat deleted.');
    } catch {
      toast.error('Failed to delete chat.');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900">
      {/* Logo header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-lg">DocuMind</span>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pt-4 pb-2">
        <AnimatePresence mode="wait">
          {showNewInput ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateChat();
                  if (e.key === 'Escape') setShowNewInput(false);
                }}
                placeholder="Chat title..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateChat}
                  disabled={isCreating}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create'}
                </button>
                <button
                  onClick={() => setShowNewInput(false)}
                  className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowNewInput(true)}
              className="w-full flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-500/60 text-blue-400 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
        {isLoadingChats ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-10 px-4">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-xs">No chats yet. Create one to get started!</p>
          </div>
        ) : (
          chats.map((chat: ChatResponse) => (
            <motion.button
              key={chat.id}
              onClick={() => {
                setActiveChat(chat.id);
                onChatSelect?.();
              }}
              className={cn(
                'w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left group transition-all duration-200',
                activeChatId === chat.id
                  ? 'bg-blue-600/15 text-white border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              )}
              whileHover={{ x: 2 }}
            >
              <MessageSquare
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  activeChatId === chat.id ? 'text-blue-400' : 'text-slate-500'
                )}
              />
              <span className="flex-1 text-sm truncate">{chat.title}</span>
              <button
                onClick={(e) => handleDelete(e, chat.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 hover:text-red-400 transition-all text-slate-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </motion.button>
          ))
        )}
      </div>

      {/* User / Logout */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800 transition-colors group cursor-default">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name ?? 'User'}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email ?? ''}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Mobile sidebar wrapper
export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 lg:hidden"
            >
              <Sidebar onChatSelect={() => setOpen(false)} />
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
