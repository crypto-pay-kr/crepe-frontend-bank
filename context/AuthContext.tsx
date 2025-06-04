"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
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
  const tokenExpiryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const isReissuingRef = useRef<boolean>(false);
  const isLoggingOutRef = useRef<boolean>(false);
  const lastReissueAttemptRef = useRef<number>(0);
  const forceLogoutInProgressRef = useRef<boolean>(false);

  // 토큰 만료 시간 추출 - 디버깅 강화
  const getTokenExpirationTime = useCallback((token: string): number => {
    try {
      if (!token || typeof token !== 'string') {
        console.error('❌ 유효하지 않은 토큰:', token ? 'empty' : 'null');
        return 0;
      }
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('❌ JWT 토큰 형식이 올바르지 않음. Parts:', parts.length);
        return 0;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      console.log('🔍 토큰 페이로드:', {
        exp: payload.exp,
        iat: payload.iat,
        email: payload.email,
        role: payload.role
      });
      
      if (!payload.exp || typeof payload.exp !== 'number') {
        console.error('❌ 토큰에 유효한 만료 시간이 없음:', payload.exp);
        return 0;
      }
      
      const expTime = payload.exp * 1000;
      const now = Date.now();
      const timeLeft = Math.floor((expTime - now) / 1000);
      
      console.log(`🕐 토큰 만료 정보:`, {
        만료시간: new Date(expTime).toLocaleString('ko-KR'),
        현재시간: new Date(now).toLocaleString('ko-KR'),
        남은시간: `${timeLeft}초`,
        만료여부: timeLeft <= 0 ? '만료됨' : '유효함'
      });
      
      return expTime;
    } catch (error) {
      console.error('❌ 토큰 파싱 오류:', error);
      return 0;
    }
  }, []);

  // 즉시 강제 로그아웃 함수
  const forceLogout = useCallback(() => {
    if (forceLogoutInProgressRef.current) {
      console.log('🔄 강제 로그아웃이 이미 진행 중입니다.');
      return;
    }

    console.log('🚨 강제 로그아웃 시작');
    forceLogoutInProgressRef.current = true;
    isLoggingOutRef.current = true;

    // 모든 타이머 정리
    [tokenExpiryTimeoutRef, reconnectTimeoutRef].forEach(timeoutRef => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    });

    // SSE 연결 해제
    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
        console.log('✅ SSE 연결 해제 완료');
      } catch (error) {
        console.error('❌ SSE 연결 해제 오류:', error);
      }
      eventSourceRef.current = null;
    }

    // 토큰 및 사용자 정보 제거
    try {
      if (typeof window !== 'undefined') {
        const tokensToRemove = ['accessToken', 'refreshToken', 'userEmail'];
        tokensToRemove.forEach(key => {
          const oldValue = sessionStorage.getItem(key);
          sessionStorage.removeItem(key);
          console.log(`🧹 ${key} 제거:`, oldValue ? '있었음' : '없었음');
        });
        console.log('✅ 세션 스토리지 정리 완료');
      }
    } catch (error) {
      console.error('❌ 세션 스토리지 정리 오류:', error);
    }

    // 인증 상태 변경
    setIsAuthenticated(false);
    
    // 사용자 알림
    toast.error('세션이 만료되었습니다. 다시 로그인해주세요.', {
      toastId: 'force-logout',
      autoClose: 3000,
    });

    console.log('✅ 강제 로그아웃 처리 완료');

    // 페이지 리다이렉트
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        console.log('🔄 로그인 페이지로 리다이렉트');
        window.location.href = '/login';
      }
      setTimeout(() => {
        forceLogoutInProgressRef.current = false;
        isLoggingOutRef.current = false;
      }, 1000);
    }, 100);
  }, []);

  // 토큰 유효성 즉시 검사
  const isTokenValid = useCallback((token: string): boolean => {
    if (!token) {
      console.log('❌ 토큰이 없음');
      return false;
    }

    const expirationTime = getTokenExpirationTime(token);
    if (expirationTime === 0) {
      console.log('❌ 토큰 만료 시간 확인 불가');
      return false;
    }

    const currentTime = Date.now();
    const isValid = expirationTime > currentTime;
    
    console.log(`🔍 토큰 유효성 검사:`, {
      토큰: token.substring(0, 20) + '...',
      유효함: isValid,
      남은시간: Math.floor((expirationTime - currentTime) / 1000) + '초'
    });

    return isValid;
  }, [getTokenExpirationTime]);

  // 토큰 재발급 함수 - 완전히 재작성
  const reissueToken = useCallback(async (): Promise<boolean> => {
    console.log('🔄 토큰 재발급 시작');

    // 중복 실행 방지
    if (isReissuingRef.current) {
      console.log('⚠️ 이미 토큰 재발급 중입니다.');
      return false;
    }

    if (isLoggingOutRef.current || forceLogoutInProgressRef.current) {
      console.log('⚠️ 로그아웃 중이므로 재발급을 건너뜁니다.');
      return false;
    }

    // 재발행 간격 제한 (5초)
    const now = Date.now();
    const timeSinceLastAttempt = now - lastReissueAttemptRef.current;
    if (timeSinceLastAttempt < 5000) {
      console.log(`⚠️ 재발급 시도 간격이 너무 짧습니다. (${timeSinceLastAttempt}ms)`);
      return false;
    }

    try {
      isReissuingRef.current = true;
      lastReissueAttemptRef.current = now;
      
      // 현재 토큰들 확인
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      const userEmail = getUserEmail();
      
      console.log('🔍 현재 토큰 상태:', {
        accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : '없음',
        refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : '없음',
        userEmail: userEmail || '없음'
      });

      // 필수 정보 검증
      if (!refreshToken || !userEmail) {
        console.log('❌ 필수 정보 누락');
        await forceLogout();
        return false;
      }

      // Refresh Token 유효성 검사
      if (!isTokenValid(refreshToken)) {
        console.log('❌ Refresh Token이 만료됨');
        await forceLogout();
        return false;
      }

      console.log('📡 토큰 재발급 API 호출');
      
      // 토큰 재발급 요청
      const response = await fetch(`${API_BASE_URL}/api/auth/reissue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
          userEmail,
          userRole: 'BANK'
        }),
      });

      console.log(`📡 재발급 응답:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 토큰 재발급 HTTP 오류:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        // 401, 403 등 인증 오류는 즉시 로그아웃
        if (response.status === 401 || response.status === 403) {
          console.log('❌ 인증 오류로 인한 강제 로그아웃');
          await forceLogout();
        }
        return false;
      }

      const result = await response.json();
      console.log('📡 재발급 응답 데이터:', result);

      if (result.success && result.data) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, userEmail: newUserEmail } = result.data;
        
        if (!newAccessToken || !newRefreshToken || !newUserEmail) {
          console.error('❌ 응답에 필수 토큰 정보가 없음:', result.data);
          await forceLogout();
          return false;
        }

        // 새 토큰 유효성 검사
        if (!isTokenValid(newAccessToken)) {
          console.error('❌ 새로 발급받은 Access Token이 유효하지 않음');
          await forceLogout();
          return false;
        }

        // 새 토큰들 저장
        try {
          if (typeof window !== "undefined") {
            sessionStorage.setItem('accessToken', newAccessToken);
            sessionStorage.setItem('refreshToken', newRefreshToken);
            sessionStorage.setItem('userEmail', newUserEmail);
            
            console.log('✅ 새 토큰 저장 완료:', {
              accessToken: `${newAccessToken.substring(0, 20)}...`,
              refreshToken: `${newRefreshToken.substring(0, 20)}...`,
              userEmail: newUserEmail
            });
            
            // 새로운 토큰으로 만료 시간 체크 스케줄링
            setTimeout(() => {
              scheduleTokenExpiryCheck();
            }, 1000);
            
            return true;
          }
        } catch (storageError) {
          console.error('❌ 토큰 저장 오류:', storageError);
          await forceLogout();
          return false;
        }
      } else {
        console.error('❌ 토큰 재발급 실패:', result);
        
        // 특정 오류 키워드 검사
        const errorMessage = result.message?.toLowerCase() || '';
        const forceLogoutKeywords = ['expired', 'invalid', 'mismatch', 'unauthorized', 'forbidden'];
        
        if (forceLogoutKeywords.some(keyword => errorMessage.includes(keyword))) {
          console.log('❌ 강제 로그아웃이 필요한 오류 감지');
          await forceLogout();
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ 토큰 재발급 예외:', error);
      
      // 네트워크 오류 vs 기타 오류 구분
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('🌐 네트워크 오류 - 재시도 가능');
        return false;
      } else {
        console.log('❌ 치명적 오류 - 강제 로그아웃');
        await forceLogout();
        return false;
      }
    } finally {
      isReissuingRef.current = false;
    }
    // Ensure a boolean is always returned
    return false;
  }, [isTokenValid, forceLogout]);

  // 토큰 만료 체크 스케줄링 - 더 적극적으로
  const scheduleTokenExpiryCheck = useCallback(() => {
    console.log('📅 토큰 만료 체크 스케줄링 시작');

    if (isLoggingOutRef.current || forceLogoutInProgressRef.current) {
      console.log('🔄 로그아웃 중이므로 스케줄링을 건너뜁니다.');
      return;
    }

    // 기존 타이머 정리
    if (tokenExpiryTimeoutRef.current) {
      clearTimeout(tokenExpiryTimeoutRef.current);
      tokenExpiryTimeoutRef.current = null;
      console.log('🧹 기존 만료 체크 타이머 정리');
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      console.log('❌ 액세스 토큰이 없어서 만료 체크를 건너뜁니다.');
      return;
    }

    // 토큰 유효성 즉시 검사
    if (!isTokenValid(accessToken)) {
      console.log('❌ 현재 토큰이 이미 만료됨, 즉시 재발급 시도');
      setTimeout(() => {
        if (!isReissuingRef.current && !isLoggingOutRef.current) {
          reissueToken();
        }
      }, 100);
      return;
    }

    const expirationTime = getTokenExpirationTime(accessToken);
    const currentTime = Date.now();
    const timeUntilExpiry = Math.max(0, (expirationTime - currentTime) / 1000);

    // 만료 90초 전에 재발행 시도 (더 일찍)
    const reissueThreshold = 90;
    const timeUntilReissue = Math.max(0, timeUntilExpiry - reissueThreshold);
    
    console.log(`📅 토큰 스케줄링:`, {
      만료까지: `${Math.round(timeUntilExpiry)}초`,
      재발급까지: `${Math.round(timeUntilReissue)}초`,
      임계값: `${reissueThreshold}초`
    });

    if (timeUntilReissue <= 0) {
      // 즉시 재발행 시도
      console.log('⚠️ 토큰 만료 임박, 즉시 재발행 시도');
      setTimeout(() => {
        if (!isLoggingOutRef.current && !isReissuingRef.current && !forceLogoutInProgressRef.current) {
          reissueToken();
        }
      }, 100);
    } else {
      // 지정된 시간 후 재발행 시도
      console.log(`⏰ ${Math.round(timeUntilReissue)}초 후 토큰 재발급 예정`);
      tokenExpiryTimeoutRef.current = setTimeout(() => {
        if (!isLoggingOutRef.current && !isReissuingRef.current && !forceLogoutInProgressRef.current) {
          console.log('⚠️ 스케줄된 토큰 재발급 실행');
          reissueToken();
        }
      }, timeUntilReissue * 1000);
    }
  }, [isTokenValid, getTokenExpirationTime, reissueToken]);

  // API 요청 시 토큰 검증 강화
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    console.log(`🌐 API 요청 시작: ${url}`);

    if (isLoggingOutRef.current || forceLogoutInProgressRef.current) {
      console.log('❌ 로그아웃 중이므로 API 요청 차단');
      throw new Error('로그아웃 처리 중입니다.');
    }

    const accessToken = getAccessToken();
    
    if (!accessToken) {
      console.log('❌ 액세스 토큰이 없습니다.');
      await forceLogout();
      throw new Error('인증 토큰이 없습니다.');
    }

    // 요청 전 토큰 유효성 검사
    if (!isTokenValid(accessToken)) {
      console.log('❌ 요청 전 토큰 만료 감지, 재발급 시도');
      
      const reissueSuccess = await reissueToken();
      if (!reissueSuccess) {
        console.log('❌ 토큰 재발급 실패');
        await forceLogout();
        throw new Error('토큰 재발급에 실패했습니다.');
      }
      
      // 재발급 후 새 토큰으로 요청
      const newAccessToken = getAccessToken();
      if (!newAccessToken || !isTokenValid(newAccessToken)) {
        console.log('❌ 재발급 후에도 유효한 토큰이 없음');
        await forceLogout();
        throw new Error('유효한 토큰을 얻을 수 없습니다.');
      }
    }
    
    const currentAccessToken = getAccessToken();
    const isRetryAttempt = options.headers && 
      (options.headers as any)['X-Token-Retry'] === 'true';
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${currentAccessToken}`,
      'Content-Type': 'application/json',
    };

    console.log(`🌐 실제 API 호출: ${url}`, {
      토큰: currentAccessToken?.substring(0, 20) + '...',
      재시도: isRetryAttempt
    });

    let response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`🌐 API 응답:`, {
      url,
      status: response.status,
      ok: response.ok,
      재시도: isRetryAttempt
    });

    // 401 오류 시 토큰 재발행 시도 (첫 번째 시도만)
    if (response.status === 401 && !isRetryAttempt && 
        !isLoggingOutRef.current && !forceLogoutInProgressRef.current) {
      console.log('🔄 401 오류 발생, 토큰 재발급 후 재시도');
      
      const reissueSuccess = await reissueToken();
      
      if (reissueSuccess && !isLoggingOutRef.current && !forceLogoutInProgressRef.current) {
        const newAccessToken = getAccessToken();
        if (newAccessToken && isTokenValid(newAccessToken)) {
          const retryHeaders = {
            ...options.headers,
            'Authorization': `Bearer ${newAccessToken}`,
            'Content-Type': 'application/json',
            'X-Token-Retry': 'true',
          };
          
          console.log('🔄 새 토큰으로 재시도');
          response = await fetch(url, {
            ...options,
            headers: retryHeaders,
          });
          
          console.log(`🔄 재시도 응답:`, {
            status: response.status,
            ok: response.ok
          });
          
          if (response.status === 401) {
            console.log('❌ 재시도 후에도 401 오류 - 강제 로그아웃');
            await forceLogout();
          }
        } else {
          console.log('❌ 재발급 후 유효한 토큰 없음 - 강제 로그아웃');
          await forceLogout();
        }
      }
    } else if (response.status === 401 && isRetryAttempt) {
      console.log('❌ 재시도 후에도 401 오류 - 강제 로그아웃');
      await forceLogout();
    }

    return response;
  }, [isTokenValid, reissueToken, forceLogout]);

  // SSE 연결 설정 (토큰 유효성 검사 추가)
  const setupSSEConnection = useCallback(() => {
    console.log('🔗 SSE 연결 설정 시작');
    
    if (isLoggingOutRef.current || forceLogoutInProgressRef.current) {
      console.log('🔄 로그아웃 중이므로 SSE 연결을 건너뜁니다.');
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      console.log('🔐 토큰이 없어서 SSE 연결을 건너뜁니다.');
      return;
    }

    // SSE 연결 전 토큰 유효성 검사
    if (!isTokenValid(accessToken)) {
      console.log('🔐 만료된 토큰으로 SSE 연결 불가, 재발급 시도');
      reissueToken().then(success => {
        if (success) {
          setTimeout(() => setupSSEConnection(), 1000);
        }
      });
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      console.log('🔗 SSE 연결 시도 중...');
      
      const sseUrl = `${API_BASE_URL}/api/auth/events?token=${encodeURIComponent(accessToken)}`;
      const eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        console.log('✅ SSE 연결 성공');
        reconnectAttempts.current = 0;
      };

      eventSource.addEventListener('connected', (event) => {
        console.log('✅ SSE 연결 확인:', event.data);
      });

      eventSource.addEventListener('duplicate-login', (event) => {
        console.log('🚨 중복 로그인 감지:', event.data);
        toast.error('다른 기기에서 로그인되어 현재 세션이 종료됩니다.');
        forceLogout();
      });

      eventSource.addEventListener('TOKEN_EXPIRED', (event) => {
        console.log('🚨 서버에서 토큰 만료 알림:', event.data);
        forceLogout();
      });

      eventSource.addEventListener('TOKEN_EXPIRING_SOON', (event) => {
        console.log('⚠️ 서버에서 토큰 만료 임박 알림:', event.data);
        if (!isReissuingRef.current) {
          reissueToken();
        }
      });

      eventSource.onerror = (error) => {
        console.error('❌ SSE 연결 오류:', error);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('❌ SSE 연결이 닫혔습니다.');
          if (!isLoggingOutRef.current && !forceLogoutInProgressRef.current) {
            attemptReconnection();
          }
        }
        
        eventSource.close();
      };

      eventSourceRef.current = eventSource;

    } catch (error) {
      console.error('❌ SSE 연결 설정 실패:', error);
    }
  }, [isTokenValid, reissueToken, forceLogout]);

  // 재연결 시도
  const attemptReconnection = useCallback(() => {
    if (isLoggingOutRef.current || forceLogoutInProgressRef.current) {
      return;
    }

    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 30000);
      
      console.log(`🔄 ${delay/1000}초 후 SSE 재연결 시도 (${reconnectAttempts.current}/${maxReconnectAttempts})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isLoggingOutRef.current && !forceLogoutInProgressRef.current) {
          setupSSEConnection();
        }
      }, delay);
    } else {
      console.log('❌ SSE 최대 재연결 시도 횟수 초과');
    }
  }, [setupSSEConnection]);

  const manualReconnectSSE = useCallback(() => {
    if (isLoggingOutRef.current || forceLogoutInProgressRef.current) {
      return;
    }
    
    console.log('🔧 수동 SSE 재연결 시도');
    reconnectAttempts.current = 0;
    setupSSEConnection();
  }, [setupSSEConnection]);

  // 초기화 - 토큰 검증 강화
  useEffect(() => {
    const checkLoginStatus = async () => {
      console.log('🔍 초기 로그인 상태 확인 시작');
      
      try {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();
        
        console.log('💾 저장된 토큰 확인:', {
          accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : '없음',
          refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : '없음'
        });

        if (accessToken) {
          // 토큰 유효성 검사
          if (isTokenValid(accessToken)) {
            console.log('✅ 저장된 Access Token이 유효함');
            setIsAuthenticated(true);
            scheduleTokenExpiryCheck();
            setTimeout(() => setupSSEConnection(), 100);
          } else {
            console.log('⚠️ 저장된 Access Token이 만료됨, Refresh Token으로 재발급 시도');
            
            if (refreshToken && isTokenValid(refreshToken)) {
              const reissueSuccess = await reissueToken();
              if (reissueSuccess) {
                console.log('✅ 토큰 재발급 성공');
                setIsAuthenticated(true);
                scheduleTokenExpiryCheck();
                setTimeout(() => setupSSEConnection(), 100);
              } else {
                console.log('❌ 토큰 재발급 실패');
                forceLogout();
              }
            } else {
              console.log('❌ Refresh Token도 만료됨');
              forceLogout();
            }
          }
        } else {
          console.log('❌ 저장된 토큰이 없습니다.');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("초기 인증 확인 에러:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();

    return () => {
      console.log('🧹 AuthProvider 언마운트, 리소스 정리 중...');
      
      [eventSourceRef, reconnectTimeoutRef, tokenExpiryTimeoutRef].forEach(ref => {
        if (ref.current) {
          if ('close' in ref.current) {
            ref.current.close();
          } else {
            clearTimeout(ref.current);
          }
          ref.current = null;
        }
      });
    };
  }, [isTokenValid, reissueToken, scheduleTokenExpiryCheck, setupSSEConnection, forceLogout]);

  // 주기적 토큰 체크 (30초마다)
  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      return;
    }

    const tokenCheckInterval = setInterval(() => {
      console.log('🔄 주기적 토큰 유효성 검사');
      
      const accessToken = getAccessToken();
      if (!accessToken) {
        console.log('❌ 주기적 검사: 토큰이 없음');
        forceLogout();
        return;
      }

      if (!isTokenValid(accessToken)) {
        console.log('❌ 주기적 검사: 토큰이 만료됨');
        if (!isReissuingRef.current) {
          reissueToken();
        }
      } else {
        console.log('✅ 주기적 검사: 토큰 유효함');
      }
    }, 30000); // 30초마다

    return () => {
      clearInterval(tokenCheckInterval);
    };
  }, [isAuthenticated, isLoading, isTokenValid, reissueToken, forceLogout]);

  const login = async (email: string, password: string, captchaKey: string, captchaValue: string) => {
    try {
      console.log('🔐 로그인 시도 중...');

      if (!captchaKey || !captchaValue || captchaKey.trim() === '' || captchaValue.trim() === '') {
        throw new Error('보안을 위해 캡차 인증이 필요합니다.');
      }

      const loginBody: BankLoginRequest = { 
        email, 
        password, 
        captchaKey: captchaKey.trim(), 
        captchaValue: captchaValue.trim() 
      };
      
      const { accessToken, refreshToken, role } = await BankLogin(loginBody);
      
      console.log('🔐 로그인 응답 받음:', {
        accessTokenLength: accessToken?.length,
        refreshTokenLength: refreshToken?.length,
        role
      });
      
      if (role === 'BANK' || role === 'ADMIN') {
        // 받은 토큰들의 유효성 검사
        if (!isTokenValid(accessToken)) {
          throw new Error('서버에서 받은 Access Token이 유효하지 않습니다.');
        }
        
        if (!isTokenValid(refreshToken)) {
          throw new Error('서버에서 받은 Refresh Token이 유효하지 않습니다.');
        }
        
        console.log('✅ 로그인 성공, 토큰 유효성 확인됨:', role);
        
        // 플래그 리셋
        isLoggingOutRef.current = false;
        forceLogoutInProgressRef.current = false;
        
        if (typeof window !== "undefined") {
          sessionStorage.setItem('accessToken', accessToken);
          sessionStorage.setItem('refreshToken', refreshToken);
          sessionStorage.setItem('userEmail', email);
          
          console.log('💾 토큰 저장 완료');
        }
        
        setIsAuthenticated(true);
        
        // 토큰 만료 체크 스케줄링
        setTimeout(() => {
          scheduleTokenExpiryCheck();
        }, 1000);
        
        // SSE 연결 설정
        setTimeout(() => {
          console.log('🔄 로그인 후 SSE 연결 시작...');
          setupSSEConnection();
        }, 1500);
        
      } else {
        throw new Error('권한이 없습니다.');
      }
    } catch (error) {
      console.error("❌ 로그인 에러:", error);
      throw new Error(error instanceof Error ? error.message : '로그인에 실패했습니다.');
    }
  };

  const logout = useCallback(() => {
    console.log('🚪 일반 로그아웃 처리 중...');
    forceLogout();
  }, [forceLogout]);

  const checkAuth = async (): Promise<boolean> => {
    try {
      console.log('🔍 인증 상태 확인');
      
      const accessToken = getAccessToken();

      if (!accessToken) {
        console.log('❌ checkAuth: 토큰이 없음');
        setIsAuthenticated(false);
        return false;
      }

      if (!isTokenValid(accessToken)) {
        console.log('❌ checkAuth: 토큰이 만료됨, 재발급 시도');
        
        const reissueSuccess = await reissueToken();
        if (!reissueSuccess) {
          console.log('❌ checkAuth: 토큰 재발급 실패');
          await forceLogout();
          return false;
        }
        
        console.log('✅ checkAuth: 토큰 재발급 성공');
      }
      
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("❌ 인증 확인 에러:", error);
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

// sessionStorage 헬퍼 함수들 - 디버깅 강화
export function getAccessToken(): string | null {
  try {
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("accessToken");
      if (token) {
        console.log('📱 Access Token 조회:', `${token.substring(0, 20)}...`);
      }
      return token;
    }
  } catch (error) {
    console.error('❌ Access Token 조회 오류:', error);
  }
  return null;
}

export function getRefreshToken(): string | null {
  try {
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("refreshToken");
      if (token) {
        console.log('📱 Refresh Token 조회:', `${token.substring(0, 20)}...`);
      }
      return token;
    }
  } catch (error) {
    console.error('❌ Refresh Token 조회 오류:', error);
  }
  return null;
}

export function getUserEmail(): string | null {
  try {
    if (typeof window !== "undefined") {
      const email = sessionStorage.getItem("userEmail");
      if (email) {
        console.log('📱 User Email 조회:', email);
      }
      return email;
    }
  } catch (error) {
    console.error('❌ User Email 조회 오류:', error);
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