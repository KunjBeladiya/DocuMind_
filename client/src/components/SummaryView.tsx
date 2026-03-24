import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, AlignLeft, List, Loader2, Sparkles, Trash2, Clock } from 'lucide-react';
import { useSummaryStore } from '../store/summaryStore';
import { useChatStore } from '../store/chatStore';

type SummaryType = 'SHORT' | 'DETAILED' | 'BULLET';

interface SummaryOption {
  id: SummaryType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const summaryOptions: SummaryOption[] = [
  {
    id: 'SHORT',
    label: 'Short Summary',
    description: 'A concise overview in 2-3 sentences',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'DETAILED',
    label: 'Detailed Summary',
    description: 'A comprehensive breakdown of all key sections',
    icon: <AlignLeft className="w-5 h-5" />,
  },
  {
    id: 'BULLET',
    label: 'Bullet Points',
    description: 'Key takeaways in an easy-to-scan list format',
    icon: <List className="w-5 h-5" />,
  },
];

export function SummaryView() {
  const activeChatId = useChatStore((state) => state.activeChatId);
  const { summaries, fetchSummaries, generateSummary, deleteSummary, isLoading, isGenerating } = useSummaryStore();

  const [selectedType, setSelectedType] = useState<SummaryType | null>(null);

  useEffect(() => {
    if (activeChatId) {
      fetchSummaries(activeChatId);
    }
  }, [activeChatId, fetchSummaries]);

  const handleGenerate = async (type: SummaryType) => {
    if (!activeChatId) return;
    setSelectedType(type);
    try {
      await generateSummary(activeChatId, type);
      setSelectedType(null); // Reset after successful generation
    } catch (error) {
      console.error("Failed to generate summary", error);
    }
  };

  const handleDelete = async (summaryId: string) => {
    if (!activeChatId) return;
    try {
      await deleteSummary(activeChatId, summaryId);
    } catch (error) {
      console.error("Failed to delete summary", error);
    }
  };

  const currentSummaries = activeChatId ? summaries[activeChatId] || [] : [];

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Document Summary</h2>
            <p className="text-slate-400 text-sm">Choose a summary style to generate a new context-aware summary.</p>
          </div>
        </div>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {summaryOptions.map((option) => (
          <motion.button
            key={option.id}
            onClick={() => handleGenerate(option.id)}
            disabled={isGenerating}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className={`text-left p-5 rounded-2xl border transition-all duration-200 ${
              selectedType === option.id && isGenerating
                ? 'bg-violet-600/15 border-violet-500/40 text-white'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                selectedType === option.id && isGenerating
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {option.icon}
            </div>
            <h3 className="font-semibold mb-1 text-sm">{option.label}</h3>
            <p className="text-xs text-slate-500">{option.description}</p>
          </motion.button>
        ))}
      </div>

      {/* Result area */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {/* Generation Loader */}
          {isGenerating && (
            <motion.div
              layout
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-center gap-3 py-8 bg-slate-800/20 border border-slate-700/50 rounded-2xl text-slate-400"
            >
              <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
              <span className="text-sm">Reading context and generating summary...</span>
            </motion.div>
          )}

          {/* Historical Summaries */}
          {isLoading && currentSummaries.length === 0 ? (
            <motion.div
              key="fetching"
              className="flex items-center justify-center py-8 text-slate-500"
            >
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading summaries...
            </motion.div>
          ) : currentSummaries.length > 0 ? (
            currentSummaries.map((summary) => {
              const matchedOption = summaryOptions.find((o) => o.id === summary.type) || summaryOptions[0];
              
              return (
                <motion.div
                  layout
                  key={summary.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 group transition-colors hover:border-slate-600/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-violet-400">
                        {matchedOption.icon}
                      </div>
                      <div>
                        <span className="text-slate-300 text-sm font-medium flex items-center gap-2">
                          {matchedOption.label}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(summary.created_at).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(summary.id)}
                      className="p-2 -mr-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label="Delete summary"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {summary.content}
                  </div>
                </motion.div>
              );
            })
          ) : (
            !isGenerating && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-slate-600 text-sm border border-dashed border-slate-700/50 rounded-2xl"
              >
                No summaries generated yet. Select an option above to create one.
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
