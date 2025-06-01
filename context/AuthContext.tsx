"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { BankLogin, BankLoginRequest } from "@/api/authApi";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, captchaKey: string, captchaValue: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  reissueToken: () => Promise<boolean>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  manualReconnectSSE: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const isReissuingRef = useRef<boolean>(false); // 토큰 재발행 중복 방지

  // 토큰 재발행 함수 - 개선된 버전
  const reissueToken = async (): Promise<boolean> => {
    // 이미 재발행 중이면 중복 실행 방지
    if (isReissuingRef.current) {
      console.log('🔄 Bank 토큰 재발행이 이미 진행 중입니다.');
      return false;
    }

    try {
      isReissuingRef.current = true;
      
      const refreshToken = getRefreshToken();
      const userEmail = getUserEmail(); // 추가: 이메일도 가져오기
      
      if (!refreshToken) {
        console.log('❌ Bank 리프레시 토큰이 없습니다.');
        await handleTokenExpired();
        return false;
      }

      if (!userEmail) {
        console.log('❌ Bank 사용자 이메일이 없습니다.');
        await handleTokenExpired();
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
          userEmail,    // 백엔드에서 요구하는 필수 필드
          userRole: 'BANK' // 백엔드에서 요구하는 필수 필드
        }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        console.log('✅ Bank 토큰 재발행 성공');
        
        // 새 토큰들 저장
        if (typeof window !== "undefined") {
          sessionStorage.setItem('accessToken', result.data.accessToken);
          sessionStorage.setItem('refreshToken', result.data.refreshToken);
          sessionStorage.setItem('userEmail', result.data.userEmail);
        }
        
        // SSE 연결도 새 토큰으로 재설정
        setTimeout(() => {
          setupSSEConnection();
        }, 100);
        
        return true;
      } else {
        // 토큰 재발행 실패 처리
        console.error('❌ Bank 토큰 재발행 실패:', result.message);
        
        // 401, 403 등은 리프레시 토큰 만료로 간주
        if (response.status === 401 || response.status === 403 || 
            result.message?.includes('expired') || 
            result.message?.includes('invalid')) {
          console.log('🔄 Bank 리프레시 토큰 만료, 로그아웃 처리');
          await handleTokenExpired();
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Bank 토큰 재발행 오류:', error);
      
      // 네트워크 오류가 아닌 경우 토큰 만료로 간주
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('🌐 네트워크 오류 발생, 재시도 가능');
      } else {
        console.log('🔄 토큰 관련 오류, 로그아웃 처리');
        await handleTokenExpired();
      }
      
      return false;
    } finally {
      isReissuingRef.current = false;
    }
  };

  // 토큰 만료 처리 함수
  const handleTokenExpired = async () => {
    console.log('🚨 Bank 토큰 만료 처리 시작');
    
    // SSE 연결 해제
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // 모든 토큰 및 사용자 정보 제거
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('userEmail');
    }
    
    setIsAuthenticated(false);
    
    // 사용자에게 알림
    toast.error('세션이 만료되었습니다. 다시 로그인해주세요.', {
      toastId: 'token-expired', // 중복 방지
      autoClose: 3000,
    });
    
    // 로그인 페이지로 리다이렉트
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  // API 요청을 위한 fetch 래퍼 함수 (개선된 버전)
  const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      console.log('❌ Bank 액세스 토큰이 없습니다.');
      await handleTokenExpired();
      throw new Error('인증 토큰이 없습니다.');
    }
    
    // 재발행 시도 플래그 (무한 루프 방지)
    const isRetryAttempt = options.headers && 
      (options.headers as any)['X-Token-Retry'] === 'true';
    
    // 헤더에 토큰 추가
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

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
        if (newAccessToken) {
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
            console.log('❌ Bank 재시도 후에도 401 오류, 토큰 만료 처리');
            await handleTokenExpired();
          } else {
            console.log('✅ Bank 토큰 재발행 후 요청 성공');
          }
        } else {
          console.log('❌ Bank 재발행 후 토큰 없음, 만료 처리');
          await handleTokenExpired();
        }
      }
      // reissueSuccess가 false인 경우 이미 handleTokenExpired가 호출됨
    } else if (response.status === 401 && isRetryAttempt) {
      console.log('❌ Bank 재시도 후에도 401 오류, 토큰 만료 처리');
      await handleTokenExpired();
    }

    return response;
  };

  // SSE 연결 설정 (기존과 동일하지만 에러 처리 강화)
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
      console.log('🔗 Bank SSE 연결 시도 중...');
      
      const sseUrl = `${API_BASE_URL}/api/auth/events?token=${encodeURIComponent(accessToken)}`;
      let connectionStartTime = Date.now();
      const eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        const connectionTime = Date.now() - connectionStartTime;
        console.log(`✅ Bank SSE 연결 성공 (${connectionTime}ms)`);
        reconnectAttempts.current = 0;
      };

      eventSource.addEventListener('connected', (event) => {
        console.log('✅ Bank SSE 연결 확인:', event.data);
      });

      eventSource.addEventListener('keepalive', (event) => {
        console.log('💓 Bank Keep-alive:', event.data);
      });

      // 중복 로그인 및 토큰 관련 이벤트 처리
      eventSource.addEventListener('duplicate-login', (event) => {
        console.log('🚨 Bank 중복 로그인 감지:', event.data);
        toast.error('다른 기기에서 로그인되어 현재 세션이 종료됩니다.');
        handleForceLogout();
      });

      eventSource.addEventListener('TOKEN_EXPIRED', (event) => {
        console.log('🚨 Bank 토큰 만료 이벤트 수신:', event.data);
        handleTokenExpired();
      });

      eventSource.addEventListener('TOKEN_EXPIRING_SOON', (event) => {
        console.log('⚠️ Bank 토큰 만료 임박:', event.data);
        toast.warning('세션이 곧 만료됩니다. 작업을 저장해주세요.');
      });

      eventSource.onerror = (error) => {
        const connectionTime = Date.now() - connectionStartTime;
        console.error('❌ Bank SSE 연결 오류:', error);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('❌ Bank SSE 연결이 닫혔습니다.');
          checkTokenAndReconnect();
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
      await handleTokenExpired();
      return;
    }

    console.log('🔍 Bank SSE 연결 실패, 토큰 재발행 시도');
    const reissueSuccess = await reissueToken();
    
    if (!reissueSuccess) {
      // 토큰 재발행 실패 시 일반 재연결 시도
      attemptReconnection();
    }
    // reissueSuccess가 true면 reissueToken 내부에서 setupSSEConnection 호출됨
  };

  // 재연결 시도 로직
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

  // 수동 SSE 재연결
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
      sessionStorage.removeItem('userEmail');
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
              await handleTokenExpired();
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

      if (!captchaKey || !captchaValue || captchaKey.trim() === '' || captchaValue.trim() === '') {
        console.error('❌ Bank 캡차 정보 누락');
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
          sessionStorage.setItem('userEmail', email); // 이메일도 저장
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
      sessionStorage.removeItem('userEmail');
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
      reissueToken,
      authenticatedFetch,
      manualReconnectSSE
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

// sessionStorage에서 사용자 이메일 가져오기
export function getUserEmail(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("userEmail");
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