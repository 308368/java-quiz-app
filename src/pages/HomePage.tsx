import { Link } from 'react-router-dom';
import { useQuizEngine } from '../hooks/useQuizEngine';
import CategorySelect from '../components/CategorySelect';
import StatsPanel from '../components/StatsPanel';

export default function HomePage() {
  const { categories, stats } = useQuizEngine();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          Java 面试刷题
        </h1>
        <p className="text-gray-400">
          针对 Java 后端面试的高频题目，支持错题本管理
        </p>
      </div>

      {/* Overall stats */}
      <StatsPanel
        stats={stats}
        title="学习进度"
        subtitle="基于所有题库的总体掌握情况"
      />

      {/* Quick start categories */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">选择分类开始练习</h2>
        <CategorySelect categories={categories} stats={stats.byCategory} />
      </div>

      {/* Wrong notes link */}
      {stats.wrong > 0 && (
        <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-red-400">错题本</h3>
              <p className="text-sm text-gray-400 mt-1">
                你有 <span className="text-red-400 font-bold">{stats.wrong}</span> 道错题待复习
              </p>
            </div>
            <Link
              to="/wrong-notes"
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-900/50 rounded-lg text-sm font-medium transition-colors"
            >
              查看错题
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}