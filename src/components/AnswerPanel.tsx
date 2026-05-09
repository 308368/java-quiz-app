import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AnswerPanelProps {
  correctAnswer: string;
  explanation?: string;
  userAnswer?: string;
}

export default function AnswerPanel({ correctAnswer, explanation, userAnswer }: AnswerPanelProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800 bg-green-900/20">
        <h3 className="text-green-400 font-semibold text-sm">参考答案</h3>
      </div>
      <div className="p-5 space-y-4">
        {userAnswer && (
          <div>
            <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">你的答案</h4>
            <div className="prose prose-invert prose-sm max-w-none p-3 bg-gray-800 rounded-lg border border-gray-700 text-gray-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{userAnswer}</ReactMarkdown>
            </div>
          </div>
        )}
        <div>
          <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">正确答案</h4>
          <div className="prose prose-invert prose-sm max-w-none p-3 bg-gray-800 rounded-lg border border-green-900/30">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{correctAnswer}</ReactMarkdown>
          </div>
        </div>
        {explanation && (
          <div>
            <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">解析</h4>
            <div className="prose prose-invert prose-sm max-w-none p-3 bg-blue-900/20 rounded-lg border border-blue-900/30 text-blue-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}