"use client"

import React, { useState } from "react"
import { X, ChevronDown } from "lucide-react"
import { changeBankAccount, registerBankAccount } from "@/api/bankAccountApi"

interface AccountManageModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: {
        managerName: string
        currency: string
        address: string
        tag: string
    }) => void
    initialData?: {
        managerName: string;
        addressResponse: {
            currency: string;
            address: string;
            tag: string | null;
            status: string;
        };
    };
}

export default function AccountManageModal({ isOpen, onClose, onSubmit, initialData }: AccountManageModalProps) {
    const [managerName, setManagerName] = useState(initialData?.managerName || "");
    const [currency, setCurrency] = useState(initialData?.addressResponse.currency || "XRP");
    const [address, setAddress] = useState(initialData?.addressResponse.address || "");
    const [tag, setTag] = useState(initialData?.addressResponse.tag || "");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    // 모든 계좌에서 address는 필수이므로 빈 문자열이면 등록 버튼 비활성화
    const isAddressEmpty = address.trim() === ""

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true)

            const data = {
                managerName,
                currency,
                address,
                tag,
            };

            if (initialData) {
                console.log("수정 요청 데이터:", data)
                await changeBankAccount(managerName, currency, address, tag) // 수정 API 호출
            } else {
                console.log("등록 요청 데이터:", data)
                await registerBankAccount(managerName, currency, address, tag) // 등록 API 호출
            }

            onSubmit(data);
            onClose();

            // 폼 데이터 초기화
            setManagerName("");
            setCurrency("XRP");
            setAddress("");
            setTag("");
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
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-400">
                    <h2 className="text-xl font-medium text-white">
                        {initialData ? "계좌 수정" : "계좌 등록"}
                    </h2>
                    <button onClick={onClose} className="text-white hover:text-pink-100 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Manager Name */}
                    <div className="space-y-2">
                        <label className="block text-lg text-gray-700 font-medium">계좌 입금자 이름</label>
                        <input
                            type="text"
                            value={managerName}
                            onChange={(e) => setManagerName(e.target.value)}
                            placeholder="담당자 이름"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-700"
                        />
                    </div>

                    {/* Dropdown */}
                    <div className="space-y-2">
                        <label className="block text-lg text-gray-700 font-medium">네트워크</label>
                        <div className="relative">
                            <div
                                className="flex items-center justify-between w-full px-4 py-3 border border-gray-300 rounded-md cursor-pointer focus:ring-2 focus:ring-pink-500"
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
                                        className="px-4 py-2 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 cursor-pointer text-gray-700 text-center"
                                        onClick={() => {
                                            setCurrency("XRP")
                                            setIsDropdownOpen(false)
                                        }}
                                    >
                                        XRP
                                    </div>
                                    <div
                                        className="px-4 py-2 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 cursor-pointer text-gray-700 text-center"
                                        onClick={() => {
                                            setCurrency("USDT")
                                            setIsDropdownOpen(false)
                                        }}
                                    >
                                        USDT
                                    </div>
                                    <div
                                        className="px-4 py-2 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 cursor-pointer text-gray-700 text-center"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-700"
                            required
                        />
                    </div>

                    {/* Tag */}
                    <div className="space-y-2">
                        <label className="block text-lg font-medium text-gray-700">Tag</label>
                        <input
                            type="text"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            placeholder="Tag를 입력하세요 (XRP 전용)"
                            disabled={currency !== "XRP"}
                            className={`w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-700 ${
                                currency !== "XRP" ? "bg-gray-200 cursor-not-allowed" : "bg-white"
                            }`}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-center gap-4 p-6">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isAddressEmpty}
                        className={`px-6 py-3 bg-gradient-to-r bg-pink-500 text-white font-medium rounded-md shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 active:scale-95 ${
                            isSubmitting || isAddressEmpty ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                        {isSubmitting ? "처리 중..." : initialData ? "수정" : "등록"}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white text-gray-800 font-medium border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    )
}