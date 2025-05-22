"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { BarChart3, Users, Store, User, ArrowRight, Search, ArrowLeft } from "lucide-react"

export default function SuspendedUsersList() {
    const [selectedUsers, setSelectedUsers] = useState<number[]>([1])
    const [selectAll, setSelectAll] = useState(false)

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(suspendedUsers.map((user) => user.id))
        }
        setSelectAll(!selectAll)
    }

    const toggleSelectUser = (userId: number) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter((id) => id !== userId))
        } else {
            setSelectedUsers([...selectedUsers, userId])
        }
    }

    const handleRemoveSuspension = () => {
        console.log("이용정지 해제:", selectedUsers)
        // 실제 구현에서는 API 호출 등을 통해 이용정지 해제 처리
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* 메인 콘텐츠 */}
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    {/* 헤더 */}
                    <div className="mb-6">
                        <div className="flex items-center mb-2">
                            <Link href="/user" className="flex items-center text-gray-500 hover:text-gray-700">
                                <ArrowLeft size={18} className="mr-2" />
                                <h1 className="text-xl font-bold">이용정지 유저 리스트</h1>
                            </Link>
                        </div>
                        <div className="text-sm text-gray-500 mb-4">
                            <span>유저</span> / <span>유저관리</span> / <span>이용정지 유저 리스트</span>
                        </div>
                    </div>

                    {/* 액션 버튼 및 검색 */}
                    <div className="flex justify-between mb-6">
                        <button
                            onClick={handleRemoveSuspension}
                            disabled={selectedUsers.length === 0}
                            className={`px-4 py-2 rounded-md text-sm text-white ${selectedUsers.length > 0 ? "bg-[#1F2937]" : "bg-gray-400"
                                }`}
                        >
                            이용정지 해제
                        </button>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="유저 아이디 검색"
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-full w-[300px]"
                            />
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {/* 유저 테이블 */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="py-3 px-4 text-left">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={toggleSelectAll}
                                                className="mr-2 h-4 w-4 accent-[#F47C98]"
                                            />
                                            <span className="font-medium text-gray-600">선택</span>
                                        </div>
                                    </th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-600">아이디</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-600">이용정지 일자</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-600">이용정지 기간</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-600">이용정지 사유</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suspendedUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-gray-100">
                                        <td className="py-4 px-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => toggleSelectUser(user.id)}
                                                className="h-4 w-4 accent-[#F47C98]"
                                            />
                                        </td>
                                        <td className="py-4 px-4 text-gray-800">{user.username}</td>
                                        <td className="py-4 px-4 text-gray-800">{user.suspendedDate}</td>
                                        <td className="py-4 px-4 text-gray-800">{user.suspensionPeriod}</td>
                                        <td className="py-4 px-4 text-gray-800 max-w-md truncate">{user.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 페이지네이션 */}
                    <div className="flex justify-center mt-6">
                        <nav className="flex items-center gap-2">
                            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200">
                                &lt;
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#F47C98] text-white">1</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200">2</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200">3</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200">4</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200">5</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200">
                                &gt;
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
  )
}

const suspendedUsers = [
    {
        id: 1,
        username: "유저 닉네임",
        suspendedDate: "2025/01/07",
        suspensionPeriod: "7일 이용정지",
        reason: "문의 내역 게인정보 남겨 신고사항 게인거래 유도",
    },
    {
        id: 2,
        username: "유저 닉네임",
        suspendedDate: "2025/01/07",
        suspensionPeriod: "7일 이용정지",
        reason: "문의 내역 게인정보 남겨 신고사항 게인거래 유도",
    },
    {
        id: 3,
        username: "유저 닉네임",
        suspendedDate: "2025/01/07",
        suspensionPeriod: "7일 이용정지",
        reason: "문의 내역 게인정보 남겨 신고사항 게인거래 유도",
    },
    {
        id: 4,
        username: "유저 닉네임",
        suspendedDate: "2025/01/07",
        suspensionPeriod: "7일 이용정지",
        reason: "문의 내역 게인정보 남겨 신고사항 게인거래 유도",
    },
    {
        id: 5,
        username: "유저 닉네임",
        suspendedDate: "2025/01/07",
        suspensionPeriod: "7일 이용정지",
        reason: "문의 내역 게인정보 남겨 신고사항 게인거래 유도",
    },
    {
        id: 6,
        username: "유저 닉네임",
        suspendedDate: "2025/01/07",
        suspensionPeriod: "7일 이용정지",
        reason: "문의 내역 게인정보 남겨 신고사항 게인거래 유도",
    },
    {
        id: 7,
        username: "유저 닉네임",
        suspendedDate: "2025/01/07",
        suspensionPeriod: "7일 이용정지",
        reason: "문의 내역 게인정보 남겨 신고사항 게인거래 유도",
    },
    {
        id: 8,
        username: "유저 닉네임",
        suspendedDate: "2025/01/07",
        suspensionPeriod: "7일 이용정지",
        reason: "문의 내역 게인정보 남겨 신고사항 게인거래 유도",
    },
    {
        id: 9,
        username: "유저 닉네임",
        suspendedDate: "2025/01/07",
        suspensionPeriod: "7일 이용정지",
        reason: "문의 내역 게인정보 남겨 신고사항 게인거래 유도",
    },
    {
        id: 10,
        username: "유저 닉네임",
        suspendedDate: "2025/01/07",
        suspensionPeriod: "7일 이용정지",
        reason: "문의 내역 게인정보 남겨 신고사항 게인거래 유도",
    },
]
