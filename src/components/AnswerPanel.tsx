import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AnswerPanelProps {
  correctAnswer: string;
  explanation?: string;
  userAnswer?: string;
}

// 自定义代码块渲染器
const CodeBlock = ({ node, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  // 如果有语言标识或者是多行代码，使用语法高亮
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

  // 行内代码
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

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
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{ code: CodeBlock }}
              >
                {userAnswer}
              </ReactMarkdown>
            </div>
          </div>
        )}
        <div>
          <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">正确答案</h4>
          <div className="prose prose-invert prose-sm max-w-none p-3 bg-gray-800 rounded-lg border border-green-900/30">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{ code: CodeBlock }}
            >
              {correctAnswer}
            </ReactMarkdown>
          </div>
        </div>
        {explanation && (
          <div>
            <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">解析</h4>
            <div className="prose prose-invert prose-sm max-w-none p-3 bg-blue-900/20 rounded-lg border border-blue-900/30 text-blue-300">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{ code: CodeBlock }}
              >
                {explanation}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}