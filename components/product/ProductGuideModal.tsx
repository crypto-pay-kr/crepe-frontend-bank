"use client"

import React from "react"
import { X } from "lucide-react"

interface ProductGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  pdfUrl: string;
}

export default function ProductGuideModal({ isOpen, onClose, productName, pdfUrl }: ProductGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-pink-500 to-rose-400 text-white">
          <h2 className="text-lg font-medium">상품 안내서 - {productName}</h2>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X size={20} />
          </button>
        </div>
        {/* PDF 뷰어 영역 */}
        <div className="flex-1">
          <iframe
            src={pdfUrl}
            className="w-full h-full"
            title="Product Guide"
            frameBorder="0"
          />
        </div>
      </div>
    </div>
  );
}