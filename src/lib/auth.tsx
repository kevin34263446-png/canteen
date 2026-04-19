"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, login as loginApi, register as registerApi, getUserById } from "./supabase";
import { readUserFromDatabaseDirectly } from "./db-verify";
import { getUserViaAPI } from "./api-update";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, userType: string) => Promise<{ error: string | null }>;
  register: (email: string, password: string, name: string, userType: string, studentId: string) => Promise<{ error: string | null }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 监听用户状态变化
  useEffect(() => {
    console.log('AuthProvider user state changed:', user);
  }, [user]);

  // 初始化时检查本地存储的认证信息
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        // 清除无效的存储数据
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, userType: string) => {
    const response = await loginApi(email, password, userType);
    
    if (response.error) {
      return { error: response.error };
    }

    if (response.user && response.token) {
      // 登录成功后，优先使用 API Route 获取最新用户信息（使用 Service Role）
      try {
        const decoded = JSON.parse(atob(response.token));
        console.log('🔐 登录成功，正在获取最新用户信息...');
        console.log('📝 用户ID:', decoded.userId);
        
        let finalUser = null;
        
        // 方法1: 优先使用 API Route (Service Role，最可靠)
        try {
          console.log('🌐 尝试通过 API Route 获取...');
          const apiResult = await getUserViaAPI(decoded.userId);
          
          if (apiResult.success && apiResult.user) {
            console.log('✅ API Route 成功获取用户数据:', apiResult.user);
            finalUser = apiResult.user;
          } else {
            console.warn('⚠️ API Route 失败:', apiResult.error);
          }
        } catch (apiError) {
          console.error('❌ API Route 异常:', apiError);
        }
        
        // 方法2: 回退到直接数据库读取
        if (!finalUser) {
          console.log('🔄 回退到直接数据库读取...');
          const dbResult = await readUserFromDatabaseDirectly(decoded.userId);
          
          if (dbResult.success && dbResult.user) {
            console.log('✅ 直接数据库读取成功:', dbResult.user);
            finalUser = dbResult.user;
          }
        }
        
        // 方法3: 最后的 fallback - getUserById
        if (!finalUser) {
          console.log('🔄 最后尝试 getUserById...');
          finalUser = await getUserById(decoded.userId);
          if (finalUser) {
            console.log('✅ getUserById 成功:', finalUser);
          }
        }
        
        // 方法4: 使用原始 login 响应
        if (!finalUser) {
          console.log('⚠️ 所有方法失败，使用 login 响应数据');
          finalUser = response.user;
        }

        // 设置最终的 user 状态
        console.log('🎯 最终使用的用户数据:', finalUser);
        localStorage.setItem("auth_token", response.token);
        localStorage.setItem("auth_user", JSON.stringify(finalUser));
        setUser(finalUser);
        setToken(response.token);
      } catch (error) {
        console.error('❌ 登录后获取用户信息失败:', error);
        // 如果出错，使用 login API 返回的数据
        localStorage.setItem("auth_token", response.token);
        localStorage.setItem("auth_user", JSON.stringify(response.user));
        setUser(response.user);
        setToken(response.token);
      }
    }

    return { error: null };
  };

  const register = async (email: string, password: string, name: string, userType: string, studentId: string) => {
    const response = await registerApi(email, password, name, userType, studentId);
    
    if (response.error) {
      return { error: response.error };
    }

    if (response.user && response.token) {
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("auth_user", JSON.stringify(response.user));
      setUser(response.user);
      setToken(response.token);
    }

    return { error: null };
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      try {
        const decoded = JSON.parse(atob(storedToken));
        const userData = await getUserById(decoded.userId);
        
        if (userData) {
          // 直接使用从数据库获取的用户数据
          // 不再做额外的判断，因为 getUserById 已经处理了 mock 数据的情况
          console.log('refreshUser 获取到用户数据:', userData);
          setUser(userData);
          localStorage.setItem("auth_user", JSON.stringify(userData));
        }
      } catch (error) {
        console.error("刷新用户信息失败:", error);
      }
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("auth_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}