"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import { useAuthContext } from "@/context/AuthContext";

// 공개 라우트 목록 (인증이 필요하지 않은 페이지)
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password"];

// 인증 검사 제외 라우트 패턴
const EXCLUDED_ROUTE_PATTERNS = [
  /^\/api\//, // API 라우트
  /^\/public\//, // 공개 파일
  /^\/assets\//, // 정적 자산
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, authenticatedFetch, reissueToken, logout, checkAuth } = useAuthContext();
  const [isInitialized, setIsInitialized] = useState(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckRef = useRef<boolean>(false);
  const forceRedirectRef = useRef<boolean>(false);

  // 공개 라우트 확인 함수
  const isPublicRoute = useCallback((path: string): boolean => {
    // 정확한 경로 매칭
    if (PUBLIC_ROUTES.includes(path)) {
      return true;
    }
    
    // 패턴 매칭
    return EXCLUDED_ROUTE_PATTERNS.some(pattern => pattern.test(path));
  }, []);

  // 강제 로그인 페이지 리다이렉트
  const forceRedirectToLogin = useCallback(() => {
    if (forceRedirectRef.current) {
      console.log('🔄 이미 리다이렉트 중입니다.');
      return;
    }

    forceRedirectRef.current = true;
    console.log('🔄 강제 로그인 페이지 리다이렉트');

    // 기존 타이머 정리
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    // 즉시 리다이렉트
    if (pathname !== '/login') {
      router.replace('/login');
    }

    // 플래그 리셋
    setTimeout(() => {
      forceRedirectRef.current = false;
    }, 2000);
  }, [router, pathname]);

  // 인증된 사용자의 추가 검증 (개선된 버전)
  const performAdditionalAuthCheck = useCallback(async () => {
    if (authCheckRef.current || forceRedirectRef.current) {
      return; // 이미 체크 중이거나 리다이렉트 중이면 중복 실행 방지
    }

    try {
      authCheckRef.current = true;
      console.log('🔍 Bank 추가 인증 검증 시작...');
      
      const isValid = await checkAuth();
      
      if (!isValid) {
        console.log('❌ Bank 추가 인증 검증 실패');
        toast.error("세션이 유효하지 않습니다. 다시 로그인해주세요.", {
          toastId: 'auth-guard-invalid'
        });
        
        forceRedirectToLogin();
        return;
      } 

      console.log('✅ Bank 추가 인증 검증 성공');
    } catch (error) {
      console.error('❌ Bank 추가 인증 검증 중 오류:', error);
      
      // 토큰 관련 에러인 경우 즉시 로그인 페이지로
      if (error instanceof Error && 
          (error.message.includes('토큰') || error.message.includes('만료') || error.message.includes('인증'))) {
        console.log('🚨 토큰 관련 오류 감지, 즉시 로그인 페이지로 이동');
        toast.error("세션이 만료되었습니다. 다시 로그인해주세요.", {
          toastId: 'auth-guard-token-error'
        });
        forceRedirectToLogin();
        return;
      }

      // 그 외의 경우 토큰 재발행 시도
      try {
        console.log('🔄 토큰 재발행 시도...');
        const reissueSuccess = await reissueToken();
        if (!reissueSuccess) {
          console.log('❌ 토큰 재발행 실패');
          toast.error("인증에 문제가 발생했습니다. 다시 로그인해주세요.", {
            toastId: 'auth-guard-reissue-failed'
          });
          forceRedirectToLogin();
        } else {
          console.log('✅ 토큰 재발행 성공');
        }
      } catch (reissueError) {
        console.error('❌ Bank 토큰 재발행 실패:', reissueError);
        toast.error("세션 갱신에 실패했습니다. 다시 로그인해주세요.", {
          toastId: 'auth-guard-reissue-error'
        });
        forceRedirectToLogin();
      }
    } finally {
      authCheckRef.current = false;
    }
  }, [checkAuth, reissueToken, forceRedirectToLogin]);

  // 초기화 및 인증 상태 처리 (개선된 버전)
  useEffect(() => {
    // 타이머 정리 함수
    const clearRedirectTimeout = () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };

    // 공개 라우트는 인증 검사 생략
    if (isPublicRoute(pathname)) {
      console.log('🔓 Bank 공개 라우트 접근:', pathname);
      setIsInitialized(true);
      clearRedirectTimeout();
      return;
    }

    // 로딩 중이면 아직 처리하지 않음
    if (isLoading) {
      console.log('⏳ Bank 인증 로딩 중...');
      return;
    }

    // 인증되지 않은 상태 처리
    if (!isAuthenticated) {
      console.log('❌ Bank 인증되지 않음, 로그인 페이지로 이동:', pathname);
      
      toast.error("로그인이 필요한 페이지입니다.", {
        toastId: 'auth-guard-login-required'
      });
      
      clearRedirectTimeout();
      forceRedirectToLogin();
      setIsInitialized(true);
      return;
    }

    // 인증된 상태 처리
    if (isAuthenticated) {
      console.log('✅ Bank 인증 상태 확인됨:', pathname);
      clearRedirectTimeout();
      
      // 보호된 라우트에 처음 진입할 때만 추가 검증 수행
      if (!isInitialized) {
        performAdditionalAuthCheck();
      }
      
      setIsInitialized(true);
    }

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      clearRedirectTimeout();
    };
  }, [isAuthenticated, isLoading, pathname, isPublicRoute, performAdditionalAuthCheck, isInitialized, forceRedirectToLogin]);

  // 라우트 변경 시 추가 처리 (개선된 버전)
  useEffect(() => {
    // 공개 라우트가 아니고 인증된 상태에서 라우트가 변경될 때
    if (!isPublicRoute(pathname) && isAuthenticated && isInitialized) {
      console.log('🔄 Bank 보호된 라우트 변경:', pathname);
      
      // 중요한 페이지로 이동할 때 추가 검증 (선택적)
      const criticalRoutes = ['/dashboard', '/settings', '/admin'];
      if (criticalRoutes.some(route => pathname.startsWith(route))) {
        console.log('🔍 중요한 페이지 접근, 추가 검증 수행');
        performAdditionalAuthCheck();
      }
    }
  }, [pathname, isAuthenticated, isInitialized, isPublicRoute, performAdditionalAuthCheck]);

  // 페이지별 조건부 렌더링
  if (isPublicRoute(pathname)) {
    return <>{children}</>;
  }

  // 로딩 중일 때는 로딩 화면 표시
  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg text-gray-600">🏦 Bank 시스템 로딩 중...</div>
          <div className="text-sm text-gray-400 mt-2">인증 정보를 확인하고 있습니다.</div>
        </div>
      </div>
    );
  }

  // 인증되지 않았으면 아무것도 렌더링하지 않음 (리다이렉트 대기)
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-600">🔐 로그인 페이지로 이동 중...</div>
          <div className="text-sm text-gray-400 mt-2">잠시만 기다려주세요.</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Bank용 커스텀 fetch Hook (개선된 버전)
export function useBankFetch() {
  const { authenticatedFetch, reissueToken, logout, isAuthenticated } = useAuthContext();
  const router = useRouter();
  const isFetchingRef = useRef<boolean>(false);

  const bankFetch = useCallback(async (url: string, options?: RequestInit) => {
    // 중복 요청 방지
    if (isFetchingRef.current) {
      console.log('🔄 중복 요청 방지');
      throw new Error('이전 요청이 처리 중입니다.');
    }

    // 인증 상태 체크
    if (!isAuthenticated) {
      console.log('❌ Bank 인증되지 않은 상태에서 API 요청 시도');
      toast.error("로그인이 필요합니다.");
      router.push("/login");
      throw new Error('인증이 필요합니다.');
    }

    try {
      isFetchingRef.current = true;
      console.log('🏦 Bank API 요청:', url);
      
      const response = await authenticatedFetch(url, options);
      
      // 응답 로깅 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏦 Bank API 응답 [${response.status}]:`, url);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Bank API 요청 실패:', error);
      
      // 에러 타입별 처리
      if (error instanceof Error) {
        if (error.message.includes('로그아웃') || error.message.includes('토큰') || error.message.includes('인증')) {
          console.log('🔄 Bank 인증 관련 오류, 로그인 페이지로 이동');
          toast.error("세션이 만료되었습니다. 다시 로그인해주세요.");
          router.replace("/login");
        } else if (error.message.includes('중복 요청')) {
          // 중복 요청 에러는 토스트 표시하지 않음
          console.log('⚠️ 중복 요청 감지');
        }
      }
      
      throw error;
    } finally {
      isFetchingRef.current = false;
    }
  }, [authenticatedFetch, isAuthenticated, router]);

  const bankFetchWithToast = useCallback(async (
    url: string, 
    options?: RequestInit,
    successMessage?: string,
    customErrorHandler?: (error: any) => void
  ) => {
    try {
      const response = await bankFetch(url, options);
      
      if (!response.ok) {
        let errorMessage = '요청이 실패했습니다.';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('❌ Bank API 에러 응답 파싱 실패:', parseError);
        }
        
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).response = response;
        
        if (customErrorHandler) {
          customErrorHandler(error);
        } else {
          toast.error(errorMessage, {
            toastId: `bank-api-error-${response.status}`
          });
        }
        
        throw error;
      }
      
      // 성공 메시지 표시 (선택적)
      if (successMessage) {
        toast.success(successMessage, {
          toastId: 'bank-api-success'
        });
      }
      
      return response;
    } catch (error) {
      console.error('❌ Bank API 요청 (토스트 포함) 실패:', error);
      
      // 인증 관련 에러가 아닌 경우에만 기본 에러 토스트 표시
      if (!customErrorHandler && error instanceof Error && 
          !error.message.includes('토큰') && !error.message.includes('인증') && 
          !error.message.includes('로그아웃') && !error.message.includes('중복 요청')) {
        toast.error('네트워크 오류가 발생했습니다. 다시 시도해주세요.', {
          toastId: 'bank-network-error'
        });
      }
      
      throw error;
    }
  }, [bankFetch]);

  // JSON 응답을 자동으로 파싱하는 헬퍼 함수
  const bankFetchJson = useCallback(async <T = any>(
    url: string, 
    options?: RequestInit,
    successMessage?: string
  ): Promise<T> => {
    const response = await bankFetchWithToast(url, options, successMessage);
    return await response.json();
  }, [bankFetchWithToast]);

  // 파일 업로드용 헬퍼 함수
  const bankUpload = useCallback(async (
    url: string,
    formData: FormData,
    successMessage?: string
  ) => {
    const options: RequestInit = {
      method: 'POST',
      body: formData,
      // Content-Type을 설정하지 않음 (브라우저가 자동으로 multipart/form-data로 설정)
    };
    
    // FormData일 때는 Content-Type을 제거
    return await bankFetchWithToast(url, options, successMessage);
  }, [bankFetchWithToast]);

  return {
    bankFetch,
    bankFetchWithToast,
    bankFetchJson,
    bankUpload,
    reissueToken,
    logout,
    isAuthenticated
  };
}