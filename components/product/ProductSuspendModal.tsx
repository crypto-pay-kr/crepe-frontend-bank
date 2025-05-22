"use client"

import { X } from "lucide-react"

interface ProductSuspensionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  productName: string
}

export default function ProductSuspensionModal({
  isOpen,
  onClose,
  onConfirm,
  productName,
}: ProductSuspensionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 bg-[#1F2937] text-white">
          <h2 className="text-lg font-medium">상품 판매 정지</h2>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-center text-lg mb-8">
            <span className="font-bold">{productName}</span> 상품의 판매를 중지하시겠습니까?
          </p>
          <p className="text-center text-sm text-gray-500 mb-8">
            판매가 중지된 상품은 이용정지 상품 리스트에서 확인할 수 있습니다.
          </p>

          <div className="flex gap-3 justify-center">
            <button onClick={onConfirm} className="px-6 py-2 bg-red-500 text-white rounded-md font-medium">
              판매 정지
            </button>
            <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-md font-medium">
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
