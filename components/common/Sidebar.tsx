'use client'
import { BarChart3,  ArrowRight, Building2, FileCheck, Wallet, LogOut, Coins, Package} from "lucide-react"

import { usePathname, useRouter } from 'next/navigation'
import { NavItem } from "./NavItem";



export const Sidebar: React.FC<{ bankName: string }> = ({ bankName }) => {
  const pathname = usePathname();
  const router = useRouter();

  // 경로에 따라 탭 상태 설정
  const isManagementPath = pathname.startsWith('/management');
  const isBankPath = pathname.startsWith('/bank');

  // 기본 경로(/)에서는 사용자 관리 탭이 선택된 상태로 표시
  const isDefaultPath = pathname === '/' || pathname === '';

  // 로그아웃 함수
  const handleLogout = () => {

    // 로컬 스토리지에서 토큰 제거 (필요 시)
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");

    console.log("로그아웃 완료: 토큰 제거됨");

    // 로그인 페이지로 리다이렉트
    router.push("/login");
  };

  return (
    <div className="w-[240px] bg-gray-900 flex flex-col items-center h-screen overflow-hidden sticky top-0 left-0 pt-10 pb-6 shadow-xl">
      {/* 로고 */}
      <div className="mb-10">
        <img src="/crepe-newlogo2.png" alt="Logo" className="w-32 h-32 rounded-lg" />
      </div>

      {/* 사이트 바로가기 버튼 */}
      <button
        onClick={() => window.open('/', '_blank')}
        className="flex items-center justify-between bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-full py-3 px-5 w-[200px] mb-10 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
      >
        <span className="text-sm font-medium">사이트 바로가기</span>
        <ArrowRight size={16} />
      </button>

      {/* 네비게이션 메뉴 */}
      <nav className="flex flex-col gap-4 items-start w-full mt-4 px-4">

        <>
          <NavItem
            href="/dashboard"
            icon={BarChart3}
            label="대시보드"
            exact={true}
          />
          <NavItem
            href="/products"
            icon={Package}
            label="은행 상품 관리"
            exact={false}
            activeUrls={['/products', '/wallet']}
          />
          <NavItem
            href="/token"
            icon={Coins}
            label="은행 토큰 관리"
            exact={true}
          />
          <NavItem
            href="/account"
            icon={Wallet}
            label="은행 계좌 관리"
            exact={true}
          />
        </>

      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center justify-between from-pink-500 to-rose-400 text-white rounded-full py-3 px-5 w-[200px] mt-auto shadow-md hover:bg-red-600 transition-all cursor-pointer active:scale-95"
      >
        <span className="text-sm font-medium">로그아웃</span>
        <LogOut size={16} />
      </button>
    </div>
  )
}
