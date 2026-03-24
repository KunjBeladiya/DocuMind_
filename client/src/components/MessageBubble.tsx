import { motion } from 'framer-motion';
import { BookOpen, Bot, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatTime } from '../lib/utils';
import type { MessageResponse } from '../types';

interface MessageBubbleProps {
  message: MessageResponse;
  isLatest?: boolean;
}

export function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const isUser = message.role.toUpperCase() === 'USER';

  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex gap-3 px-4 py-2', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-violet-600'
            : 'bg-slate-700 border border-slate-600'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-blue-400" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[72%] space-y-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-tr-sm'
              : 'bg-slate-800 text-slate-100 border border-slate-700/50 rounded-tl-sm'
          )}
        >
          {message.content}
        </div>
        <p
          className={cn(
            'text-xs text-slate-500 px-1',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 px-4 py-2">
      <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-blue-400" />
      </div>
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-400"
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function EmptyChatState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-blue-400" />
      </div>
      <div>
        <h3 className="text-white font-semibold text-lg">Upload a document to get started</h3>
        <p className="text-slate-400 text-sm mt-1.5 max-w-xs">
          Upload a PDF and start asking questions. DocuMind will analyze it and answer with
          precision.
        </p>
      </div>
    </motion.div>
  );
}
