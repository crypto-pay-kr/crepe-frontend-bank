
import { ArrowLeft, PlusCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface SubHeaderProps {
  onAdd?: () => void; // 추가 버튼 클릭 시 호출할 함수
}

const SubHeader: React.FC<SubHeaderProps> = ({ onAdd }) => {
  const pathname = usePathname();
  const router = useRouter();
  const isTokenManagement = pathname === "/token";
  const isProductManagement = pathname === "/products";
  const isProductsuspended = pathname === "/products/suspended";

  return (
    <div className="p-8 bg-white shadow-sm rounded-md mb-5 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            className="rounded-full hover:bg-gray-100 transition-colors duration-200"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex text-sm text-gray-500 font-medium">
            <span className="hover:text-pink-500 cursor-pointer transition-colors duration-200">
              은행
            </span>
            <span className="mx-2 text-gray-400">/</span>
            <span className="hover:text-pink-500 cursor-pointer transition-colors duration-200">
              {isTokenManagement
                ? "은행 토큰 관리"
                : isProductManagement
                  ? "은행 상품 관리"
                  : isProductsuspended
                    ? "판매정지 상품 리스트"
                    : "은행 상세 관리"}
            </span>
            <span className="mx-2 text-gray-400">/</span>
            <span className="hover:text-pink-500 cursor-pointer transition-colors duration-200 text-gray-800">
              {isTokenManagement
                ? "토큰 발행 상태"
                : isProductManagement
                  ? ""
                  : isProductsuspended
                    ? ""
                    : "은행 상세 관리"}
            </span>
          </div>
        </div>
        {!isProductsuspended && (
          <button onClick={onAdd}
            className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            <PlusCircle size={18} className="text-pink-500" />
            <span className="text-gray-800">
              {isTokenManagement
                ? "요청 추가"
                : isProductManagement
                  ? "상품 추가"
                  : "계좌 추가"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SubHeader;