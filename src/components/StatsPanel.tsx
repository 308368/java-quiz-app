interface Stats {
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

interface StatsPanelProps {
  stats: Stats;
  title?: string;
  subtitle?: string;
}

export default function StatsPanel({ stats, title, subtitle }: StatsPanelProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      )}
      {subtitle && (
        <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-1">总题数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{stats.correct}</div>
          <div className="text-xs text-gray-500 mt-1">已掌握</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{stats.wrong}</div>
          <div className="text-xs text-gray-500 mt-1">薄弱</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.accuracy}%</div>
          <div className="text-xs text-gray-500 mt-1">正确率</div>
        </div>
      </div>
    </div>
  );
}