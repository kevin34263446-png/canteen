"use client";

import { useState, useEffect } from "react";
import { User, getUserById } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editing, setEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [userType, setUserType] = useState<string>('student');
  const [studentId, setStudentId] = useState<string>('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState<boolean>(false);
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
            setName(userData.name);
            setEmail(userData.email);
            setUserType(userData.user_type);
            setStudentId(userData.student_id);
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

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // 验证用户名
    if (!name.trim()) {
      newErrors.name = '请输入用户名';
    } else if (name.length < 3 || name.length > 20) {
      newErrors.name = '用户名长度应在3-20个字符之间';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      newErrors.name = '用户名只能包含字母、数字、下划线和连字符';
    }
    
    // 验证邮箱
    if (!email.trim()) {
      newErrors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    
    // 验证身份标识
    if (!studentId.trim()) {
      newErrors.studentId = userType === 'student' ? '请输入学号' : '请输入工号';
    } else if (userType === 'student' && studentId.length !== 10) {
      newErrors.studentId = '学号必须为10位';
    } else if (userType === 'staff' && studentId.length !== 8) {
      newErrors.studentId = '工号必须为8位';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      // 实际项目中应该调用 API 更新用户信息
      console.log('保存用户资料:', {
        name,
        email,
        user_type: userType,
        student_id: studentId
      });
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('保存成功！');
      setEditing(false);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
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
                <>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-900">{user.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              {editing ? (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-900">{user.email}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">身份</label>
              {editing ? (
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input
                      id="student"
                      name="userType"
                      type="radio"
                      value="student"
                      checked={userType === "student"}
                      onChange={() => setUserType("student")}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="student" className="ml-2 block text-sm text-gray-900">
                      学生
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="staff"
                      name="userType"
                      type="radio"
                      value="staff"
                      checked={userType === "staff"}
                      onChange={() => setUserType("staff")}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="staff" className="ml-2 block text-sm text-gray-900">
                      教职工
                    </label>
                  </div>
                </div>
              ) : (
                <p className="text-gray-900">{user.user_type === 'student' ? '学生' : '教职工'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {userType === 'student' ? '学号' : '工号'}
              </label>
              {editing ? (
                <>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 ${
                      errors.studentId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.studentId && (
                    <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-900">{user.student_id}</p>
              )}
            </div>
            
            <div className="pt-4">
              {editing ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        <span>保存中...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>保存</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setErrors({});
                      if (user) {
                        setName(user.name);
                        setEmail(user.email);
                        setUserType(user.user_type);
                        setStudentId(user.student_id);
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
