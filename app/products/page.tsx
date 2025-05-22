"use client";


import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter} from "next/navigation"
import {
  Search, ChevronLeft, ChevronRight, Filter, Ban, FileText, Eye, PlusCircle, ArrowLeft
} from "lucide-react"
import { ConfirmationModal } from "@/components/common/confirm-modal"
import SubHeader from "@/components/common/SubHeader"
import ProductGuideModal from "@/components/product/ProductGuideModal"
import { getProducts } from "@/api/productApi"
import { mapProductTypeToFrontend } from "@/types/Product"

export default function BankProductManagement() {
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [productGuideModalOpen, setProductGuideModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; productName: string } | null>(null)
  const [bankProducts, setBankProducts] = useState<any[]>([])

  useEffect(() => {
    // API를 호출하여 상품 목록을 가져옴
    async function fetchProducts() {
      try {
        const data = await getProducts();
        setBankProducts(data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchProducts();
  }, []);

  const handleSuspendProduct = (productId: number, productName: string) => {
    setSelectedProduct({ id: productId, productName });
    setConfirmModalOpen(true);
  }

  const handleConfirmSuspend = () => {
    if (selectedProduct) {
      console.log(`상품 판매 정지 처리: ${selectedProduct.id}, ${selectedProduct.productName}`);
      // 실제 구현에서는 API 호출 등을 통해 상품 판매 정지 처리
    }
    setConfirmModalOpen(false);
    setSelectedProduct(null);
  }

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
    setSelectedProduct(null);
  }

  const handleViewProductGuide = (productId: number) => {
    const product = bankProducts.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct({ id: product.id, productName: product.productName });
      setProductGuideModalOpen(true);
    }
  }

  const handleAddProduct = () => {
    router.push("/products/add");
  };


  // 수정 모드로 이동
  const handleEditProduct = (productId: number) => {
    router.push(`/products/add?productId=${productId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
        <SubHeader onAdd={handleAddProduct} />

        {/* 검색 및 필터 */}
        <div className="p-6 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="상품명 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-lg w-[300px] focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all"
              />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <div className="flex items-center gap-3">
              <Link href="/products/suspended">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-white text-pink-500 border border-pink-500 hover:bg-pink-50">
                  <Filter size={16} />
                  이용정지 상품 리스트
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 상품 테이블 */}
        <div className="px-6 pb-6">
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-2 text-left font-bold text-gray-500 text-xs">#</th>
                  <th className="py-3 px-2 text-left font-bold text-gray-500 text-xs">상품명</th>
                  <th className="py-3 px-2 text-left font-bold text-gray-500 text-xs">종류</th>
                  <th className="py-3 px-2 text-left font-bold text-gray-500 text-xs">총 예치금</th>
                  <th className="py-3 px-2 text-left font-bold text-gray-500 text-xs">총 예치 인원</th>
                  <th className="py-3 px-2 text-left font-bold text-gray-500 text-xs">혜택</th>
                  <th className="py-3 px-2 text-left font-bold text-gray-500 text-xs">상태</th>
                  <th className="py-3 px-2 text-center font-bold text-gray-500 text-xs" colSpan={3}>
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {bankProducts.map((product) => (
                  <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-2 text-xs font-medium text-gray-800">{product.id}</td>
                    <td className="py-3 px-2 text-xs font-medium text-gray-800">{product.productName}</td>
                    <td className="py-3 px-2 text-xs text-gray-600">
                      {mapProductTypeToFrontend(product.type)}
                    </td>
                    <td className="py-3 px-2 text-xs text-gray-600">
                      {typeof product.budget === "number" ? product.budget.toLocaleString("ko-KR", { style: "currency", currency: "KRW" }) : product.budget}
                    </td>
                    <td className="py-3 px-2 text-xs text-gray-600">{product.maxParticipants}</td>
                    <td className="py-3 px-2 text-xs text-gray-600">{(product.tags || []).join(", ")}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === "승인" ? "bg-green-100 text-green-700" :
                        product.status === "심사 중" ? "bg-yellow-100 text-yellow-700" :
                          product.status === "승인 중" ? "bg-blue-100 text-blue-700" :
                            "bg-red-100 text-red-700"
                        }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="py-3 px-1">
                      {product.status === "승인 중" || product.status === "심사 중" || product.status === "거절" ? (
                        <button className="w-full px-2 py-1 rounded-md text-xs font-medium text-gray-400 border border-gray-200 cursor-not-allowed">
                          -
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspendProduct(product.id, product.productName)}
                          className="w-full px-2 py-1 rounded-md text-xs font-medium border border-pink-500 text-pink-500 hover:bg-pink-50 transition-all flex items-center justify-center"
                        >
                          <Ban className="w-3 h-3 mr-1" />
                          판매 정지
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-1">
                      <button
                        onClick={() => handleViewProductGuide(product.id)}
                        className="w-full px-2 py-1 rounded-md text-xs font-medium border border-gray-400 text-gray-600 hover:bg-gray-50 hover:border-gray-500 transition-all flex items-center justify-center"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        안내서
                      </button>
                    </td>
                    <td className="py-3 px-1">
                      <button
                        onClick={() =>  handleEditProduct(product.id)}
                        className="w-full px-2 py-1 rounded-md text-xs font-medium border border-gray-400 text-gray-600 hover:bg-gray-50 hover:border-gray-500 transition-all flex items-center justify-center"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        상세 조회
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex flex-col items-center mt-6 gap-4">
            <nav className="flex items-center justify-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`w-9 h-9 flex items-center justify-center rounded-md ${currentPage === 1 ? "text-gray-300" : "text-gray-400 hover:bg-gray-100"
                  } transition-colors`}
              >
                <ChevronLeft size={18} />
              </button>

              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 flex items-center justify-center rounded-md ${currentPage === page
                    ? "bg-pink-500 text-white font-medium"
                    : "text-gray-600 hover:bg-gray-100 transition-colors"
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(5, currentPage + 1))}
                disabled={currentPage === 5}
                className={`w-9 h-9 flex items-center justify-center rounded-md ${currentPage === 5 ? "text-gray-300" : "text-gray-400 hover:bg-gray-100"
                  } transition-colors`}
              >
                <ChevronRight size={18} />
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* 판매 정지 확인 모달 */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmSuspend}
        title="판매정지 확인"
        targetName={selectedProduct?.productName || ""}
        targetType="상품"
        actionText="판매정지"
      />

      <ProductGuideModal
        isOpen={productGuideModalOpen}
        onClose={() => setProductGuideModalOpen(false)}
        productName={selectedProduct?.productName || ""}
        pdfUrl={`/pdfs/${selectedProduct?.id}.pdf`}
      />
    </div>
  )
}