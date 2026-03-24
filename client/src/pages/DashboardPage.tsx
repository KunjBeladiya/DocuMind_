import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles, Trophy, FileText } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { Sidebar, MobileSidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import { SummaryView } from '../components/SummaryView';
import { QuizView } from '../components/QuizView';
import { cn } from '../lib/utils';

type Tab = 'chat' | 'summary' | 'quiz';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'summary', label: 'Summary', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'quiz', label: 'Quiz', icon: <Trophy className="w-4 h-4" /> },
];

function NoChatSelected() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-500/10 flex items-center justify-center">
        <FileText className="w-10 h-10 text-slate-600" />
      </div>
      <div>
        <h2 className="text-white text-xl font-semibold mb-2">Select or create a chat</h2>
        <p className="text-slate-500 text-sm max-w-sm">
          Choose an existing chat from the sidebar, or create a new one to upload a PDF and start
          asking questions.
        </p>
      </div>
    </motion.div>
  );
}

export function DashboardPage() {
  const { activeChatId, chats } = useChatStore();
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const activeChat = chats.find((c) => c.id === activeChatId);

  // Reset to chat tab when switching chats
  useEffect(() => {
    setActiveTab('chat');
  }, [activeChatId]);

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 flex-shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {activeChatId && activeChat ? (
          <>
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-slate-800 bg-slate-900/30 flex-shrink-0 lg:pl-6 pl-16">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200',
                    activeTab === tab.id
                      ? 'text-blue-400 border-blue-500 bg-blue-500/5'
                      : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/50'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeChatId}-${activeTab}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {activeTab === 'chat' && (
                    <ChatArea chatId={activeChatId} chatTitle={activeChat.title} />
                  )}
                  {activeTab === 'summary' && <SummaryView />}
                  {activeTab === 'quiz' && <QuizView />}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 lg:pl-0 pl-0">
            <NoChatSelected />
          </div>
        )}
      </div>
    </div>
  );
}
