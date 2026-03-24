import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, AlignLeft, List, Loader2, Sparkles } from 'lucide-react';

type SummaryType = 'short' | 'detailed' | 'bullet';

interface SummaryOption {
  id: SummaryType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const summaryOptions: SummaryOption[] = [
  {
    id: 'short',
    label: 'Short Summary',
    description: 'A concise overview in 2-3 sentences',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'detailed',
    label: 'Detailed Summary',
    description: 'A comprehensive breakdown of all key sections',
    icon: <AlignLeft className="w-5 h-5" />,
  },
  {
    id: 'bullet',
    label: 'Bullet Points',
    description: 'Key takeaways in an easy-to-scan list format',
    icon: <List className="w-5 h-5" />,
  },
];

export function SummaryView() {
  const [selectedType, setSelectedType] = useState<SummaryType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);

  const handleGenerate = async (type: SummaryType) => {
    setSelectedType(type);
    setIsGenerating(true);
    setGenerated(null);
    // Placeholder — backend not ready
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setGenerated(
      '⚠️ Summary generation is not available yet. The backend for this feature is under development. Please check back later!'
    );
  };

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
            <p className="text-slate-400 text-sm">Choose a summary style</p>
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
              selectedType === option.id
                ? 'bg-violet-600/15 border-violet-500/40 text-white'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                selectedType === option.id
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
      <AnimatePresence mode="wait">
        {isGenerating && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-3 py-12 text-slate-400"
          >
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            <span className="text-sm">Generating summary...</span>
          </motion.div>
        )}
        {generated && !isGenerating && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-slate-300 text-sm font-medium">
                {summaryOptions.find((o) => o.id === selectedType)?.label}
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{generated}</p>
          </motion.div>
        )}
        {!isGenerating && !generated && (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-slate-600 text-sm"
          >
            Select a summary style above to generate a summary of your document.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
