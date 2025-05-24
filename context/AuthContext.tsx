"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { BankLogin, BankLoginRequest } from "@/api/authApi";

interface AuthContextValue {
  isAuthenticated: boolean;
  // captchaKey와 captchaValue를 인자로 받도록 수정
  login: (email: string, password: string, captchaKey: string, captchaValue: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  const login = async (email: string, password: string, captchaKey: string, captchaValue: string) => {
    try {
      const loginBody: BankLoginRequest = { email, password, captchaKey, captchaValue };
      const { accessToken, refreshToken, role } = await BankLogin(loginBody);
      
      if (role === 'BANK') {
        if (typeof window !== "undefined") {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          console.log("accessToken 저장 완료:", accessToken);
        }
        setAccessToken(accessToken);
        setIsAuthenticated(true);
      } else {
        throw new Error('은행 권한이 없습니다.');
      }
    } catch (error) {
      console.error("로그인 에러:", error);
      throw new Error('로그인에 실패했습니다.');
    }
  };

  const logout = () => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
  };

  const checkAuth = async () => {
    return !!accessToken;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('AuthContext가 제공되지 않았습니다.');
  }
  return context;
};