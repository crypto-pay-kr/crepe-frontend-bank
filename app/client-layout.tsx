// app/client-layout.tsx
"use client";
import { usePathname, useRouter } from 'next/navigation';
import { useBankContext } from "@/context/BankContext";
import { Sidebar } from '@/components/common/Sidebar';
import { useAuthContext } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { bankName } = useBankContext();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthContext();
  
  const isLoginPage = pathname === '/login';
  const isRootPage = pathname === '/';
  
  // 로그인 페이지이거나 기본 루트 페이지에는 사이드바를 표시하지 않음
  if (isLoginPage || isRootPage) {
    return <div className="h-screen">{children}</div>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar bankName={bankName} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}