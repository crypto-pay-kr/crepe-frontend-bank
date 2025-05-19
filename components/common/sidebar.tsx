'use client'
import { BarChart3, Users, Store, User, ArrowRight, Building2, FileCheck, Wallet } from "lucide-react"
import { NavItem } from "./nav-item"
import { usePathname } from 'next/navigation'

export function Sidebar() {
  const pathname = usePathname();
  
  // 경로에 따라 탭 상태 설정
  const isManagementPath = pathname.startsWith('/management');
  const isBankPath = pathname.startsWith('/bank');
  
  // 기본 경로(/)에서는 사용자 관리 탭이 선택된 상태로 표시
  const isDefaultPath = pathname === '/' || pathname === '';
  
  return (
    <div className="w-[240px] bg-gray-900 flex flex-col items-center h-screen overflow-hidden sticky top-0 left-0 pt-10 pb-6 shadow-xl">
      {/* 로고 */}
      <div className="mb-10">
        <div className="bg-gradient-to-br from-pink-50 to-white p-4 rounded-xl w-[120px] h-[120px] flex items-center justify-center shadow-lg">
          <div className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 font-bold text-2xl">CREPE</div>
        </div>
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
              icon={Building2} 
              label="은행 상품 관리" 
              exact={false}
              activeUrls={['/products', '/wallet']}
            />
            <NavItem 
              href="/token" 
              icon={FileCheck} 
              label="은행 토큰 관리" 
              exact={true}
            />
          </>
        
      </nav>
    </div>
  )
}