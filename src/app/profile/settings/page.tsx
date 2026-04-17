"use client";

import { useState, useEffect } from "react";
import { User, getUserById, updateUserProfile } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [height, setHeight] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | ''>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileSuccess, setProfileSuccess] = useState<string>('');
  const [profileError, setProfileError] = useState<string>('');

  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');

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
            setHeight(userData.height || '');
            setWeight(userData.weight || '');
            setAge(userData.age || '');
            setGender(userData.gender || '');
            setActivityLevel(userData.activity_level || '');
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

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setProfileError('请先登录');
        return;
      }
      const decoded = JSON.parse(atob(token));

      const result = await updateUserProfile(decoded.userId, {
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        age: age ? Number(age) : undefined,
        gender: gender || undefined,
        activity_level: activityLevel || undefined
      });

      if (result.success && result.user) {
        setUser(result.user);
        setProfileSuccess('身体信息保存成功！');
        
        const updatedUser = { ...user, ...result.user } as User;
        const newToken = btoa(JSON.stringify({ userId: updatedUser.id }));
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setProfileError(result.error || '保存失败');
      }
    } catch (err) {
      setProfileError('保存失败，请重试');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('请填写完整信息');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('新密码长度不能少于6位');
      return;
    }

    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setPasswordError('请先登录');
        return;
      }
      const decoded = JSON.parse(atob(token));

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: decoded.userId,
          oldPassword,
          newPassword,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setPasswordError(data.message);
      } else {
        setPasswordSuccess('密码修改成功');
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          setShowChangePassword(false);
          setPasswordSuccess('');
        }, 2000);
      }
    } catch (err) {
      setPasswordError('密码修改失败，请重试');
    } finally {
      setChangingPassword(false);
    }
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">设置</h2>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">身体信息</h3>
            <p className="text-sm text-gray-500 mb-4">完善身体信息，营养看板将根据您的数据计算每日推荐摄入量</p>

            {profileSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-green-600 text-sm">{profileSuccess}</p>
              </div>
            )}
            {profileError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{profileError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">身高 (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : "")}
                  placeholder="例如: 175"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">体重 (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : "")}
                  placeholder="例如: 70"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                  placeholder="例如: 25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                >
                  <option value="">请选择</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">活动水平</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                >
                  <option value="">请选择</option>
                  <option value="sedentary">久坐不动（很少或不锻炼）</option>
                  <option value="light">轻度活动（每周1-3天锻炼）</option>
                  <option value="moderate">中度活动（每周3-5天锻炼）</option>
                  <option value="active">高度活动（每周6-7天锻炼）</option>
                  <option value="very_active">极高活动（专业运动员水平）</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingProfile ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>保存身体信息</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">账号安全</h3>
            <div className="space-y-4">
              <div className="hover:bg-gray-50 p-3 rounded-lg transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Lock className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-gray-700">修改密码</span>
                  </div>
                  <button 
                    className="text-blue-500 hover:text-blue-600 transition-colors"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                  >
                    {showChangePassword ? '收起' : '点击修改'}
                  </button>
                </div>

                {showChangePassword && (
                  <div className="mt-4 space-y-4">
                    {passwordError && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-red-600 text-sm">{passwordError}</p>
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <p className="text-green-600 text-sm">{passwordSuccess}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">原密码</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                        placeholder="请输入原密码"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                        placeholder="请输入新密码（至少6位）"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                        placeholder="请再次输入新密码"
                      />
                    </div>
                    <button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {changingPassword ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          <span>修改中...</span>
                        </>
                      ) : (
                        <span>确认修改</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
