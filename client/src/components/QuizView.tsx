import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, CheckCircle, XCircle, Loader2, HelpCircle, Clock, Trash2, ArrowLeft, PlayCircle } from 'lucide-react';
import { useQuizStore } from '../store/quizStore';
import { useChatStore } from '../store/chatStore';
import type { QuizResponse, QuizDifficulty, QuizResultResponse } from '../types';

type ViewState = 'DASHBOARD' | 'PRE_START' | 'TAKING' | 'RESULTS';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function QuizView() {
  const activeChatId = useChatStore((state) => state.activeChatId);
  const { quizzes, fetchQuizzes, generateQuiz, submitQuiz, deleteQuiz, isGenerating, isLoading } = useQuizStore();

  const [viewState, setViewState] = useState<ViewState>('DASHBOARD');
  const [activeQuiz, setActiveQuiz] = useState<QuizResponse | null>(null);
  
  // Generation Form State
  const [genCount, setGenCount] = useState<number>(5);
  const [genDifficulty, setGenDifficulty] = useState<QuizDifficulty>('MEDIUM');

  // Pre-start Timer State
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(5);

  // Active Quiz State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResultResponse | null>(null);

  // Load quizzes when chat switches or mounts
  useEffect(() => {
    if (activeChatId) {
      fetchQuizzes(activeChatId);
      setViewState('DASHBOARD');
      setActiveQuiz(null);
    }
  }, [activeChatId, fetchQuizzes]);

  // Timer hook
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || viewState !== 'TAKING') return;
    
    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          clearInterval(timerId);
          handleForceSubmit();
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);
    
    return () => clearInterval(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, viewState]);

  const handleGenerate = async () => {
    if (!activeChatId) return;
    try {
      await generateQuiz(activeChatId, { count: genCount, difficulty: genDifficulty });
    } catch (error) {
      console.error("Failed to generate quiz", error);
    }
  };

  const handleStartSetup = (quiz: QuizResponse) => {
    setActiveQuiz(quiz);
    if (quiz.status === 'COMPLETED') {
      // Just view results if already complete (requires refetching or relying on correct_answers from prior)
      // Since it's already complete but we might not have `correct_answers` mapped locally if refreshed,
      // For simplicity, we just show scores on the Dashboard.
      alert(`Quiz already completed! Score: ${quiz.score}/${quiz.total_marks}`);
      return;
    }
    setViewState('PRE_START');
  };

  const startTakingQuiz = () => {
    setAnswers({});
    setQuizResult(null);
    setViewState('TAKING');
    setTimeLeft(timeLimitMinutes === 0 ? null : timeLimitMinutes * 60);
  };

  const handleAnswer = (questionId: string, optionId: string) => {
    if (viewState !== 'TAKING') return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleForceSubmit = async () => {
    if (!activeChatId || !activeQuiz || isSubmitting) return;
    await doSubmit();
  };

  const handleSubmitScore = async () => {
    if (!activeChatId || !activeQuiz || isSubmitting) return;
    // ensure all answered? (optional, but good UX)
    await doSubmit();
  };

  const doSubmit = async () => {
    if (!activeChatId || !activeQuiz) return;
    setIsSubmitting(true);
    try {
      const result = await submitQuiz(activeChatId, activeQuiz.id, { answers });
      setQuizResult(result);
      setViewState('RESULTS');
    } catch (e) {
      console.error(e);
      alert("Error submitting quiz");
    } finally {
      setIsSubmitting(false);
      setTimeLeft(null);
    }
  };

  const handleDelete = async (quiz: QuizResponse) => {
    if (!activeChatId) return;
    await deleteQuiz(activeChatId, quiz.id);
  };

  const handleBackToDashboard = () => {
    setViewState('DASHBOARD');
    setActiveQuiz(null);
  };

  const currentQuizzes = activeChatId ? quizzes[activeChatId] || [] : [];

  return (
    <div className="h-full overflow-y-auto px-6 py-8 relative">
      <AnimatePresence mode="wait">
        
        {/* ======================= DASHBOARD ======================= */}
        {viewState === 'DASHBOARD' && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Knowledge Quizzes</h2>
                  <p className="text-slate-400 text-sm">Test your understanding of the document</p>
                </div>
              </div>
            </div>

            {/* Generation Panel */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 mb-8">
              <h3 className="text-white font-medium mb-4">Generate New Quiz</h3>
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 w-full">
                  <label className="text-xs text-slate-400 font-medium mb-2 block">
                    Number of Questions: {genCount}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={genCount}
                    onChange={(e) => setGenCount(parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="text-xs text-slate-400 font-medium mb-2 block">
                    Difficulty Level
                  </label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value as QuizDifficulty)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || isLoading}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4" /> Generate Quiz</>
                  )}
                </button>
              </div>
            </div>

            {/* Quizzes List */}
            <div className="space-y-4">
              <h3 className="text-white font-medium">Your Quizzes</h3>
              {isLoading && currentQuizzes.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading quizzes...
                </div>
              ) : currentQuizzes.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-700/50 rounded-2xl">
                  <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No quizzes found. Generate one above!</p>
                </div>
              ) : (
                currentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between group">
                    <div>
                      <h4 className="text-white font-medium text-sm mb-1">{quiz.title}</h4>
                      <div className="flex items-center gap-3 text-xs font-medium">
                        <span className={`px-2 py-0.5 rounded-md ${
                          quiz.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-400' :
                          quiz.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {quiz.difficulty}
                        </span>
                        <span className="text-slate-500">{quiz.total_marks} Questions</span>
                        <span className="text-slate-500 border-l border-slate-700 pl-3">
                          {new Date(quiz.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {quiz.status === 'COMPLETED' ? (
                        <div className="text-right mr-4">
                          <p className="text-xs text-slate-500 mb-0.5">Score</p>
                          <p className={`font-bold ${quiz.score === quiz.total_marks ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {quiz.score} / {quiz.total_marks}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartSetup(quiz)}
                          className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <PlayCircle className="w-4 h-4" /> Start
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(quiz)}
                        className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ======================= PRE START ======================= */}
        {viewState === 'PRE_START' && activeQuiz && (
          <motion.div key="pre-start" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full max-w-md mx-auto py-12">
            <Trophy className="w-16 h-16 text-amber-400 mb-6 drop-shadow-lg shadow-amber-500" />
            <h2 className="text-2xl font-bold text-white mb-2 text-center">{activeQuiz.title}</h2>
            <p className="text-slate-400 text-center mb-8">
              {activeQuiz.total_marks} Questions • {activeQuiz.difficulty} Difficulty
            </p>

            <div className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-8">
              <label className="block text-sm font-medium text-slate-300 mb-4 text-center">
                Select Time Limit
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[5, 10, 15, 30].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setTimeLimitMinutes(mins)}
                    className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
                      timeLimitMinutes === mins 
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
                <button
                  onClick={() => setTimeLimitMinutes(0)}
                  className={`col-span-2 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    timeLimitMinutes === 0 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                      : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  No Time Limit
                </button>
              </div>
            </div>

            <div className="flex gap-4 w-full">
              <button 
                onClick={handleBackToDashboard}
                className="flex-1 py-3 text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={startTakingQuiz}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20 transition-all"
              >
                Start Now
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================= TAKING ======================= */}
        {viewState === 'TAKING' && activeQuiz && (
          <motion.div key="taking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24">
            
            {/* Sticky Header with Timer */}
            <div className="sticky top-0 -mx-6 px-6 py-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-10 flex items-center justify-between mb-8">
              <div>
                <h3 className="text-white font-semibold truncate max-w-[200px] sm:max-w-xs">{activeQuiz.title}</h3>
                <p className="text-xs text-slate-500">
                  Answered: {Object.keys(answers).length} / {activeQuiz.total_marks}
                </p>
              </div>
              
              {timeLeft !== null && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg ${
                  timeLeft <= 60 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 text-amber-400'
                }`}>
                  <Clock className="w-5 h-5" />
                  {formatTime(timeLeft)}
                </div>
              )}
            </div>

            {/* Questions List */}
            <div className="space-y-8 max-w-3xl mx-auto">
              {activeQuiz.questions?.map((q, qIdx) => (
                <div key={q.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
                  <p className="text-white font-medium mb-5 text-base leading-relaxed">
                    <span className="text-amber-500 mr-2 font-bold">{qIdx + 1}.</span>
                    {q.question}
                  </p>
                  <div className="space-y-3">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = answers[q.id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleAnswer(q.id, opt.id)}
                          className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border text-left text-sm transition-all duration-150 ${
                            isSelected 
                              ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.2)]'
                              : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-700'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs flex-shrink-0 transition-colors ${
                            isSelected ? 'border-amber-500 text-amber-500 bg-amber-500/20' : 'border-slate-600 text-slate-500'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          {opt.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 lg:left-72 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-900 flex justify-center z-20">
              <button
                onClick={handleSubmitScore}
                disabled={isSubmitting}
                className="max-w-md w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all flex justify-center items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Submit Answers
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================= RESULTS ======================= */}
        {viewState === 'RESULTS' && activeQuiz && quizResult && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-24 max-w-3xl mx-auto">
            
            <button 
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-10 text-center mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"></div>
              <Trophy className={`w-20 h-20 mx-auto mb-4 ${quizResult.score === quizResult.total_marks ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]'}`} />
              <h2 className="text-3xl font-bold text-white mb-2">
                {quizResult.score} <span className="text-slate-500 text-2xl">/ {quizResult.total_marks}</span>
              </h2>
              <p className="text-slate-400 text-lg">
                {quizResult.score === quizResult.total_marks ? 'Flawless execution! Perfect score.' : 'Great effort! Review your answers below.'}
              </p>
            </div>

            <h3 className="text-white font-medium mb-4 px-2">Detailed Review</h3>
            <div className="space-y-6">
              {activeQuiz.questions?.map((q) => {
                const correctOptionId = quizResult.correct_answers[q.id];
                const selectedOptionId = answers[q.id];
                const isCorrectlyAnswered = correctOptionId === selectedOptionId;

                return (
                  <div key={q.id} className={`bg-slate-800/40 border rounded-2xl p-6 ${
                    isCorrectlyAnswered ? 'border-emerald-500/20' : 'border-red-500/20'
                  }`}>
                    <div className="flex gap-3 mb-5">
                      {isCorrectlyAnswered ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      <p className="text-white font-medium text-base">
                        {q.question}
                      </p>
                    </div>

                    <div className="space-y-2 pl-8">
                      {q.options.map((opt) => {
                        const isSelected = selectedOptionId === opt.id;
                        const isCorrect = correctOptionId === opt.id;
                        
                        let optClass = 'border-slate-700 bg-slate-800/30 text-slate-400';
                        if (isCorrect) {
                          optClass = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-medium';
                        } else if (isSelected && !isCorrect) {
                          optClass = 'border-red-500/50 bg-red-500/10 text-red-300 line-through decoration-red-500/50';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm ${optClass}`}
                          >
                            <span>{opt.text}</span>
                            {isCorrect && <span className="text-xs text-emerald-400 font-bold tracking-wide uppercase px-2 py-1 bg-emerald-500/10 rounded-md">Correct Answer</span>}
                            {isSelected && !isCorrect && <span className="text-xs text-red-400 font-bold tracking-wide uppercase px-2 py-1 bg-red-500/10 rounded-md">Your Answer</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
