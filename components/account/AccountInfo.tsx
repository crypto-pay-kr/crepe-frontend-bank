"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAccountByCurrency } from "@/api/bankAccountApi";
import { fetchBankAccounts } from "@/api/bankAccountApi";
import { fetchCoinPrices } from "@/api/coinApi";

import { useState, useEffect } from "react"
import AccountRegistrationModal from "./ManageModal";

// 계좌 정보 타입 정의
interface AccountBalance {
  fiat: string;
  crypto: string;
}

interface AccountInfo {
  coinName: string;
  coinCurrency: string;
  depositorName: string;
  coinAccount: string;
  tagAccount?: string;
  balance: AccountBalance;
  status: string;
}

interface AccountInfoProps {
  title?: string;
  backPath?: string;
  accounts?: AccountInfo[];
  onModify?: (accountId: string, coinName: string) => void;
}

export default function AccountInfoComponent({
  title = "계좌 정보",
  backPath = "/dashboard/account",
  accounts = [],
}: AccountInfoProps) {
  // const [coinPrices, setCoinPrices] = useState<Record<string, any>>({}); // 시세 데이터를 저장
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountInfo | null>(null)
  const [prices, setPrices] = useState<{ [key: string]: number }>({
    "KRW-SOL": 0,
    "KRW-XRP": 0,
    "KRW-USDT": 0,
});

  const [modalData, setModalData] = useState<{
    bankName: string;
    addressResponse: {
      currency: string;
      address: string;
      tag: string | null;
      status: string;
    };
  } | null>(null);

    // 시세 데이터를 가져오는 함수
    useEffect(() => {
      // const loadCoinPrices = async () => {
      //   try {
      //     const prices = await fetchCoinPrices();
      //     setPrices(prices);
      //   } catch (error) {
      //     console.error("시세 데이터를 가져오는 데 실패했습니다:", error);
      //   }
      // };
  
    }, []);

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

  const calculateFiatValue = (cryptoAmount: string, market: string): string => {
    const currentPrice = prices[market]; // `prices`는 `fetchCoinPrices`에서 가져온 시세 데이터
    console.log("cryptoAmount:", cryptoAmount); // 전달된 코인 잔액
    console.log("market:", market);             // 전달된 코인 마켓
    console.log("currentPrice:", currentPrice); // 해당 마켓의 현재 시세 데이터
  
    if (!currentPrice) return "시세 없음"; // 시세 데이터가 없을 경우 처리
    const fiatValue = parseFloat(cryptoAmount) * currentPrice; // 원화 계산
    console.log("fiatValue:", fiatValue);       // 계산된 원화 값
    return `${fiatValue.toLocaleString()} 원`; // 원화로 변환
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
                    <div>{calculateFiatValue(account.balance.fiat, account.coinCurrency)}</div>
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