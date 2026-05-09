import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface QuizCardProps {
  question: string;
  category: string;
  questionNumber: number;
  totalQuestions: number;
  onSubmit: (answer: string) => void;
}

export default function QuizCard({
  question,
  category,
  questionNumber,
  totalQuestions,
  onSubmit,
}: QuizCardProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answer);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-sm text-gray-500">{category}</span>
        <span className="text-sm font-medium text-gray-400">
          {questionNumber} / {totalQuestions}
        </span>
      </div>
      <div className="p-5">
        <div className="prose prose-invert prose-sm max-w-none mb-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{question}</ReactMarkdown>
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="输入你的答案...（支持 Markdown 格式）"
            className="w-full min-h-32 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 resize-y focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            autoFocus
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={!answer.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
            >
              提交答案
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}