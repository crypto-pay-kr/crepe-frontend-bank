"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import { useAuthContext } from "@/context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthContext(); // Hook은 항상 최상단에

  // useEffect도 항상 호출
  useEffect(() => {
    // 루트 페이지와 로그인 페이지는 인증 검사 생략
    if (pathname === "/" || pathname === "/login") {
      return;
    }

    // Context의 인증 상태를 사용
    if (!isAuthenticated && !isLoading) { // 로딩 중이 아닐 때만 체크
      toast.error("인증 정보가 없습니다. 로그인 페이지로 이동합니다.");
      router.push("/login");
      return;
    }

    if (isAuthenticated) {

      // 전역 fetch 오버라이드: 401 응답 시 로그인 페이지로 리디렉션
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        if (response.status === 401) {
          console.log("❌ 401 응답 받음, 로그인 페이지로 이동");
          toast.error("세션이 만료되었습니다. 로그인 페이지로 이동합니다.");
          router.push("/login");
        }
        return response;
      };

      return () => {
        window.fetch = originalFetch;
      };
    }
  }, [isAuthenticated, isLoading, router, pathname]); // 모든 의존성 추가

  // 조건부 렌더링은 Hook 호출 이후에
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