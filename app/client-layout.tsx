// app/client-layout.tsx
"use client";

import { usePathname } from 'next/navigation';
import { useBankContext } from "@/context/BankContext";
import { Sidebar } from '@/components/common/sidebar';

export default function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { bankName } = useBankContext();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  // 로그인 페이지에는 사이드바를 표시하지 않음
  if (isLoginPage) {
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
