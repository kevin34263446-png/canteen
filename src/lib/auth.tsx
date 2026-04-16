"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, login as loginApi, register as registerApi, getUserById } from "./supabase";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, userType: string) => Promise<{ error: string | null }>;
  register: (email: string, password: string, name: string, userType: string, studentId: string) => Promise<{ error: string | null }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("auth_user", JSON.stringify(response.user));
      setUser(response.user);
      setToken(response.token);
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
          setUser(userData);
          localStorage.setItem("auth_user", JSON.stringify(userData));
        }
      } catch (error) {
        console.error("刷新用户信息失败:", error);
      }
    }
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
