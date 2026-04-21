'use client';

import { useState, useEffect, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Camera, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { getUserById, updateUserBasicInfo, updateUserProfile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  name: string;
  user_type: string;
  student_id?: string;
  avatar_url?: string;
  is_admin?: boolean;
  height?: number;
  weight?: number;
  age?: number;
  gender?: 'male' | 'female';
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  created_at?: string;
  updated_at?: string;
}

export default function Settings() {
  const router = useRouter();
  const { user: authUser, updateUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  const [height, setHeight] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | ''>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileSuccess, setProfileSuccess] = useState<string>('');
  const [profileError, setProfileError] = useState<string>('');
  const [editingProfile, setEditingProfile] = useState<boolean>(false);

  const [editingBasic, setEditingBasic] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [savingBasic, setSavingBasic] = useState<boolean>(false);
  const [basicSuccess, setBasicSuccess] = useState<string>('');
  const [basicError, setBasicError] = useState<string>('');

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
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setHeight(userData.height || '');
          setWeight(userData.weight || '');
          setAge(userData.age || '');
          setGender(userData.gender || '');
          setActivityLevel(userData.activity_level || '');
          setName(userData.name);
          setAvatarUrl(userData.avatar_url || '');
          setStudentId(userData.student_id || '');
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('auth_token');
        if (token) {
          const decoded = JSON.parse(atob(token));
          const userData = await getUserById(decoded.userId);
          if (userData) {
            setUser(userData);
            setHeight(userData.height || '');
            setWeight(userData.weight || '');
            setAge(userData.age || '');
            setGender(userData.gender || '');
            setActivityLevel(userData.activity_level || '');
            setName(userData.name);
            setAvatarUrl(userData.avatar_url || '');
            setStudentId(userData.student_id || '');
            localStorage.setItem('auth_user', JSON.stringify(userData));
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBasic = async () => {
    if (!user) return;

    setSavingBasic(true);
    setBasicError('');
    setBasicSuccess('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setBasicError('请先登录');
        return;
      }

      let decoded;
      try {
        decoded = JSON.parse(atob(token));
      } catch (parseError) {
        console.error('解析 token 失败:', parseError);
        setBasicError('登录状态异常，请重新登录');
        return;
      }

      if (!name.trim()) {
        setBasicError('姓名不能为空');
        return;
      }

      const result = await updateUserBasicInfo(decoded.userId, {
        name: name.trim(),
        avatar_url: avatarUrl?.trim() || undefined,
        student_id: studentId?.trim() || undefined,
      });

      if (result.success && result.user) {
        setBasicSuccess('✅ 个人信息保存成功！');

        let updatedUser: User = result.user;

        setUser(updatedUser);
        setName(updatedUser.name);
        setAvatarUrl(updatedUser.avatar_url || '');
        setStudentId(updatedUser.student_id || '');

        try {
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        } catch (storageError) {
          console.error('更新 localStorage 失败:', storageError);
        }

        try {
          updateUser(updatedUser);
        } catch (authError) {
          console.error('更新全局 Auth 状态失败:', authError);
        }

        setEditingBasic(false);
        setTimeout(() => setBasicSuccess(''), 3000);
      } else {
        setBasicError(result.error || '保存失败');
      }
    } catch (err) {
      setBasicError('保存失败，请重试');
    } finally {
      setSavingBasic(false);
    }
  };

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

        setHeight(result.user.height || '');
        setWeight(result.user.weight || '');
        setAge(result.user.age || '');
        setGender(result.user.gender || '');
        setActivityLevel(result.user.activity_level || '');

        setEditingProfile(false);

        const updatedUser = { ...user, ...result.user } as User;
        const newToken = btoa(JSON.stringify({ userId: updatedUser.id }));
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));

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
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPasswordSuccess('密码修改成功！');
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowChangePassword(false);
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else {
        setPasswordError(result.error || '修改失败');
      }
    } catch (err) {
      setPasswordError('修改失败，请重试');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">请先登录</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">账户设置</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">个人资料</h3>
              {!editingBasic && (
                <button
                  onClick={() => setEditingBasic(true)}
                  className="text-blue-500 hover:text-blue-600 transition-colors text-sm"
                >
                  编辑资料
                </button>
              )}
            </div>

            {basicSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-green-600 text-sm">{basicSuccess}</p>
              </div>
            )}
            {basicError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{basicError}</p>
              </div>
            )}

            <div className="flex items-start gap-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="头像" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-white" />
                  )}
                </div>
                {editingBasic && (
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
                    <Camera className="w-4 h-4 text-gray-600" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                  {editingBasic ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  ) : (
                    <p className="text-gray-900">{user.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">身份</label>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{user.user_type === 'student' ? '学生' : '教职工'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {user.user_type === 'student' ? '学号' : '工号'}
                  </label>
                  {editingBasic ? (
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  ) : (
                    <p className="text-gray-900">{user.student_id}</p>
                  )}
                </div>
              </div>
            </div>

            {editingBasic && (
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleSaveBasic}
                  disabled={savingBasic}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingBasic ? (
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
                    setEditingBasic(false);
                    if (user) {
                      setName(user.name);
                      setAvatarUrl(user.avatar_url || '');
                      setStudentId(user.student_id || '');
                    }
                  }}
                  className="flex items-center gap-2 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>✕</span>
                  <span>取消</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">身体信息</h3>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="text-blue-500 hover:text-blue-600 transition-colors text-sm"
                >
                  修改资料
                </button>
              )}
            </div>
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
                {editingProfile ? (
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : "")}
                    placeholder="例如: 175"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                ) : (
                  <p className="text-gray-900">{height || '未设置'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">体重 (kg)</label>
                {editingProfile ? (
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : "")}
                    placeholder="例如: 70"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                ) : (
                  <p className="text-gray-900">{weight || '未设置'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
                {editingProfile ? (
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                    placeholder="例如: 25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                ) : (
                  <p className="text-gray-900">{age || '未设置'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                {editingProfile ? (
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  >
                    <option value="">请选择</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                ) : (
                  <p className="text-gray-900">
                    {gender === 'male' ? '男' : gender === 'female' ? '女' : '未设置'}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">活动水平</label>
                {editingProfile ? (
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  >
                    <option value="">请选择</option>
                    <option value="sedentary">久坐不动（很少或不锻炼）</option>
                    <option value="light">轻度活动（每周1-3天锻炼）</option>
                    <option value="moderate">中度活动（每周3-5天锻炼）</option>
                    <option value="active">高度活动（每周6-7天锻炼）</option>
                    <option value="very_active">极高活动（专业运动员水平）</option>
                  </select>
                ) : (
                  <p className="text-gray-900">
                    {activityLevel === 'sedentary' ? '久坐不动（很少或不锻炼）' :
                     activityLevel === 'light' ? '轻度活动（每周1-3天锻炼）' :
                     activityLevel === 'moderate' ? '中度活动（每周3-5天锻炼）' :
                     activityLevel === 'active' ? '高度活动（每周6-7天锻炼）' :
                     activityLevel === 'very_active' ? '极高活动（专业运动员水平）' : '未设置'}
                  </p>
                )}
              </div>
            </div>

            {editingProfile && (
              <div className="mt-4 flex gap-3 justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingProfile ? (
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
                    setEditingProfile(false);
                    if (user) {
                      setHeight(user.height || '');
                      setWeight(user.weight || '');
                      setAge(user.age || '');
                      setGender(user.gender || '');
                      setActivityLevel(user.activity_level || '');
                    }
                  }}
                  className="flex items-center gap-2 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>✕</span>
                  <span>取消</span>
                </button>
              </div>
            )}
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
                    {showChangePassword ? '取消' : '修改'}
                  </button>
                </div>

                {showChangePassword && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">当前密码</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="请输入当前密码"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="请输入新密码（至少6位）"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="请再次输入新密码"
                      />
                    </div>

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

                    <button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {changingPassword ? '修改中...' : '确认修改'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
