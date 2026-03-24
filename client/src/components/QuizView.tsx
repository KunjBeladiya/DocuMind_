import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, CheckCircle, XCircle, Loader2, HelpCircle } from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

// Placeholder questions shown after "Generate Quiz"
const placeholderQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the main topic discussed in the document?',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correct: 0,
  },
  {
    id: 2,
    question: 'Which concept is highlighted in the conclusion?',
    options: ['Concept X', 'Concept Y', 'Concept Z', 'None of the above'],
    correct: 2,
  },
  {
    id: 3,
    question: 'What methodology is used in the research presented?',
    options: ['Qualitative', 'Quantitative', 'Mixed methods', 'Case study'],
    correct: 1,
  },
];

export function QuizView() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAnswers({});
    setSubmitted(false);
    setQuestions(null);
    await new Promise((r) => setTimeout(r, 2000));
    setQuestions(placeholderQuestions);
    setIsGenerating(false);
  };

  const handleAnswer = (questionId: number, optionIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < (questions?.length ?? 0)) return;
    setSubmitted(true);
  };

  const score = submitted
    ? questions?.filter((q) => answers[q.id] === q.correct).length ?? 0
    : 0;

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Document Quiz</h2>
            <p className="text-slate-400 text-sm">Test your understanding</p>
          </div>
        </div>
        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Generate Quiz
            </>
          )}
        </motion.button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isGenerating && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-4 py-16"
          >
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-slate-400 text-sm">Generating quiz questions from your document...</p>
          </motion.div>
        )}

        {!isGenerating && !questions && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20 text-center"
          >
            <HelpCircle className="w-12 h-12 text-slate-700" />
            <div>
              <p className="text-slate-400 text-sm font-medium">No quiz generated yet</p>
              <p className="text-slate-600 text-xs mt-1">
                Click "Generate Quiz" to create MCQ questions from your document.
              </p>
            </div>
            <p className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
              ⚠️ Quiz generation backend is under development
            </p>
          </motion.div>
        )}

        {!isGenerating && questions && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Score banner */}
            {submitted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-3 p-4 rounded-2xl border ${
                  score === questions.length
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                }`}
              >
                <Trophy className="w-5 h-5 flex-shrink-0" />
                <p className="font-semibold">
                  You scored {score}/{questions.length}!{' '}
                  {score === questions.length ? '🎉 Perfect score!' : 'Keep it up!'}
                </p>
              </motion.div>
            )}

            {questions.map((q, qIdx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qIdx * 0.1 }}
                className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5"
              >
                <p className="text-white font-medium mb-4 text-sm">
                  <span className="text-slate-500 mr-2">Q{qIdx + 1}.</span>
                  {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = answers[q.id] === optIdx;
                    const isCorrect = optIdx === q.correct;
                    let optClass =
                      'border-slate-700 bg-slate-700/30 text-slate-300 hover:border-slate-600 hover:bg-slate-700/60';
                    if (submitted) {
                      if (isCorrect)
                        optClass = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300';
                      else if (isSelected && !isCorrect)
                        optClass = 'border-red-500/50 bg-red-500/10 text-red-300';
                    } else if (isSelected) {
                      optClass = 'border-amber-500/50 bg-amber-500/10 text-amber-300';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswer(q.id, optIdx)}
                        disabled={submitted}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left text-sm transition-all duration-150 disabled:cursor-default ${optClass}`}
                      >
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs flex-shrink-0">
                          {submitted && isCorrect ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : submitted && isSelected && !isCorrect ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            String.fromCharCode(65 + optIdx)
                          )}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ))}

            {!submitted && (
              <motion.button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < questions.length}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all"
              >
                Submit Quiz
              </motion.button>
            )}

            {submitted && (
              <button
                onClick={handleGenerate}
                className="w-full py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all text-sm"
              >
                Try Again
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
