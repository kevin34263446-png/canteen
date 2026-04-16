"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { user, logout } = useAuth();
  console.log("Navbar user:", user);

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  return (
    <nav className="sticky top-0 z-20 border-b border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl mr-2">🌌</span>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                美食星云
              </span>
            </Link>
            <Link 
              href="/discover" 
              className="flex items-center px-3 py-2 rounded-full text-sm font-medium text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 transition-all"
            >
              <span className="inline mr-1">✨</span>
              发现
            </Link>
            <Link 
              href="/ranking" 
              className="flex items-center px-3 py-2 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 transition-all"
            >
              <span className="inline mr-1">🏆</span>
              排行榜
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {user.is_admin && (
                  <Link
                    href="/admin"
                    className="flex items-center px-3 py-2 rounded-full text-sm font-medium text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 transition-all"
                  >
                    <span className="inline mr-1">⚙️</span>
                    管理面板
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="flex items-center px-3 py-2 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 transition-all"
                >
                  <span className="inline mr-1">👤</span>
                  个人中心
                </Link>
                <span className="text-sm text-gray-300">
                  欢迎，{user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 transition-all"
                >
                  <span className="inline mr-1">🚪</span>
                  退出
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 transition-all"
                >
                  <span className="inline mr-1">🔑</span>
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/25"
                >
                  <span className="inline mr-1">📝</span>
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
