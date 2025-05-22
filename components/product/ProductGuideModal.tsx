"use client"

import { useState } from "react"
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"

interface ProductGuideModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  pdfUrl: string
}

export default function ProductGuideModal({ isOpen, onClose, productName, pdfUrl }: ProductGuideModalProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(5) // 예시로 5페이지로 설정
  const [zoomLevel, setZoomLevel] = useState(100)

  if (!isOpen) return null

  const handleDownload = () => {
    // 실제 구현에서는 PDF 파일 다운로드 처리
    console.log(`Downloading PDF for ${productName}`)
    window.open(pdfUrl, "_blank")
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleZoomIn = () => {
    if (zoomLevel < 200) {
      setZoomLevel(zoomLevel + 25)
    }
  }

  const handleZoomOut = () => {
    if (zoomLevel > 50) {
      setZoomLevel(zoomLevel - 25)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 bg-[#1F2937] text-white">
          <h2 className="text-lg font-medium">상품 안내서 - {productName}</h2>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {/* PDF 뷰어 영역 */}
          <div
            className="bg-white shadow-md mx-auto overflow-hidden transition-all duration-200"
            style={{
              width: `${zoomLevel}%`,
              maxWidth: "100%",
              height: "100%",
              minHeight: "500px",
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-4">PDF 미리보기</p>
                <div className="w-full h-[400px] bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <p className="text-xl font-bold text-gray-400">
                    상품 안내서 {currentPage}/{totalPages}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button onClick={handleZoomOut} className="p-2 rounded-md hover:bg-gray-100" disabled={zoomLevel <= 50}>
              <ZoomOut size={20} className={zoomLevel <= 50 ? "text-gray-300" : "text-gray-600"} />
            </button>
            <span className="text-sm">{zoomLevel}%</span>
            <button onClick={handleZoomIn} className="p-2 rounded-md hover:bg-gray-100" disabled={zoomLevel >= 200}>
              <ZoomIn size={20} className={zoomLevel >= 200 ? "text-gray-300" : "text-gray-600"} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handlePrevPage} className="p-2 rounded-md hover:bg-gray-100" disabled={currentPage <= 1}>
              <ChevronLeft size={20} className={currentPage <= 1 ? "text-gray-300" : "text-gray-600"} />
            </button>
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              className="p-2 rounded-md hover:bg-gray-100"
              disabled={currentPage >= totalPages}
            >
              <ChevronRight size={20} className={currentPage >= totalPages ? "text-gray-300" : "text-gray-600"} />
            </button>
          </div>

          <button onClick={handleDownload} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
            <Download size={18} />
            <span className="text-sm">다운로드</span>
          </button>
        </div>
      </div>
    </div>
  )
}
