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
  reissueToken: () => Promise<boolean>; // 추가
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>; // 추가
  manualReconnectSSE: () => void; // 디버깅용 추가
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;

  // 토큰 재발행 함수
  const reissueToken = async (): Promise<boolean> => {
    try {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        console.log('❌ Bank 리프레시 토큰이 없습니다.');
        logout();
        return false;
      }

      console.log('🔄 Bank 토큰 재발행 요청 중...');

      const response = await fetch(`${API_BASE_URL}/api/auth/reissue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
          userRole: 'BANK' // 백엔드에서 userRole을 요구할 수 있음
        }),
      });

      if (!response.ok) {
        throw new Error(`Bank 토큰 재발행 실패: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Bank 토큰 재발행 성공');
        
        // 새 토큰들 저장
        if (typeof window !== "undefined") {
          sessionStorage.setItem('accessToken', result.data.accessToken);
          sessionStorage.setItem('refreshToken', result.data.refreshToken);
        }
        
        // SSE 연결도 새 토큰으로 재설정
        setTimeout(() => {
          setupSSEConnection();
        }, 100);
        
        return true;
      } else {
        throw new Error(result.message || 'Bank 토큰 재발행 실패');
      }
    } catch (error) {
      console.error('❌ Bank 토큰 재발행 오류:', error);
      
      // 401 오류면 리프레시 토큰도 만료된 것
      if (error instanceof Error && error.message.includes('401')) {
        console.log('🔄 Bank 리프레시 토큰도 만료됨, 로그아웃 처리');
        logout();
      }
      
      return false;
    }
  };

  // API 요청을 위한 fetch 래퍼 함수 (자동 토큰 재발행)
  // AuthContext의 authenticatedFetch 함수 개선 버전

// API 요청을 위한 fetch 래퍼 함수 (무한 루프 방지)
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const accessToken = getAccessToken();
  
  // 재발행 시도 플래그 (무한 루프 방지)
  const isRetryAttempt = options.headers && 
    (options.headers as any)['X-Token-Retry'] === 'true';
  
  // 헤더에 토큰 추가
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  // 원본 fetch를 window에 바인드하여 사용 (중요!)
  const originalFetch = window.fetch.bind(window);

  let response = await originalFetch(url, {
    ...options,
    headers,
  });

  // 401 오류 시 토큰 재발행 시도 (단, 재시도가 아닌 경우에만)
  if (response.status === 401 && !isRetryAttempt) {
    console.log('🔄 Bank 401 오류 발생, 토큰 재발행 시도');
    
    const reissueSuccess = await reissueToken();
    
    if (reissueSuccess) {
      // 재발행 성공 시 원래 요청 재시도
      const newAccessToken = getAccessToken();
      const retryHeaders = {
        ...options.headers,
        'Authorization': `Bearer ${newAccessToken}`,
        'Content-Type': 'application/json',
        'X-Token-Retry': 'true', // 재시도 플래그
      };
      
      console.log('🔄 Bank 토큰 재발행 성공, 요청 재시도');
      response = await originalFetch(url, {
        ...options,
        headers: retryHeaders,
      });
      
      if (response.status === 401) {
        console.log('❌ Bank 재시도 후에도 401 오류, 로그아웃 처리');
        logout();
      } else {
        console.log('✅ Bank 토큰 재발행 후 요청 성공');
      }
    } else {
      console.log('❌ Bank 토큰 재발행 실패');
    }
  } else if (response.status === 401 && isRetryAttempt) {
    console.log('❌ Bank 재시도 후에도 401 오류, 로그아웃');
    logout();
  }

  return response;
};

  // SSE 연결 설정 - 강화된 버전
  const setupSSEConnection = () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.log('🔐 Bank 토큰이 없어서 SSE 연결을 건너뜁니다.');
      return;
    }

    // 기존 연결이 있다면 해제
    if (eventSourceRef.current) {
      console.log('🔄 Bank 기존 SSE 연결을 해제합니다.');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // 기존 재연결 타이머 취소
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      console.log('🔗 Bank SSE 연결 시도 중...', `${API_BASE_URL}/api/auth/events`);
      console.log('🔑 Bank 토큰 (앞 50자):', accessToken.substring(0, 50) + '...');
      
      // 토큰을 쿼리 파라미터로 전달
      const sseUrl = `${API_BASE_URL}/api/auth/events?token=${encodeURIComponent(accessToken)}`;
      console.log('📏 Bank SSE URL:', sseUrl);
      
      let connectionStartTime = Date.now();
      const eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        const connectionTime = Date.now() - connectionStartTime;
        console.log(`✅ Bank SSE 연결이 성공적으로 열렸습니다. (${connectionTime}ms)`);
        console.log('📊 EventSource readyState:', eventSource.readyState);
        reconnectAttempts.current = 0; // 성공 시 재연결 카운터 리셋
      };

      // 연결 확인 메시지
      eventSource.addEventListener('connected', (event) => {
        console.log('✅ Bank SSE 연결 확인:', event.data);
      });

      // Keep-alive 메시지 처리
      eventSource.addEventListener('keepalive', (event) => {
        console.log('💓 Bank Keep-alive:', event.data);
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
        handleForceLogout();
      });

      // 강화된 에러 처리
      eventSource.onerror = (error) => {
        const connectionTime = Date.now() - connectionStartTime;
        console.error('❌ Bank SSE 연결 오류:', error);
        console.log(`⏱️ 연결 시도 시간: ${connectionTime}ms`);
        console.log('📊 EventSource readyState:', eventSource.readyState);
        console.log('🔗 EventSource url:', eventSource.url);
        
        // 빠른 실패는 보통 CORS나 네트워크 문제
        if (connectionTime < 100) {
          console.log('⚠️ Bank 빠른 실패 - CORS 또는 네트워크 문제 가능성');
        }
        
        switch(eventSource.readyState) {
          case EventSource.CONNECTING:
            console.log('🔄 Bank SSE 연결 시도 중...');
            break;
          case EventSource.OPEN:
            console.log('✅ Bank SSE 연결이 열려있음');
            break;
          case EventSource.CLOSED:
            console.log('❌ Bank SSE 연결이 닫혔습니다.');
            
            // SSE 연결 실패 시 토큰 재발행 시도
            checkTokenAndReconnect();
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

  // 토큰 확인 후 재연결 시도
  const checkTokenAndReconnect = async () => {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      console.log('❌ Bank 재연결 시도 중 토큰이 없음');
      return;
    }

    // SSE 연결 실패 시 토큰 재발행 시도
    console.log('🔍 Bank SSE 연결 실패, 토큰 재발행 시도');
    const reissueSuccess = await reissueToken();
    
    if (reissueSuccess) {
      console.log('✅ Bank 토큰 재발행 성공, SSE 재연결');
      // setupSSEConnection은 reissueToken 내부에서 호출됨
    } else {
      // 토큰 재발행 실패 시 일반 재연결 시도
      attemptReconnection();
    }
  };

  // 재연결 시도 로직 (지수적 백오프)
  const attemptReconnection = () => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 30000);
      
      console.log(`🔄 ${delay/1000}초 후 Bank SSE 재연결 시도 (${reconnectAttempts.current}/${maxReconnectAttempts})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        setupSSEConnection();
      }, delay);
    } else {
      console.log('❌ Bank SSE 최대 재연결 시도 횟수 초과');
    }
  };

  // 수동 SSE 재연결 (디버깅용)
  const manualReconnectSSE = () => {
    console.log('🔧 수동 Bank SSE 재연결 시도');
    reconnectAttempts.current = 0;
    setupSSEConnection();
  };

  // 강제 로그아웃 처리
  const handleForceLogout = () => {
    console.log('🔄 Bank 강제 로그아웃 처리 중...');
    
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
    
    console.log('🔄 Bank 로그인 페이지로 리다이렉트...');
    window.location.href = '/login'; 
  };

  // 컴포넌트 마운트 시 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const accessToken = getAccessToken();

        if (accessToken) {
          console.log('💾 Bank 저장된 토큰 발견, 인증 상태 설정 중...');
          setIsAuthenticated(true);
          
          // 약간의 지연 후 SSE 연결
          setTimeout(() => {
            setupSSEConnection();
          }, 100);

          // 토큰 유효성 검증
          try {
            await checkAuth();
          } catch (error) {
            console.error('Bank 토큰 검증 실패, 토큰 재발행 시도:', error);
            const reissueSuccess = await reissueToken();
            if (!reissueSuccess) {
              logout();
            }
          }
        } else {
          console.log('❌ Bank 저장된 토큰이 없습니다.');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Bank 초기 인증 확인 에러:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();

    // 컴포넌트 언마운트 시 정리
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
      console.log('🔐 Bank 로그인 시도 중...');

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
        
        // 로그인 성공 후 SSE 연결 설정
        setTimeout(() => {
          console.log('🔄 로그인 후 Bank SSE 연결 시작...');
          setupSSEConnection();
        }, 500);
        
      } else {
        throw new Error('은행 권한이 없습니다.');
      }
    } catch (error) {
      console.error("❌ Bank 로그인 에러:", error);
      throw new Error(error instanceof Error ? error.message : '로그인에 실패했습니다.');
    }
  };

  const logout = () => {
    console.log('🚪 Bank 로그아웃 처리 중...');
    
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
    
    console.log('✅ Bank 로그아웃 완료');
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
      console.error("Bank 인증 확인 에러:", error);
      setIsAuthenticated(false);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      login, 
      logout, 
      checkAuth,
      reissueToken,        // 추가
      authenticatedFetch,  // 추가
      manualReconnectSSE   // 추가
    }}>
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

// sessionStorage에서 리프레시 토큰 가져오기
export function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("refreshToken");
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