"use client";

import { useState, useEffect } from "react";
import { User, getUserById } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const decoded = JSON.parse(atob(token));
          const userData = await getUserById(decoded.userId);
          setUser(userData);
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <span className="text-4xl text-gray-300 block mb-4">👤</span>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">请先登录</h2>
          <p className="text-gray-500 mb-6">登录后查看个人中心</p>
          <a 
            href="/login" 
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            去登录
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* 个人中心头部 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-4xl text-blue-500">👤</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500">{user.email}</p>
              <p className="text-gray-500">
                {user.user_type === 'student' ? '学生' : '教职工'} · 
                {user.user_type === 'student' ? '学号' : '工号'}: {user.student_id}
              </p>
              <div className="mt-4">
                <a 
                  href="/profile/settings" 
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <span>✏️</span>
                  <span>编辑资料</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 功能菜单 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* 评价历史 */}
          <a 
            href="/profile/reviews" 
            className="flex items-center justify-between p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-500">📋</span>
              </div>
              <span className="text-gray-900 font-medium">评价历史</span>
            </div>
            <div className="text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          {/* 收藏 */}
          <a 
            href="/profile/favorites" 
            className="flex items-center justify-between p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-500">❤️</span>
              </div>
              <span className="text-gray-900 font-medium">我的收藏</span>
            </div>
            <div className="text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          {/* 设置 */}
          <a 
            href="/profile/settings" 
            className="flex items-center justify-between p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-500">⚙️</span>
              </div>
              <span className="text-gray-900 font-medium">设置</span>
            </div>
            <div className="text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          {/* 退出登录 */}
          <button 
            className="flex items-center justify-between w-full p-6 text-left hover:bg-gray-50 transition-colors"
            onClick={() => {
              if (confirm('确定要退出登录吗？')) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-500">🚪</span>
              </div>
              <span className="text-red-500 font-medium">退出登录</span>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
