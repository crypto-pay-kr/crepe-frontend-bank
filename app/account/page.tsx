"use client";

import { useEffect, useState } from "react";
import { useTickerData } from "@/hooks/useTickerData";
import { updateAccountsWithTickerData } from "@/utils/updateAccounts";
import AccountInfoComponent from "@/components/account/AccountInfo";
import SubHeader from "@/components/common/SubHeader";
import AccountRegistrationModal from "@/components/account/AccontManageModal";
import { fetchBankAccounts } from "@/api/bankAccountApi";
import { MappedAccount } from "@/types/Account";
import { TickerData } from "@/types/Coin";
import { toast } from "react-toastify"; 
import { ApiError } from "@/app/error/ApiError"; 

export default function BankAccountPage() {
  const tickerData = useTickerData();
  const [bankName, setBankName] = useState<string>("");
  const [bankAccounts, setBankAccounts] = useState<MappedAccount[]>([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [modalData, setModalData] = useState<MappedAccount | null>(null);

  // (1) 계좌 목록 재호출 함수
  const refreshAccounts = async () => {
    try {
      const data = await fetchBankAccounts();
      if (data.length > 0) {
        setBankName(data[0].bankName);
      }
      const mappedData = data.map((item: any) => ({
        bankName: item.bankName,
        coinCurrency: item.currency,
        coinName: item.coinName,
        managerName: item.managerName,
        coinAccount: item.accountAddress,
        status: item.status,
        tagAccount: item.tag || "",
        balance: {
          krw: "0 KRW",
          crypto: `${item.balance} ${item.currency}`,
        },
      }));
      setBankAccounts(mappedData);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`${err.message}`); // ApiError의 메시지를 toast로 표시
      } else {
        toast.error("계좌 목록을 불러오는 중 오류가 발생했습니다."); // 일반 오류 처리
      }
    }
  };

  // (2) 컴포넌트 최초 마운트 시 한 번 계좌 목록 불러오기
  useEffect(() => {
    refreshAccounts();
  }, []);

  // 티커 데이터가 업데이트 되면 반영
  useEffect(() => {
    Object.values(tickerData).forEach((data: TickerData) => {
      setBankAccounts((prev) => updateAccountsWithTickerData(prev, data));
    });
  }, [tickerData]);

  // +버튼 클릭 = 새 계좌 추가
  const handleAddAccount = () => {
    setModalData(null);
    setIsManageModalOpen(true);
  };

  // 모달 닫기
  const closeManageModal = () => {
    setIsManageModalOpen(false);
  };

  // (3) 모달에서 제출 시: 서버 등록/수정 → 완료 후 목록 다시 불러오기
  const handleModalSubmit = async (data: {
    managerName: string;
    currency: string;
    address: string;
    tag: string;
  }) => {
    console.log("모달 제출 데이터:", data);

    try {
      // 등록/수정이 끝나면 목록 새로고침
      await refreshAccounts();
      toast.success("계좌가 성공적으로 등록/수정되었습니다."); // 성공 메시지 표시
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`${err.message}`); // ApiError의 메시지를 toast로 표시
      } else {
        toast.error("계좌 등록/수정 중 오류가 발생했습니다."); // 일반 오류 처리
      }
    } finally {
      setIsManageModalOpen(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-auto bg-gray-50">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <SubHeader onAdd={handleAddAccount} />
        <AccountInfoComponent
          title="계좌 정보"
          backPath="/account"
          accounts={bankAccounts}
          tickerData={tickerData}
        />
        <AccountRegistrationModal
          isOpen={isManageModalOpen}
          onClose={closeManageModal}
          onSubmit={handleModalSubmit}
          initialData={
            modalData
              ? {
                  managerName: modalData.managerName,
                  addressResponse: {
                    currency: modalData.coinCurrency,
                    address: modalData.coinAccount,
                    tag: modalData.tagAccount || null,
                    status: "ACTIVE"
                  }
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}