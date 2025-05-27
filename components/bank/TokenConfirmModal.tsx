import { X } from "lucide-react"

interface TokenConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
}

export function TokenConfirmModal({ isOpen, onClose, onConfirm }: TokenConfirmModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r  from-pink-500 to-rose-400">
                    <h2 className="text-lg font-medium text-white">요청 확인</h2>
                    <button 
                        onClick={onClose} 
                        className="text-white hover:text-gray-300 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-center text-2xl text-gray-700 font-medium my-16">이 토큰을 발행 요청하시겠습니까?</p>

                    <div className="flex gap-3 mt-8">
                        <button 
                            onClick={onConfirm} 
                            className="px-6 py-3 bg-gradient-to-r bg-pink-500 text-white rounded-md font-medium flex-1 shadow-md hover:shadow-lg transition-all active:scale-95"
                        >
                            전송
                        </button>
                        <button 
                            onClick={onClose} 
                            className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-md font-medium flex-1 shadow-md hover:shadow-lg transition-all active:scale-95 border border-gray-300"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}