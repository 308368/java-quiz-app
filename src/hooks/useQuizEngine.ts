import { useState, useCallback } from 'react';
import type { Question, WrongQuestion } from '../types/question';
import { useLocalStorage } from './useLocalStorage';

// All questions loaded from JSON (loaded once at module level)
import allQuestionsData from '../../data/questions.json';

const ALL_QUESTIONS: Question[] = allQuestionsData as Question[];

const WRONG_NOTES_KEY = 'quiz-wrong-notes';
const CORRECT_SET_KEY = 'quiz-correct-set';
const RESTORED_SET_KEY = 'quiz-restored-set';


export function useQuizEngine() {
  const [wrongNotes, setWrongNotes] = useLocalStorage<WrongQuestion[]>(WRONG_NOTES_KEY, []);
  const [correctSet, setCorrectSet] = useLocalStorage<string[]>(CORRECT_SET_KEY, []);
  const [, setRestoredSet] = useLocalStorage<string[]>(RESTORED_SET_KEY, []);

  const [activePool, setActivePool] = useState<string[]>([]);
  const [, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, { questionId: string; correct: boolean; answeredAt: string }>>({});
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answeredQuestionId, setAnsweredQuestionId] = useState<string | null>(null);

  // Persist wrongNotes, correctSet, restoredSet via useLocalStorage (already handled)

  const questions = ALL_QUESTIONS;

  const categories = Array.from(new Set(questions.map(q => q.category))).sort();

  const getNextQuestion = useCallback((): Question | null => {
    if (activePool.length === 0) return null;
    const randomIdx = Math.floor(Math.random() * activePool.length);
    const id = activePool[randomIdx];
    return questions.find(q => q.id === id) ?? null;
  }, [activePool, questions]);

  const markWrong = useCallback((id: string) => {
    const now = new Date().toISOString();
    setAnsweredQuestionId(id);
    setWrongNotes(prev => {
      const existing = prev.find(w => w.id === id);
      if (existing) {
        return prev.map(w => w.id === id ? { ...w, wrongCount: w.wrongCount + 1, wrongAt: now } : w);
      }
      return [...prev, { id, wrongAt: now, wrongCount: 1 }];
    });
    setActivePool(prev => prev.filter(pid => pid !== id));
    setSessionAnswers(prev => ({ ...prev, [id]: { questionId: id, correct: false, answeredAt: now } }));
  }, [setWrongNotes]);

  const markCorrect = useCallback((id: string) => {
    const now = new Date().toISOString();
    setAnsweredQuestionId(id);
    setCorrectSet(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
    setActivePool(prev => prev.filter(pid => pid !== id));
    setSessionAnswers(prev => ({ ...prev, [id]: { questionId: id, correct: true, answeredAt: now } }));
  }, [setCorrectSet]);

  const restoreQuestion = useCallback((id: string) => {
    setRestoredSet(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
    // Remove from wrongNotes
    setWrongNotes(prev => prev.filter(w => w.id !== id));
    // Add back to activePool if category matches
    setActivePool(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, [setRestoredSet, setWrongNotes]);

  const removeFromWrongNotes = useCallback((id: string) => {
    setWrongNotes(prev => prev.filter(w => w.id !== id));
  }, [setWrongNotes]);

  const startQuiz = useCallback((category: string) => {
    const pool = questions.filter(q => q.category === category).map(q => q.id);
    setActivePool(pool);
    setSelectedCategory(category);
    setSessionAnswers({});
    setCurrentIndex(0);
    if (pool.length > 0) {
      const randomIdx = Math.floor(Math.random() * pool.length);
      const id = pool[randomIdx];
      setCurrentQuestion(questions.find(q => q.id === id) ?? null);
    } else {
      setCurrentQuestion(null);
    }
  }, [questions]);

  // Load next question into currentQuestion state
  const loadNext = useCallback(() => {
    if (activePool.length === 0) {
      setCurrentQuestion(null);
      return;
    }
    const next = getNextQuestion();
    setCurrentQuestion(next);
    setCurrentIndex(prev => prev + 1);
  }, [activePool, getNextQuestion]);

  const stats = {
    total: questions.length,
    correct: correctSet.length,
    wrong: wrongNotes.length,
    accuracy: questions.length > 0
      ? Math.round((correctSet.length / (correctSet.length + wrongNotes.length || 1)) * 100)
      : 0,
    byCategory: Object.fromEntries(
      categories.map(cat => [
        cat,
        {
          total: questions.filter(q => q.category === cat).length,
          correct: correctSet.filter(id => questions.find(q => q.id === id)?.category === cat).length,
          wrong: wrongNotes.filter(w => questions.find(q => q.id === w.id)?.category === cat).length,
        }
      ])
    ),
  };

  return {
    questions,
    categories,
    activePool,
    wrongNotes,
    currentQuestion,
    isAnswered: currentQuestion ? answeredQuestionId === currentQuestion.id : false,
    markWrong,
    markCorrect,
    restoreQuestion,
    removeFromWrongNotes,
    getNextQuestion,
    loadNext,
    startQuiz,
    stats,
    selectedCategory,
    sessionAnswers,
  };
}