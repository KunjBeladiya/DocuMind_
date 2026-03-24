import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import { useChatStore } from '../store/chatStore';
import { MessageBubble, TypingIndicator, EmptyChatState } from './MessageBubble';
import { PdfUploader } from './PdfUploader';

interface ChatAreaProps {
  chatId: string;
  chatTitle: string;
}

export function ChatArea({ chatId, chatTitle }: ChatAreaProps) {
  const { messages, isSending, sendMessage } = useChatStore();
  const chatMessages = messages[chatId] || [];

  const [question, setQuestion] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length, isSending]);

  const handleSend = async () => {
    const q = question.trim();
    if (!q || isSending) return;
    setQuestion('');
    try {
      await sendMessage(chatId, q);
    } catch {
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold truncate">{chatTitle}</h2>
          <p className="text-slate-500 text-xs">
            {chatMessages.length > 0
              ? `${chatMessages.length} message${chatMessages.length !== 1 ? 's' : ''}`
              : 'No messages yet'}
          </p>
        </div>
        <button
          onClick={() => setShowUploader((v) => !v)}
          className={`p-2 rounded-lg transition-all ${
            showUploader
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Upload PDF"
        >
          <Paperclip className="w-5 h-5" />
        </button>
      </div>

      {/* PDF Uploader (toggle) */}
      {showUploader && <PdfUploader chatId={chatId} />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {chatMessages.length === 0 && !isSending ? (
          <EmptyChatState />
        ) : (
          <>
            {chatMessages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLatest={idx === chatMessages.length - 1}
              />
            ))}
            {isSending && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-slate-800">
        <div className="flex items-end gap-2 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 focus-within:border-blue-500/50 transition-colors">
          <textarea
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your document..."
            rows={1}
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 resize-none focus:outline-none max-h-32 leading-relaxed"
            style={{ overflowY: question.split('\n').length > 3 ? 'auto' : 'hidden' }}
          />
          <motion.button
            onClick={handleSend}
            disabled={!question.trim() || isSending}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
        <p className="text-center text-slate-600 text-xs mt-2">
          Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-500 font-mono text-[10px]">Enter</kbd> to send,{' '}
          <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-500 font-mono text-[10px]">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
