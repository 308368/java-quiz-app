import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// 自定义代码块渲染器
const CodeBlock = ({ node, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  if (match || codeString.includes('\n')) {
    return (
      <div className="relative group my-3">
        {language && (
          <div className="absolute top-0 right-0 px-2 py-1 text-xs text-gray-500 bg-gray-700 rounded-bl rounded-tr-md opacity-0 group-hover:opacity-100 transition-opacity">
            {language}
          </div>
        )}
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language || 'java'}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.6',
            padding: '16px',
            backgroundColor: '#1a1a2e',
            border: '1px solid #2d2d44',
          }}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{ code: CodeBlock }}
          >
            {question}
          </ReactMarkdown>
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