import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="text-lg font-bold text-white hover:text-blue-400 transition-colors">
            Java 面试刷题
          </Link>
          <nav className="flex gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-gray-800 text-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              首页
            </Link>
            <Link
              to="/wrong-notes"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/wrong-notes')
                  ? 'bg-gray-800 text-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              错题本
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}