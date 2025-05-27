"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { BankLogin, BankLoginRequest } from "@/api/authApi";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, captchaKey: string, captchaValue: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;

  // SSE 연결 설정 (GET 방식)
  const setupSSEConnection = () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }

    // 기존 연결이 있다면 해제
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null; // 명시적으로 null 설정
    }

    // 기존 재연결 타이머 취소
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      
      // 토큰을 쿼리 파라미터로 전달
      const sseUrl = `${API_BASE_URL}/api/auth/events?token=${encodeURIComponent(accessToken)}`;
      
      const eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        console.log('EventSource readyState:', eventSource.readyState);
        reconnectAttempts.current = 0; // 성공 시 재연결 카운터 리셋
      };

      // 연결 확인 메시지
      eventSource.addEventListener('connected', (event) => {
      });

      // Keep-alive 메시지 처리
      eventSource.addEventListener('keepalive', (event) => {
      });

      // 모든 메시지 수신 (디버깅용)
      eventSource.onmessage = (event) => {
        console.log('📨 Bank SSE 일반 메시지 수신:', event);
        console.log('   - data:', event.data);
        console.log('   - type:', event.type);
        console.log('   - lastEventId:', event.lastEventId);
      };

      // 중복 로그인 알림 처리
      eventSource.addEventListener('duplicate-login', (event) => {
        console.log('🚨 Bank 중복 로그인 감지:', event.data);
        
    
        alert('다른 기기에서 로그인되어 현재 세션이 종료됩니다.');
        
        // 자동 로그아웃 처리
        handleForceLogout();
      });

      eventSource.onerror = (error) => {
        console.error('❌ Bank SSE 연결 오류:', error);
        console.log('EventSource readyState:', eventSource.readyState);
        console.log('EventSource url:', eventSource.url);
        
        switch(eventSource.readyState) {
          case EventSource.CONNECTING:
            console.log('🔄 Bank SSE 연결 시도 중...');
            break;
          case EventSource.OPEN:
            console.log('✅ Bank SSE 연결이 열려있음');
            break;
          case EventSource.CLOSED:
            console.log('❌ Bank SSE 연결이 닫혔습니다.');
            
            // 자동 재연결 시도 (최대 5회)
            if (reconnectAttempts.current < maxReconnectAttempts) {
              reconnectAttempts.current++;
              const delay = Math.min(1000 * reconnectAttempts.current, 10000); // 최대 10초
              
              console.log(`🔄 ${delay/1000}초 후 Bank SSE 재연결 시도 (${reconnectAttempts.current}/${maxReconnectAttempts})`);
              
              reconnectTimeoutRef.current = setTimeout(() => {
                setupSSEConnection();
              }, delay);
            } else {
              console.log('❌ Bank SSE 최대 재연결 시도 횟수 초과');
            }
            break;
          default:
            console.log('❓ Bank SSE 알 수 없는 상태:', eventSource.readyState);
        }
        
        eventSource.close();
      };

      eventSourceRef.current = eventSource;

    } catch (error) {
      console.error('❌ Bank SSE 연결 설정 실패:', error);
    }
  };

  // 강제 로그아웃 처리
  const handleForceLogout = () => {
    
    // SSE 연결 해제
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // 토큰 제거 및 상태 업데이트
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
    }
    setIsAuthenticated(false);
    

    window.location.href = '/login'; 
  };

  // 인증 상태 변화 추적
  useEffect(() => {
  }, [isAuthenticated, isLoading]);
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const accessToken = getAccessToken();

        if (accessToken) {
          setIsAuthenticated(true);
          
          // 약간의 지연 후 SSE 연결 (DOM이 완전히 로드된 후)
          setTimeout(() => {
            setupSSEConnection();
          }, 100);

          // 토큰 유효성 검증 (선택적)
          try {
            await checkAuth();
          } catch (error) {
            logout();
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // 컴포넌트 마운트 직후 실행
    checkLoginStatus();

    // 컴포넌트 언마운트 시 SSE 연결 해제
    return () => {
      console.log('🧹 Bank AuthProvider 언마운트, SSE 연결 정리 중...');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const login = async (email: string, password: string, captchaKey: string, captchaValue: string) => {
    try {

      // 캡차 필수 검증
      if (!captchaKey || !captchaValue || captchaKey.trim() === '' || captchaValue.trim() === '') {
        console.error('❌ Bank 캡차 정보 누락:', { captchaKey: !!captchaKey, captchaValue: !!captchaValue });
        throw new Error('보안을 위해 캡차 인증이 필요합니다.');
      }

      const loginBody: BankLoginRequest = { 
        email, 
        password, 
        captchaKey: captchaKey.trim(), 
        captchaValue: captchaValue.trim() 
      };
      
      const { accessToken, refreshToken, role } = await BankLogin(loginBody);
      
      if (role === 'BANK') {
        console.log('✅ 은행 로그인 성공');
        
        if (typeof window !== "undefined") {
          sessionStorage.setItem('accessToken', accessToken);
          sessionStorage.setItem('refreshToken', refreshToken);
        }
        
        setIsAuthenticated(true);
        
        // 로그인 성공 후 SSE 연결 설정 (약간의 지연)
        setTimeout(() => {
          console.log('🔄 로그인 후 SSE 연결 시작...');
          setupSSEConnection();
        }, 500); // 0.5초 지연
        
      } else {
        throw new Error('은행 권한이 없습니다.');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '로그인에 실패했습니다.');
    }
  };

  const logout = () => {    
    // SSE 연결 해제
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
    }
    setIsAuthenticated(false);
    
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      const accessToken = getAccessToken();

      if (!accessToken) {
        setIsAuthenticated(false);
        return false;
      }
      
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      setIsAuthenticated(false);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// sessionStorage에서 토큰 가져오기
export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("accessToken");
  }
  return null;
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('Bank AuthContext가 제공되지 않았습니다.');
  }
  return context;
};