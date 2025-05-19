'use client'
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import AccountInfoComponent from "@/components/common/account/AccountInfo"
import { ArrowLeft, Link } from "lucide-react";
import { fetchBankAccounts } from "@/api/bankAccountApi";

interface MappedAccount {
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
  // URL 파라미터에서 은행 ID 가져오기
  const params = useParams();
  const bankId = params.id;

  // URL 쿼리 파라미터에서 은행 이름 가져오기
  const searchParams = useSearchParams();
  const bankName = searchParams.get('name') || "은행";

  const [bankAccounts, setBankAccounts] = useState<MappedAccount[]>([])

  useEffect(() => {
    fetchBankAccounts()
      .then((data) => {
        // 응답 데이터 -> AccountInfoComponent에서 쓰는 형식으로 변환
        const mappedData = data.map((item: any) => ({
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
  }, [])

  const handleDisconnectBankAccount = (accountId: string, coinName: string) => {
    console.log(`${bankName} ${coinName} 계좌 연결 해제: ${accountId}`)
    // 실제 구현에서는 API 호출 등을 통해 계좌 연결 해제 처리
  }


  return (
    <div className="border-b border-gray-200">
    <div className="flex items-center p-4 h-16">
      <Link className="mr-4">
        <ArrowLeft className="w-6 h-6 text-gray-700" />
      </Link>
      <h1 className="text-xl font-medium text-gray-800">우리은행</h1>
      <div className="ml-auto">
        <Link href="#" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 text-sm font-medium">
          추가
        </Link>
      </div>
    </div>
    <div className="flex text-sm px-4 pb-3 text-gray-500">
      <span>은행</span>
      <span className="mx-2">/</span>
      <span>은행상세 관리</span>
      <span className="mx-2">/</span>
      <span>연결된 계좌 관리</span>
    </div>

    <AccountInfoComponent
      title={`${bankName} 계좌 정보`}
      accounts={bankAccounts}
      onDisconnect={handleDisconnectBankAccount}
    />
  </div>
)
}