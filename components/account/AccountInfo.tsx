"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAccountByCurrency } from "@/api/bankAccountApi";
import { useState, useEffect } from "react"
import AccountRegistrationModal from "./ManageModal";
import { TickerData } from "@/types/Coin";
import { AccountInfo } from "@/types/Account";


interface AccountInfoProps {
  title?: string;
  backPath?: string;
  accounts?: AccountInfo[];
  tickerData?: Record<string, TickerData>;
}

export default function AccountInfoComponent({
  title = "계좌 정보",
  backPath = "/dashboard/account",
  accounts = [],
  tickerData = {},
}: AccountInfoProps) {
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountInfo | null>(null)

  console.log("부모에서 받은 tickerData:", tickerData);
  const [modalData, setModalData] = useState<{
    bankName: string;
    addressResponse: {
      currency: string;
      address: string;
      tag: string | null;
      status: string;
    };
  } | null>(null);


  // 상태 변환 함수
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "ACTIVE":
        return "등록 완료";
      case "NOT_REGISTERED":
        return "미등록";
      case "REGISTERING":
        return "등록중";
      default:
        return "알 수 없음";
    }
  };

  const calculateFiatValue = (coinAmount: string, symbol: string): string => {
    const marketCode = `KRW-${symbol}`;
    const ticker = tickerData[marketCode];
    if (!ticker || !ticker.trade_price) return "시세 불러오기 실패";

    const parsedAmount = parseFloat(coinAmount);

    if (isNaN(parsedAmount)) return "잔액 오류";

    const totalKRW = parsedAmount * ticker.trade_price;
    return `${Math.floor(totalKRW).toLocaleString()} 원`;
  };



  const openManageModal = async (account: AccountInfo) => {
    try {
      setSelectedAccount(account);

      // API 요청
      const data = await getAccountByCurrency(account.coinCurrency);
      setModalData({
        bankName: data.bankName,
        addressResponse: {
          currency: data.addressResponse.currency,
          address: data.addressResponse.address,
          tag: data.addressResponse.tag,
          status: data.addressResponse.status,
        },
      })

      // 모달 열기
      setIsManageModalOpen(true);
    } catch (error: any) {
      console.error("계좌 정보 가져오기 실패:", error.message);
      alert(`계좌 정보 가져오기 실패: ${error.message}`);
    }
  };

  const closeManageModal = () => {
    setIsManageModalOpen(false);
    setModalData(null);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* 메인 콘텐츠 */}
      <div className="flex-1 p-8 overflow-auto bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            </div>
          </div>

          {/* 계좌 정보 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left font-medium text-gray-600">심볼</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">입금자 명</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">코인 계좌</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">Tag 계좌</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">잔액</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">상태</th>
                  <th className="py-3 px-4 text-center font-medium text-gray-600">관리</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-800">{account.coinCurrency}</td>
                    <td className="py-4 px-4 text-gray-800">{account.depositorName}</td>
                    <td className="py-4 px-4 text-gray-800 max-w-xs truncate">
                      <span title={account.coinAccount}>{account.coinAccount}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-800">{account.tagAccount || "-"}</td>
                    <td className="py-4 px-4">
                      <div className="text-red-600 font-bold">
                        {calculateFiatValue(account.balance.crypto, account.coinCurrency)}
                      </div>
                      <div className="text-sm text-gray-500">{account.balance.crypto}</div>
                    </td>
                    <td className="py-4 px-4 text-gray-800">{getStatusLabel(account.status)}</td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => openManageModal(account)}
                        className="px-4 py-1 rounded-md text-sm border text-gray-800 border-gray-300 hover:bg-gray-50"
                      >
                        연결 관리
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 관리 모달 */}
      {modalData && (
        <AccountRegistrationModal
          isOpen={isManageModalOpen}
          onClose={closeManageModal}
          onSubmit={() => { }}
          initialData={modalData} // 초기 데이터 전달
        />
      )}
    </div>
  )
}