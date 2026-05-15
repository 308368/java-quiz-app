import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizEngine } from '../hooks/useQuizEngine';
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

export default function WrongNotesPage() {
  const { questions, wrongNotes, categories, restoreQuestion, removeFromWrongNotes } = useQuizEngine();
  const navigate = useNavigate();
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = wrongNotes
    .filter(w => !filterCategory || questions.find(q => q.id === w.id)?.category === filterCategory)
    .sort((a, b) => b.wrongCount - a.wrongCount);

  const weakPoints = filtered.filter(w => w.wrongCount >= 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">错题本</h1>
        <p className="text-gray-500 text-sm mt-1">
          共 {wrongNotes.length} 道错题，{weakPoints.length} 道需要重点复习
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !filterCategory
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          全部
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Weak points highlight */}
      {weakPoints.length > 0 && !filterCategory && (
        <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-4">
          <h3 className="text-red-400 font-semibold text-sm mb-2">薄弱知识点（答错 ≥3 次）</h3>
          <div className="space-y-2">
            {weakPoints.map(w => {
              const q = questions.find(q => q.id === w.id);
              if (!q) return null;
              return (
                <div key={w.id} className="flex items-center gap-2 text-sm">
                  <span className="text-red-500 font-bold">{w.wrongCount}x</span>
                  <span className="text-gray-300">{q.question}</span>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-500">{q.category}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wrong questions list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-lg font-medium text-gray-400">太棒了！</p>
          <p className="text-sm mt-1">暂时没有错题，继续保持</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            返回首页
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(w => {
            const q = questions.find(q => q.id === w.id);
            if (!q) return null;
            const isExpanded = expandedId === w.id;
            const isWeak = w.wrongCount >= 3;

            return (
              <div
                key={w.id}
                className={`bg-gray-900 border rounded-xl overflow-hidden transition-colors ${
                  isWeak ? 'border-red-900/50' : 'border-gray-800'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : w.id)}
                  className="w-full px-5 py-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 mt-0.5 text-xs font-bold px-2 py-0.5 rounded ${
                      isWeak ? 'bg-red-900/40 text-red-400' : 'bg-gray-800 text-gray-500'
                    }`}>
                      {w.wrongCount}次
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200 font-medium text-sm line-clamp-2">{q.question}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-600">{q.category}</span>
                        {isWeak && (
                          <span className="text-xs text-red-500">重点</span>
                        )}
                      </div>
                    </div>
                    <span className={`flex-shrink-0 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-gray-800">
                    <div className="pt-3 space-y-3">
                      <div>
                        <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">正确答案</h4>
                        <div className="prose prose-invert prose-sm max-w-none p-3 bg-gray-800 rounded-lg text-gray-300">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{ code: CodeBlock }}
                          >
                            {q.answer}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { restoreQuestion(w.id); }}
                          className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-900/50 rounded-lg text-sm font-medium transition-colors"
                        >
                          重新练习
                        </button>
                        <button
                          onClick={() => removeFromWrongNotes(w.id)}
                          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          从错题本移除
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}