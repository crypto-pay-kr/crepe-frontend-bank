"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // 토큰이 없으면 로그인 페이지로 리디렉션
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    if (!accessToken || !refreshToken) {
        alert("인증 정보가 없습니다. 로그인 페이지로 이동합니다.");
      router.push("/login");
      return;
    }

    // 전역 fetch 오버라이드: 401 응답 시 로그인 페이지로 리디렉션
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        alert("세션이 만료되었습니다. 로그인 페이지로 이동합니다.");
        router.push("/login");
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [router]);

  return <>{children}</>;
}