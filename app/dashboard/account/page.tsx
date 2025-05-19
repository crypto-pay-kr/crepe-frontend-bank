'use client'
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import AccountRegistrationModal from "@/components/account/ManageModal";
import AccountHeader from "@/components/account/AccountHeader";
import { fetchBankAccounts } from "@/api/bankAccountApi";
import AccountInfoComponent from "@/components/account/AccountInfo";
import UpbitWebSocket from "@/api/UpbitWebSocket";

interface MappedAccount {
    bankName: string
    coinCurrency: string
    coinName: string
    depositorName: string
    coinAccount: string
    tagAccount?: string
    status: string
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
    const [isManageModalOpen, setIsManageModalOpen] = useState(false); // 모달 상태
    const [modalData, setModalData] = useState<MappedAccount | null>(null); // 초기 데이터 상태

    useEffect(() => {
        fetchBankAccounts()
            .then((data) => {
                // 응답 데이터 -> AccountInfoComponent에서 쓰는 형식으로 변환
                const mappedData = data.map((item: any) => ({
                    bankName: item.bankName,
                    coinCurrency: item.currency,
                    coinName: item.coinName,
                    depositorName: item.bankName,
                    coinAccount: item.accountAddress,
                    status: item.status,
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
        setModalData(null); // 새 계좌 등록이므로 초기 데이터를 null로 설정
        setIsManageModalOpen(true); // 모달 열기
    };


    const closeManageModal = () => {
        setIsManageModalOpen(false); // 모달 닫기
    };

    const handleModalSubmit = (data: { depositorName: string; currency: string; address: string; tag: string }) => {
        console.log("모달 제출 데이터:", data);
        // 실제 구현에서는 API 호출 등을 통해 계좌 추가 또는 수정 처리
        setIsManageModalOpen(false); // 모달 닫기
    };


    return (
        <div className="flex-1 p-8 overflow-auto bg-gray-50">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <AccountHeader bankName={bankName} onAddAccount={handleAddAccount} />

                <AccountInfoComponent
                    title="계좌 정보"
                    backPath="/dashboard/account"
                    accounts={bankAccounts}
                />

                {/* 모달 컴포넌트 */}
                <AccountRegistrationModal
                    isOpen={isManageModalOpen}
                    onClose={closeManageModal}
                    onSubmit={handleModalSubmit}
                    initialData={
                        modalData
                            ? {
                                bankName: modalData.bankName,
                                addressResponse: {
                                    currency: modalData.coinCurrency,
                                    address: modalData.coinAccount,
                                    tag: modalData.tagAccount || null,
                                    status: "ACTIVE"
                                },
                            }
                            : undefined
                    }
                />
            </div>
        </div>
    )
}