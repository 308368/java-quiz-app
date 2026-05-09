import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuizEngine } from '../hooks/useQuizEngine';
import QuizCard from '../components/QuizCard';
import AnswerPanel from '../components/AnswerPanel';
import RestoreButton from '../components/RestoreButton';
import StatsPanel from '../components/StatsPanel';
import ProgressBar from '../components/ProgressBar';

const ALL_CATEGORIES = ['Java SE', 'Spring', 'MySQL', 'Redis', 'JVM'];

export default function QuizPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const engine = useQuizEngine();
  const { currentQuestion, markWrong, markCorrect, restoreQuestion, startQuiz, loadNext, getNextQuestion, stats } = engine;

  const [userAnswer, setUserAnswer] = useState('');
  const [answeredCorrect, setAnsweredCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const category = searchParams.get('category') || ALL_CATEGORIES[0];

  // Start quiz on mount
  useEffect(() => {
    if (!initialized) {
      startQuiz(category);
      setInitialized(true);
    }
  }, [category]);

  const handleSubmit = (answer: string) => {
    if (!currentQuestion || showResult) return;
    setUserAnswer(answer);
    setShowResult(true);
    setAnsweredCorrect(null);
  };

  const handleNext = () => {
    const next = getNextQuestion();
    if (next) {
      startQuiz(category);
      loadNext();
    }
    setShowResult(false);
    setUserAnswer('');
    setAnsweredCorrect(null);
  };

  const handleMarkCorrect = () => {
    if (!currentQuestion) return;
    markCorrect(currentQuestion.id);
    setAnsweredCorrect(true);
    setTotalAnswered(prev => prev + 1);
    setTimeout(handleNext, 800);
  };

  const handleMarkWrong = () => {
    if (!currentQuestion) return;
    markWrong(currentQuestion.id);
    setAnsweredCorrect(false);
    setTotalAnswered(prev => prev + 1);
    setTimeout(handleNext, 800);
  };

  const categoryStats = stats.byCategory[category] || { total: 0, correct: 0, wrong: 0 };
  const answeredInCategory = categoryStats.correct + categoryStats.wrong;
  const isPoolEmpty = !currentQuestion && !showResult;

  if (isPoolEmpty) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-2">本轮练习完成！</h2>
          <p className="text-gray-400 mb-6">
            已回答 {totalAnswered} 道题目
          </p>
        </div>
        <StatsPanel
          stats={{
            total: categoryStats.total,
            correct: categoryStats.correct,
            wrong: categoryStats.wrong,
            accuracy: categoryStats.total > 0
              ? Math.round((categoryStats.correct / (categoryStats.correct + categoryStats.wrong || 1)) * 100)
              : 0,
          }}
          title="本轮统计"
        />
        <div className="flex gap-3">
          <button
            onClick={() => { startQuiz(category); setTotalAnswered(0); setInitialized(true); }}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors"
          >
            再来一轮
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-xl font-semibold transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{category}</h2>
          <p className="text-sm text-gray-500">
            {categoryStats.total - answeredInCategory} 题剩余 · {answeredInCategory} 已答
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          退出
        </button>
      </div>

      {/* Progress */}
      {categoryStats.total > 0 && (
        <ProgressBar
          current={answeredInCategory}
          total={categoryStats.total}
        />
      )}

      {/* Question card */}
      {currentQuestion && !showResult && (
        <QuizCard
          question={currentQuestion.question}
          category={currentQuestion.category}
          questionNumber={answeredInCategory + 1}
          totalQuestions={categoryStats.total}
          onSubmit={handleSubmit}
        />
      )}

      {/* Result panel */}
      {currentQuestion && showResult && (
        <div className="space-y-4">
          <AnswerPanel
            correctAnswer={currentQuestion.answer}
            explanation={currentQuestion.explanation}
            userAnswer={userAnswer}
          />
          <div className="flex gap-3">
            <button
              onClick={handleMarkCorrect}
              disabled={answeredCorrect !== null}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-semibold transition-colors"
            >
              答对了 ✓
            </button>
            <button
              onClick={handleMarkWrong}
              disabled={answeredCorrect !== null}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-semibold transition-colors"
            >
              答错了 ✗
            </button>
          </div>
          {answeredCorrect === true && (
            <RestoreButton onClick={() => restoreQuestion(currentQuestion.id)} />
          )}
        </div>
      )}
    </div>
  );
}