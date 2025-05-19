'use client'
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import AccountInfoComponent from "@/components/common/account/AccountInfo"
import { ArrowLeft, Link } from "lucide-react";
import { fetchBankAccounts } from "@/api/bankAccountApi";
import AccountRegistrationModal from "@/components/common/account/manage-modal";

interface MappedAccount {
    bankName: string
    coinName: string
    depositorName: string
    coinAccount: string
    tagAccount?: string
    balance: {
        fiat: string
        crypto: string
    }
}

export default function BankAccountPage() {

    // URL 쿼리 파라미터에서 은행 이름 가져오기
    const searchParams = useSearchParams();

    const [bankName, setBankName] = useState<string>(""); // 은행 이름 상태
    const [bankAccounts, setBankAccounts] = useState<MappedAccount[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)


    useEffect(() => {
        fetchBankAccounts()
            .then((data) => {
                // 응답 데이터 -> AccountInfoComponent에서 쓰는 형식으로 변환
                const mappedData = data.map((item: any) => ({
                    bankName: item.bankName,
                    coinName: item.coinName,
                    depositorName: item.bankName,
                    coinAccount: item.accountAddress,
                    tagAccount: item.tag || "",
                    balance: {
                        fiat: "0 KRW", // fiat 값이 없으므로 예시로 "0 KRW" 고정
                        crypto: `${item.balance} ${item.currency}`
                    }
                }))
                setBankAccounts(mappedData)
            })
            .catch((err) => console.error(err))

        fetchBankAccounts(); // 계좌 정보 가져오기

    }, [])

    const handleAddAccount = () => {
        setIsModalOpen(true)
    }


    const handleModalClose = () => {
        setIsModalOpen(false); // 모달 닫기
    };

    const handleModalSubmit = (data: { depositorName: string; network: string; amount: string; tag: string }) => {
        console.log("모달 제출 데이터:", data);
        // 실제 구현에서는 API 호출 등을 통해 계좌 추가 처리
        setIsModalOpen(false); // 모달 닫기
    };



    return (
        <div className="border-b border-gray-200">
            <div className="bg-white p-4 mb-4 shadow-sm">
                <div className="flex items-center mb-2">
                    <a href="#" className="flex items-center text-gray-700">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span className="text-lg font-medium text-gray-700">{bankName}</span>
                    </a>
                    <div className="ml-auto">
                        <button
                            onClick={handleAddAccount}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 text-sm font-medium"
                        >
                            추가
                        </button>
                    </div>
                </div>

                {/* Breadcrumb navigation */}
                <div className="flex text-sm text-gray-500">
                    <span>은행</span>
                    <span className="mx-2">/</span>
                    <span>은행 상세 관리</span>
                    <span className="mx-2">/</span>
                    <span>연결된 계좌 관리</span>
                </div>
            </div>


            <AccountInfoComponent
                title={`${bankName} 계좌 정보`}
                accounts={bankAccounts}
                onModify={handleAddAccount}
            />

            {/* 모달 컴포넌트 */}
            <AccountRegistrationModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSubmit={handleModalSubmit}
            />
        </div>
    )
}