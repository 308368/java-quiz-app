import { useNavigate } from 'react-router-dom';

interface CategorySelectProps {
  categories: string[];
  stats: Record<string, { total: number; correct: number; wrong: number }>;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Java SE': '☕',
  'JVM': '⚙️',
  'MySQL': '🗄️',
  'Redis': '🚀',
  'Spring': '🌱',
};

export default function CategorySelect({ categories, stats }: CategorySelectProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {categories.map(cat => {
        const s = stats[cat] || { total: 0, correct: 0, wrong: 0 };
        const progress = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
        const icon = CATEGORY_ICONS[cat] || '📚';

        return (
          <button
            key={cat}
            onClick={() => navigate(`/quiz?category=${encodeURIComponent(cat)}`)}
            className="group bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-blue-500/50 hover:bg-gray-800/50 transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {cat}
                  </h3>
                  <span className="text-xs text-gray-500">{s.total} 题</span>
                </div>
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span className="text-green-400">{s.correct} 掌握</span>
                    <span className="text-red-400">{s.wrong} 薄弱</span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}