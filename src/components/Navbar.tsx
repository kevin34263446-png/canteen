"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  return (
    <nav className="sticky top-0 z-20 border-b border-white/40 bg-white/72 backdrop-blur-xl shadow-[0_10px_30px_rgba(110,78,48,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-amber-700 mr-2">🏠</span>
              <span className="text-xl font-semibold text-stone-800">
                食堂评价系统
              </span>
            </Link>
            <Link 
              href="/ranking" 
              className="flex items-center px-3 py-2 rounded-full text-sm font-medium text-stone-700 hover:text-stone-900 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400"
            >
              <span className="inline mr-1">🏆</span>
              排行榜
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/profile"
                  className="flex items-center px-3 py-2 rounded-full text-sm font-medium text-stone-700 hover:text-stone-900 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400"
                >
                  <span className="inline mr-1">👤</span>
                  个人中心
                </Link>
                <span className="text-sm text-stone-700">
                  欢迎，{user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-full text-sm font-medium text-stone-700 hover:text-stone-900 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400"
                >
                  <span className="inline mr-1">🚪</span>
                  退出
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-full text-sm font-medium text-stone-700 hover:text-stone-900 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400"
                >
                  <span className="inline mr-1">🔑</span>
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 rounded-full text-sm font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-50/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400"
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
