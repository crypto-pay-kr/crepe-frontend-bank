"use client";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import { useAuthContext } from "@/context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, authenticatedFetch, reissueToken, logout } = useAuthContext();
  const originalFetchRef = useRef<typeof window.fetch | null>(null);

  // 인증 상태 및 라우팅 처리
  useEffect(() => {
    // 루트 페이지와 로그인 페이지는 인증 검사 생략
    if (pathname === "/" || pathname === "/login") {
      return;
    }

    // 로딩 중이 아닐 때만 인증 체크
    if (!isAuthenticated && !isLoading) {
      console.log('❌ Bank 인증되지 않음, 로그인 페이지로 이동');
      toast.error("인증 정보가 없습니다. 로그인 페이지로 이동합니다.");
      router.push("/login");
      return;
    }

    // 인증된 상태에서 추가 처리
    if (isAuthenticated) {
      console.log('✅ Bank 인증 상태 확인됨');
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // 페이지별 조건부 렌더링
  if (pathname === "/" || pathname === "/login") {
    return <>{children}</>;
  }

  // 로딩 중일 때는 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">🏦 로딩 중...</div>
      </div>
    );
  }

  // 인증되지 않았으면 아무것도 렌더링하지 않음
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// Bank용 커스텀 fetch Hook (컴포넌트에서 직접 사용 가능)
export function useBankFetch() {
  const { authenticatedFetch, reissueToken, logout } = useAuthContext();

  const bankFetch = async (url: string, options?: RequestInit) => {
    try {
      console.log('🏦 Bank API 요청:', url);
      return await authenticatedFetch(url, options);
    } catch (error) {
      console.error('❌ Bank API 요청 실패:', error);
      throw error;
    }
  };

  const bankFetchWithToast = async (url: string, options?: RequestInit) => {
    try {
      const response = await bankFetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '요청이 실패했습니다.' }));
        toast.error(errorData.message || '요청이 실패했습니다.');
        throw new Error(errorData.message || '요청이 실패했습니다.');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Bank API 요청 (토스트 포함) 실패:', error);
      throw error;
    }
  };

  return {
    bankFetch,
    bankFetchWithToast,
    reissueToken,
    logout
  };
}