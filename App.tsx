import React, { useState, useEffect } from 'react';
import { generateA1Quiz } from './services/gemini';
import { submitToGoogleSheets } from './services/sheets';
import { Question, QuizState, UserInfo } from './types';
import QuestionCard from './components/QuestionCard';
import ProgressBar from './components/ProgressBar';
import Button from './components/Button';
import UserInfoForm from './components/UserInfoForm';
import { Trophy, AlertTriangle, ArrowRight, RefreshCw, Home, Star, CheckCircle2, BookOpen, Mic, PenTool, Headphones, Languages } from 'lucide-react';

// Simple wrapper for Lottie Player
const LottiePlayer = ({ src, className }: { src: string, className?: string }) => {
  // Cast to any to avoid TypeScript errors with custom element
  const Lottie = 'lottie-player' as any;
  return (
    <div className={className}>
      <Lottie
        src={src}
        background="transparent"
        speed="1"
        style={{ width: '100%', height: '100%' }}
        loop
        autoplay
      ></Lottie>
    </div>
  );
};

// Background Component
const BackgroundBlobs = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
    <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
    <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
  </div>
);

// New Result Screen Component with Animations
const ResultScreen = ({ 
  score, 
  total, 
  userInfo,
  onRetry, 
  onHome 
}: { 
  score: number, 
  total: number, 
  userInfo?: UserInfo,
  onRetry: () => void, 
  onHome: () => void 
}) => {
  const percentage = Math.round((score / total) * 100);
  const [displayPercent, setDisplayPercent] = useState(0);
  const [showStars, setShowStars] = useState(0);

  // Determine tier
  let tier = 'fail';
  if (percentage >= 80) tier = 'excellent';
  else if (percentage >= 60) tier = 'pass';

  // Configuration based on tier
  const config = {
    excellent: {
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: Trophy,
      title: 'Ausgezeichnet!',
      subtitle: 'Outstanding performance! You mastered the A1 level.',
      lottie: "https://assets10.lottiefiles.com/packages/lf20_xlkxtmul.json", // Confetti
      stars: 3
    },
    pass: {
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      icon: CheckCircle2,
      title: 'Gut gemacht!',
      subtitle: 'You passed the exam. Ready for the next step!',
      lottie: "https://assets3.lottiefiles.com/packages/lf20_atippmse.json", // Success Check (or similar generic)
      stars: 2
    },
    fail: {
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: BookOpen,
      title: 'Nicht bestanden',
      subtitle: 'Keep practicing. Review your vocabulary and grammar.',
      lottie: "https://assets10.lottiefiles.com/packages/lf20_jcikwtux.json", // Study/Book (reused from idle)
      stars: 1
    }
  }[tier];

  // Handle Count Up Animation
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const interval = 16; // 60fps
    const step = percentage / (duration / interval);
    
    const timer = setInterval(() => {
      start += step;
      if (start >= percentage) {
        setDisplayPercent(percentage);
        clearInterval(timer);
        // Trigger stars sequence
        setTimeout(() => setShowStars(1), 200);
        setTimeout(() => setShowStars(2), 600);
        setTimeout(() => setShowStars(3), 1000);
      } else {
        setDisplayPercent(Math.floor(start));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [percentage]);

  // Circular Progress Calculation
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayPercent / 100) * circumference;

  return (
    <>
      <BackgroundBlobs />
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-strong max-w-md w-full p-8 rounded-[2.5rem] shadow-2xl border border-white/60 text-center relative overflow-hidden animate-in fade-in zoom-in duration-500">
          
          {/* Background Lottie for High Score */}
          {tier === 'excellent' && (
            <div className="absolute inset-0 pointer-events-none opacity-50">
              <LottiePlayer src={config.lottie} className="w-full h-full" />
            </div>
          )}

          {/* Score Circle */}
          <div className="relative w-48 h-48 mx-auto mb-8">
            {/* SVG Ring */}
            <svg className="w-full h-full transform -rotate-90 drop-shadow-xl">
              <circle
                cx="96"
                cy="96"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-slate-100"
              />
              <circle
                cx="96"
                cy="96"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`${config.color} transition-all duration-75`}
              />
            </svg>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-black tracking-tighter ${config.color}`}>
                {displayPercent}%
              </span>
              <span className="text-xs uppercase font-bold text-slate-400 mt-1">Score</span>
            </div>
          </div>

          {/* Stars Animation */}
          <div className="flex justify-center gap-3 mb-6 h-10">
             {[1, 2, 3].map((i) => (
               <div 
                 key={i}
                 className={`transform transition-all duration-500 ${showStars >= i ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
               >
                 <Star 
                   size={32} 
                   fill={i <= config.stars ? "#fbbf24" : "#e2e8f0"} 
                   className={i <= config.stars ? "text-amber-400 drop-shadow-md" : "text-slate-200"} 
                 />
               </div>
             ))}
          </div>

          {/* Text Content */}
          <div className="space-y-3 mb-8 relative z-10">
            <h2 className={`text-3xl font-extrabold ${config.color}`}>
              {userInfo?.name ? `${config.title}, ${userInfo.name.split(' ')[0]}!` : config.title}
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed px-4">{config.subtitle}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`p-4 rounded-2xl ${config.bg} border ${config.border}`}>
              <div className="text-3xl font-bold text-slate-800 mb-1">{score}</div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Correct</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-3xl font-bold text-slate-800 mb-1">{total}</div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Total</div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 relative z-10">
            <Button onClick={onRetry} className="w-full justify-center shadow-lg shadow-indigo-200">
              <RefreshCw size={20} /> Try New Exam
            </Button>
            <button 
              onClick={onHome}
              className="w-full py-3 rounded-xl font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Home size={18} /> Back to Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default function App() {
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    score: 0,
    status: 'idle',
  });

  const handleStartQuiz = async () => {
    setQuizState(prev => ({ ...prev, status: 'loading', error: undefined, userInfo: undefined }));
    try {
      const questions = await generateA1Quiz();
      setQuizState({
        questions,
        currentQuestionIndex: 0,
        answers: {},
        score: 0,
        status: 'active',
      });
    } catch (error) {
      setQuizState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: "Failed to generate quiz. Please try again." 
      }));
    }
  };

  const handleAnswer = (answer: string) => {
    setQuizState(prev => {
      const currentQ = prev.questions[prev.currentQuestionIndex];
      const isCorrect = answer.toLowerCase().trim() === currentQ.correctAnswer.toLowerCase().trim();
      
      const nextIndex = prev.currentQuestionIndex + 1;
      const isFinished = nextIndex >= prev.questions.length;

      return {
        ...prev,
        answers: { ...prev.answers, [currentQ.id]: answer },
        score: isCorrect ? prev.score + 1 : prev.score,
        currentQuestionIndex: nextIndex,
        // Transition to collecting info when finished, otherwise stay active
        status: isFinished ? 'collecting_info' : 'active'
      };
    });
  };

  const handleUserInfoSubmit = async (info: UserInfo) => {
    // Submit to Google Sheets (Fire and forget style)
    await submitToGoogleSheets(info, quizState.score, quizState.questions.length);
    
    setQuizState(prev => ({
      ...prev,
      userInfo: info,
      status: 'completed'
    }));
  };

  const resetQuiz = () => {
    setQuizState({
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      score: 0,
      status: 'idle'
    });
  };

  // Render Loading
  if (quizState.status === 'loading') {
    return (
      <>
        <BackgroundBlobs />
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass p-10 rounded-3xl shadow-xl max-w-sm w-full text-center border border-white/50">
             <div className="w-24 h-24 mx-auto mb-6 bg-indigo-50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">Generating Exam</h2>
             <p className="text-slate-500 mb-6">Creating 12 unique A1 questions across 4 sections...</p>
             <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
               <div className="bg-indigo-500 h-2 rounded-full animate-pulse w-full"></div>
             </div>
             <p className="text-xs text-slate-400">This may take a few moments</p>
          </div>
        </div>
      </>
    );
  }

  // Render Error
  if (quizState.status === 'error') {
    return (
      <>
        <BackgroundBlobs />
        <div className="min-h-screen flex items-center justify-center p-4">
           <div className="glass p-10 rounded-3xl shadow-xl max-w-md text-center border-2 border-red-100">
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
               <AlertTriangle size={40} />
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
             <p className="text-slate-500 mb-8">{quizState.error}</p>
             <Button onClick={handleStartQuiz} variant="secondary">Try Again</Button>
           </div>
        </div>
      </>
    );
  }

  // Render User Info Form
  if (quizState.status === 'collecting_info') {
    return (
      <>
        <BackgroundBlobs />
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <UserInfoForm onSubmit={handleUserInfoSubmit} />
        </div>
      </>
    );
  }

  // Render Completed (New Result Screen)
  if (quizState.status === 'completed') {
    return (
      <ResultScreen 
        score={quizState.score} 
        total={quizState.questions.length} 
        userInfo={quizState.userInfo}
        onRetry={handleStartQuiz} 
        onHome={resetQuiz} 
      />
    );
  }

  // Render Active Quiz
  if (quizState.status === 'active' && quizState.questions.length > 0) {
    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    return (
      <>
        <BackgroundBlobs />
        <div className="min-h-screen flex flex-col max-w-4xl mx-auto p-4 md:p-8 relative z-10">
           <header className="flex items-center justify-between mb-8 glass p-4 rounded-2xl">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
                  A1
                </div>
                <div>
                  <h1 className="font-bold text-slate-800 leading-tight">German Exam</h1>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Mock Test</p>
                </div>
             </div>
             <div className="text-right">
               <div className="text-2xl font-black text-slate-800 font-mono">
                 {quizState.currentQuestionIndex + 1}<span className="text-slate-300 text-lg">/{quizState.questions.length}</span>
               </div>
             </div>
           </header>

           <ProgressBar current={quizState.currentQuestionIndex} total={quizState.questions.length} />

           <main className="flex-1 flex items-center">
             <QuestionCard 
               question={currentQuestion} 
               onAnswer={handleAnswer}
               isSubmitting={false}
             />
           </main>
        </div>
      </>
    );
  }

  // Render Idle (Start Screen)
  return (
    <>
      <BackgroundBlobs />
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-16 items-center">
          
          <div className="order-2 md:order-1 space-y-8 text-center md:text-left">
             <div className="space-y-4">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 font-bold text-sm uppercase tracking-wide border border-amber-200">
                 <span className="w-2 h-2 rounded-full bg-red-500"></span>
                 Start Deutsch 1 Prep
               </div>
               <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                 German <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">A1 Mock Test</span>
               </h1>
               <p className="text-lg text-slate-600 leading-relaxed max-w-lg mx-auto md:mx-0">
                 Prepare for your German exam with a realistic 12-question exam covering <span className="font-semibold text-slate-800">Hören (Listening)</span>, <span className="font-semibold text-slate-800">Lesen (Reading)</span>, <span className="font-semibold text-slate-800">Schreiben (Writing)</span>, and Vocabulary.
               </p>
             </div>

             <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
               <Button onClick={handleStartQuiz} className="shadow-xl shadow-indigo-200 hover:scale-105">
                 Begin Mock Test <ArrowRight size={20} />
               </Button>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-200/60">
                <div className="flex flex-col items-center md:items-start">
                  <div className="w-10 h-10 mb-2 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Headphones size={20} />
                  </div>
                  <div className="font-black text-lg text-slate-800">Hören</div>
                  <div className="text-xs text-slate-500 font-bold uppercase">Listening</div>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <div className="w-10 h-10 mb-2 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <div className="font-black text-lg text-slate-800">Lesen</div>
                  <div className="text-xs text-slate-500 font-bold uppercase">Reading</div>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <div className="w-10 h-10 mb-2 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <PenTool size={20} />
                  </div>
                  <div className="font-black text-lg text-slate-800">Schreiben</div>
                  <div className="text-xs text-slate-500 font-bold uppercase">Writing</div>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <div className="w-10 h-10 mb-2 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Languages size={20} />
                  </div>
                  <div className="font-black text-lg text-slate-800">Wortschatz</div>
                  <div className="text-xs text-slate-500 font-bold uppercase">Vocabulary</div>
                </div>
             </div>
          </div>

          <div className="order-1 md:order-2 flex justify-center">
             <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                {/* Lottie for User Testing / Fluency */}
                <LottiePlayer 
                  src="https://assets10.lottiefiles.com/packages/lf20_1a8dx7zj.json" 
                  className="w-full h-full drop-shadow-2xl scale-110"
                />
             </div>
          </div>

        </div>
      </div>
    </>
  );
}