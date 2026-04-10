"use client";

import { useState, useEffect } from "react";
import { User, getUserById } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editing, setEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const decoded = JSON.parse(atob(token));
          const userData = await getUserById(decoded.userId);
          setUser(userData);
          if (userData) {
            setName(userData.name);
            setEmail(userData.email);
          }
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSave = async () => {
    // 实际项目中应该调用 API 更新用户信息
    alert('保存成功！');
    setEditing(false);
  };

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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">请先登录</h2>
          <p className="text-gray-500 mb-6">登录后查看设置</p>
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
      
      {/* 头部导航 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>←</span>
            <span>返回个人中心</span>
          </Link>
        </div>
      </header>

      {/* 设置内容 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">设置</h2>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">个人资料</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              {editing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{user.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              {editing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{user.email}</p>
              )}
            </div>
            
            <div className="pt-4">
              {editing ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <span>💾</span>
                    <span>保存</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      if (user) {
                        setName(user.name);
                        setEmail(user.email);
                      }
                    }}
                    className="flex items-center gap-2 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span>✕</span>
                    <span>取消</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  编辑资料
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">账号安全</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between hover:bg-gray-50 p-3 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span>🔒</span>
                  </div>
                  <span className="text-gray-700">修改密码</span>
                </div>
                <button 
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                  onClick={() => {
                    // 实际项目中应该跳转到修改密码页面
                    alert('修改密码功能开发中');
                  }}
                >
                  点击修改
                </button>
              </div>
              <div className="flex items-center justify-between hover:bg-gray-50 p-3 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span>📱</span>
                  </div>
                  <span className="text-gray-700">绑定手机</span>
                </div>
                <button 
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                  onClick={() => {
                    // 实际项目中应该跳转到绑定手机页面
                    alert('绑定手机功能开发中');
                  }}
                >
                  立即绑定
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">其他设置</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between hover:bg-gray-50 p-3 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span>🔔</span>
                  </div>
                  <span className="text-gray-700">通知设置</span>
                </div>
                <button 
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                  onClick={() => {
                    // 实际项目中应该跳转到通知设置页面
                    alert('通知设置功能开发中');
                  }}
                >
                  查看
                </button>
              </div>
              <div className="flex items-center justify-between hover:bg-gray-50 p-3 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span>ℹ️</span>
                  </div>
                  <span className="text-gray-700">关于我们</span>
                </div>
                <button 
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                  onClick={() => {
                    // 实际项目中应该跳转到关于我们页面
                    alert('关于我们功能开发中');
                  }}
                >
                  查看
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
