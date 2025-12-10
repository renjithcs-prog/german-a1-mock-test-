export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  FILL_BLANK = 'fill_blank',
  LISTENING = 'listening',
  TRUE_FALSE = 'true_false'
}

export type ExamCategory = 'Grammar (Grammatik)' | 'Vocabulary (Wortschatz)' | 'Listening (Hören)' | 'Reading (Lesen)';

export interface Question {
  id: string;
  type: QuestionType;
  category: ExamCategory;
  questionText: string;
  options?: string[]; // For MC and Listening
  correctAnswer: string;
  explanation: string;
  listeningScript?: string; // Text to be converted to speech for Listening questions
  contextText?: string; // For Reading comprehension (passage)
  imageDescription?: string; // Prompt to generate an image for visual context
}

export interface UserInfo {
  name: string;
  nativeLanguage: string;
  phone: string;
}

export interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>; // questionId -> userAnswer
  score: number;
  status: 'idle' | 'loading' | 'active' | 'collecting_info' | 'completed' | 'error';
  userInfo?: UserInfo;
  error?: string;
}

export interface ExamResult {
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  feedback: string;
}