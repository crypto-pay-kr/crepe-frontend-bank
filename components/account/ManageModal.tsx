"use client"

import { useState } from "react"
import { X, ChevronDown } from "lucide-react"
import { changeBankAccount, registerBankAccount } from "@/api/bankAccountApi"

interface AccountRegistrationModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: {
        depositorName: string
        currency: string
        address: string
        tag: string
    }) => void
    initialData?: {
        bankName: string;
        addressResponse: {
            currency: string;
            address: string;
            tag: string | null;
            status: string;
        };
    };
}

export default function AccountRegistrationModal({ isOpen, onClose, onSubmit, initialData}: AccountRegistrationModalProps) {
    const [depositorName, setDepositorName] = useState(initialData?.bankName || "");
    const [currency, setCurrency] = useState(initialData?.addressResponse.currency || "XRP");
    const [address, setAddress] = useState(initialData?.addressResponse.address || "");
    const [tag, setTag] = useState(initialData?.addressResponse.tag || "");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null


    const handleSubmit = async () => {
        try {
            setIsSubmitting(true)

            const data = {
                depositorName,
                currency,
                address,
                tag,
            };

            if (initialData) {
                // 수정 요청
                console.log("수정 요청 데이터:", { depositorName, currency, address, tag })
                await changeBankAccount(depositorName, currency, address, tag) // 수정 API 호출
                alert("계좌 수정 성공")
            } else {
                // 등록 요청
                console.log("등록 요청 데이터:", { depositorName, currency, address, tag })
                await registerBankAccount(depositorName, currency, address, tag) // 등록 API 호출
                alert("계좌 등록 성공")
            }

            // 성공 시 부모 컴포넌트에 데이터 전달
            onSubmit(data);

            // 모달 닫기
            onClose()
        } catch (error: any) {
            console.error("요청 실패:", error.message)
            alert(`요청 실패: ${error.message}`)
        } finally {
            setIsSubmitting(false)
        }
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-black">
                    <h2 className="text-xl font-medium text-pink-500">
                        {initialData ? "계좌 수정" : "계좌 등록"}
                    </h2>
                    <button onClick={onClose} className="text-pink-500 hover:text-pink-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Depositor Name */}
                    <div className="space-y-2">
                        <label className="block text-lg text-gray-700 font-medium">계좌 입금자 이름</label>
                        <input
                            type="text"
                            value={depositorName}
                            onChange={(e) => setDepositorName(e.target.value)}
                            placeholder="행명 입력"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />
                    </div>

                    {/* Dropdown */}
                    <div className="space-y-2">
                        <label className="block text-lg text-gray-700 font-medium">네트워크</label>
                        <div className="relative">
                            <div
                                className="flex items-center justify-between w-full px-4 py-3 border border-gray-300 rounded-md cursor-pointer"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-medium mr-2 text-gray-700">{currency}</span>
                                    <ChevronDown className="w-5 h-5 text-gray-700" />
                                </div>
                            </div>
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 text-center"
                                        onClick={() => {
                                            setCurrency("XRP")
                                            setIsDropdownOpen(false)
                                        }}
                                    >
                                        XRP
                                    </div>
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 text-center"
                                        onClick={() => {
                                            setCurrency("USDT")
                                            setIsDropdownOpen(false)
                                        }}
                                    >
                                        USDT
                                    </div>
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 text-center"
                                        onClick={() => {
                                            setCurrency("SOL")
                                            setIsDropdownOpen(false)
                                        }}
                                    >
                                        SOL
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <label className="block text-lg font-medium text-gray-700">Address</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="계좌 주소를 입력하세요"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />
                    </div>

                    {/* Tag */}
                    <div className="space-y-2">
                        <label className="block text-lg font-medium text-gray-700">Tag</label>
                        <input
                            type="text"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            placeholder="Tag를 입력하세요 (선택 사항)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-center gap-4 p-6">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`px-6 py-3 bg-blue-900 text-white font-medium rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                    >
                        {isSubmitting ? "처리 중..." : initialData ? "수정" : "등록"}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white text-gray-800 font-medium border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    )
}