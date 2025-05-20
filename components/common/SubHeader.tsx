import React from "react";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";

interface SubHeaderProps {
  bankName: string;
  onAddAccount: () => void; // 추가 버튼 클릭 시 호출할 함수
}

const SubHeader: React.FC<SubHeaderProps> = ({ bankName, onAddAccount }) => {
  const pathname = usePathname();
  const isTokenManagement = pathname === "/token";

  return (
    <div className="p-8 bg-white shadow-sm rounded-md mb-5 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button className="rounded-full hover:bg-gray-100 transition-colors duration-200">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">{bankName}</h1>
          <div className="flex text-sm text-gray-500 font-medium">
            <span className="hover:text-gray-700 cursor-pointer transition-colors duration-200">은행</span>
            <span className="mx-2 text-gray-400">/</span>
            <span className="hover:text-gray-700 cursor-pointer transition-colors duration-200">
              {isTokenManagement ? "은행 토큰 관리" : "은행 상세 관리"}
            </span>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-800">
            {isTokenManagement ? "" : "은행 상세 관리"}
            </span>
          </div>
        </div>
        <button
          onClick={onAddAccount}
          className="px-5 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center shadow-sm"
        >
          {isTokenManagement ? "요청 추가" : "계좌 추가"}
        </button>
      </div>
    </div>
  );
};

export default SubHeader;