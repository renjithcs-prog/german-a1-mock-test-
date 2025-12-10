import React, { useState, useEffect } from 'react';
import { Question, QuestionType } from '../types';
import AudioPlayer from './AudioPlayer';
import Button from './Button';
import { CheckCircle2, XCircle, Image as ImageIcon, Ear, BookOpen, PenTool, Languages, ArrowRight } from 'lucide-react';
import { generateImage } from '../services/gemini';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: string) => void;
  isSubmitting: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer, isSubmitting }) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Feedback State
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Load image if question has imageDescription
  useEffect(() => {
    setImageUrl(null);
    setIsImageLoading(false);
    setSelectedOption('');
    setTextInput('');
    setIsAnswered(false);
    setIsCorrect(false);

    if (question.imageDescription) {
      const loadImage = async () => {
        setIsImageLoading(true);
        try {
          const url = await generateImage(question.imageDescription!);
          setImageUrl(url);
        } catch (e) {
          console.error("Failed to load image", e);
        } finally {
          setIsImageLoading(false);
        }
      };
      loadImage();
    }
  }, [question.id, question.imageDescription]);

  const handleSubmit = () => {
    const answer = question.type === QuestionType.FILL_BLANK ? textInput : selectedOption;
    
    // If already answered, proceed to next question
    if (isAnswered) {
      onAnswer(answer);
      return;
    }

    // Otherwise, validate answer
    if (question.type === QuestionType.FILL_BLANK) {
      if (!textInput.trim()) return;
    } else {
      if (!selectedOption) return;
    }

    // Simple A1 level validation (case-insensitive)
    const isAnswerCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    setIsCorrect(isAnswerCorrect);
    setIsAnswered(true);
  };

  const hasAnswer = question.type === QuestionType.FILL_BLANK ? textInput.trim().length > 0 : selectedOption !== '';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      if (!isAnswered && hasAnswer) {
        handleSubmit();
      } else if (isAnswered) {
        handleSubmit();
      }
    }
  };

  const getCategoryIcon = () => {
    switch(question.category) {
      case 'Listening (Hören)': return <Ear size={16} />;
      case 'Reading (Lesen)': return <BookOpen size={16} />;
      case 'Grammar (Grammatik)': return <PenTool size={16} />;
      default: return <Languages size={16} />;
    }
  };

  const getCategoryColor = () => {
    switch(question.category) {
      case 'Listening (Hören)': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Reading (Lesen)': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Grammar (Grammatik)': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  }

  const renderContent = () => {
    const getOptionClass = (opt: string) => {
      if (isAnswered) {
        if (opt === question.correctAnswer) {
          return "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md ring-1 ring-emerald-500";
        }
        if (opt === selectedOption && !isCorrect) {
          return "border-red-500 bg-red-50 text-red-900 shadow-md opacity-80";
        }
        return "border-slate-100 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed";
      }

      return selectedOption === opt
        ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md scale-[1.01]"
        : "border-slate-100 bg-white/50 hover:bg-white hover:border-indigo-300 text-slate-700 hover:shadow-sm";
    };

    // Render Image if available
    const renderImageSection = () => {
      if (!question.imageDescription) return null;

      if (isImageLoading) {
        return (
          <div className="w-full aspect-video md:aspect-[2/1] bg-slate-100/50 rounded-2xl flex flex-col items-center justify-center mb-6 animate-pulse border border-slate-200/60 backdrop-blur-sm">
            <ImageIcon size={48} className="text-slate-300 mb-3" />
            <span className="text-slate-400 text-sm font-medium">Generating visual context...</span>
          </div>
        );
      }

      if (imageUrl) {
        return (
          <div className="mb-8 flex justify-center">
            <div className="relative p-2 bg-white rounded-2xl shadow-lg border border-slate-100 rotate-1 hover:rotate-0 transition-transform duration-500">
              <img 
                src={imageUrl} 
                alt="Visual context" 
                className="rounded-xl max-w-full max-h-[250px] object-cover" 
              />
            </div>
          </div>
        );
      }

      return null;
    };

    switch (question.type) {
      case QuestionType.LISTENING:
        return (
          <div className="space-y-6">
            {question.listeningScript && <AudioPlayer text={question.listeningScript} />}
            <div className="space-y-3">
               {question.options?.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => !isAnswered && setSelectedOption(opt)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${getOptionClass(opt)}`}
                >
                  <span className="font-medium text-lg">{opt}</span>
                  {isAnswered ? (
                     opt === question.correctAnswer ? <CheckCircle2 size={20} className="text-emerald-600" /> :
                     (opt === selectedOption ? <XCircle size={20} className="text-red-500" /> : null)
                  ) : (
                    selectedOption === opt && (
                      <div className="bg-indigo-600 rounded-full p-1 text-white">
                        <CheckCircle2 size={16} />
                      </div>
                    )
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.TRUE_FALSE:
        // Fallback: ensure options exist for True/False even if API omits them
        const effectiveOptions = question.options && question.options.length > 0
          ? question.options
          : (question.type === QuestionType.TRUE_FALSE ? ['Richtig', 'Falsch'] : []);

        return (
          <div className="space-y-6">
            {renderImageSection()}
            
            {/* Context Text (Reading Material) */}
            {question.contextText && (
              <div className="bg-amber-50/80 p-6 rounded-2xl border border-amber-100 text-amber-900 mb-6 font-serif relative shadow-sm backdrop-blur-sm">
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 shadow-sm">
                  <BookOpen size={20} />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700/60 mb-2">
                  Read the text below:
                </div>
                <p className="whitespace-pre-line relative z-10 text-lg leading-relaxed">
                  {question.contextText}
                </p>
              </div>
            )}

            {/* Instruction Label */}
            <div className="text-slate-500 text-sm font-medium uppercase tracking-wider pl-1">
               Select the answer:
            </div>

            <div className="grid grid-cols-1 gap-3">
              {effectiveOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => !isAnswered && setSelectedOption(opt)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${getOptionClass(opt)}`}
                >
                   <span className="font-medium text-lg">{opt}</span>
                   {isAnswered ? (
                     opt === question.correctAnswer ? <CheckCircle2 size={20} className="text-emerald-600" /> :
                     (opt === selectedOption ? <XCircle size={20} className="text-red-500" /> : null)
                  ) : (
                    selectedOption === opt && (
                      <div className="bg-indigo-600 rounded-full p-1 text-white">
                        <CheckCircle2 size={16} />
                      </div>
                    )
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case QuestionType.FILL_BLANK:
        return (
          <div className="space-y-6">
            {renderImageSection()}
            {question.contextText && (
              <div className="bg-slate-100/80 p-6 rounded-2xl border border-slate-200 text-slate-700 mb-6 font-mono text-sm shadow-inner">
                 {question.contextText}
              </div>
            )}
            <div className="relative group">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isAnswered}
                placeholder="Type your answer here..."
                className={`w-full p-5 text-xl bg-white/50 backdrop-blur-sm border-2 rounded-2xl outline-none transition-all shadow-sm placeholder:text-slate-400
                  ${isAnswered 
                    ? (isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-red-500 bg-red-50 text-red-900") 
                    : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  }
                `}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2">
                 {isAnswered ? (
                    isCorrect ? <CheckCircle2 className="text-emerald-600" /> : <XCircle className="text-red-500" />
                 ) : (
                    <PenTool size={16} className="text-slate-400" />
                 )}
              </div>
            </div>
            {/* Show Correct Answer if wrong in Fill Blank */}
            {isAnswered && !isCorrect && (
                <div className="px-4 py-2 bg-slate-100 rounded-lg border border-slate-200 inline-block text-slate-600 text-sm font-medium">
                    Correct Answer: <span className="text-slate-900 font-bold">{question.correctAnswer}</span>
                </div>
            )}
          </div>
        );
      
      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fadeIn">
      <div className="flex items-center gap-2 mb-6">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${getCategoryColor()}`}>
          {getCategoryIcon()}
          {question.category}
        </div>
      </div>
      
      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-6 leading-tight">
        {question.questionText}
      </h2>
      
      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-8"></div>

      {renderContent()}

      {/* Feedback Section */}
      {isAnswered && (
        <div className={`mt-8 p-5 rounded-2xl border animate-in fade-in slide-in-from-bottom-4 duration-500 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </div>
                <div>
                    <h3 className={`font-bold text-lg mb-1 ${isCorrect ? 'text-emerald-900' : 'text-red-900'}`}>
                        {isCorrect ? 'Ausgezeichnet!' : 'Incorrect'}
                    </h3>
                    <p className={`leading-relaxed ${isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                        {question.explanation}
                    </p>
                </div>
            </div>
        </div>
      )}

      <div className="mt-10 flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={!hasAnswer || isSubmitting}
          className={`w-full sm:w-auto min-w-[180px] shadow-lg transition-all duration-300 ${isAnswered ? (isCorrect ? 'shadow-emerald-200 hover:shadow-emerald-300' : 'shadow-red-200 hover:shadow-red-300') : 'shadow-indigo-200'}`}
          variant={isAnswered ? (isCorrect ? 'secondary' : 'primary') : 'primary'}
        >
          {isAnswered ? (
             <>Next Question <ArrowRight size={20} /></>
          ) : (
             <>Check Answer</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuestionCard;