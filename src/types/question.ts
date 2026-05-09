export interface Question {
  id: string;
  category: string;
  question: string;
  answer: string;
  explanation?: string;
}

export interface WrongQuestion {
  id: string;
  wrongAt: string;
  wrongCount: number;
}

export interface SessionAnswer {
  questionId: string;
  correct: boolean;
  answeredAt: string;
}

export interface QuizState {
  activePool: string[];
  wrongNotes: WrongQuestion[];
  correctSet: string[];
  restoredSet: string[];
  currentIndex: number;
  sessionAnswers: Record<string, SessionAnswer>;
  selectedCategory: string | null;
}