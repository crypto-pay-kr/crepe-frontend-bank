'use client';
import { useEffect, useState } from "react";
import { useTickerData} from "@/hooks/useTickerData";
import { updateAccountsWithTickerData } from "@/utils/updateAccounts";
import AccountInfoComponent from "@/components/account/AccountInfo";
import SubHeader from "@/components/common/SubHeader";
import AccountRegistrationModal from "@/components/account/AccontManageModal";
import { fetchBankAccounts } from "@/api/bankAccountApi";
import { MappedAccount } from "@/types/Account";
import { TickerData } from "@/types/Coin";


export default function BankAccountPage() {
  const tickerData = useTickerData();
  const [bankName, setBankName] = useState<string>("");
  const [bankAccounts, setBankAccounts] = useState<MappedAccount[]>([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [modalData, setModalData] = useState<MappedAccount | null>(null);

  useEffect(() => {
    fetchBankAccounts()
      .then((data) => {
        if (data.length > 0) {
          setBankName(data[0].bankName);
        }
        const mappedData = data.map((item: any) => ({
          bankName: item.bankName,
          coinCurrency: item.currency,
          coinName: item.coinName,
          depositorName: item.bankName,
          coinAccount: item.accountAddress,
          status: item.status,
          tagAccount: item.tag || "",
          balance: {
            krw: "0 KRW",
            crypto: `${item.balance} ${item.currency}`
          }
        }));
        setBankAccounts(mappedData);
      })
      .catch((err) => console.error(err));
  }, []);

  // 티커 데이터가 업데이트 될 때마다 각 계좌 정보를 업데이트
  useEffect(() => {
    // tickerData 는 객체이므로, 각 ticker가 업데이트될 때마다 계좌도 업데이트
    Object.values(tickerData).forEach((data: TickerData) => {
      setBankAccounts(prevAccounts => updateAccountsWithTickerData(prevAccounts, data));
    });
  }, [tickerData]);

  const handleAddAccount = () => {
    setModalData(null);
    setIsManageModalOpen(true);
  };

  const closeManageModal = () => {
    setIsManageModalOpen(false);
  };

  const handleModalSubmit = (data: { depositorName: string; currency: string; address: string; tag: string }) => {
    console.log("모달 제출 데이터:", data);
    setIsManageModalOpen(false);
  };

  return (
    <div className="flex-1 p-8 overflow-auto bg-gray-50">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <SubHeader  onAdd={handleAddAccount} />
        <AccountInfoComponent
          title="계좌 정보"
          backPath="/dashboard/account"
          accounts={bankAccounts}
          tickerData={tickerData}
        />
        <AccountRegistrationModal
          isOpen={isManageModalOpen}
          onClose={closeManageModal}
          onSubmit={handleModalSubmit}
          initialData={ modalData ? {
            bankName: modalData.bankName,
            addressResponse: {
              currency: modalData.coinCurrency,
              address: modalData.coinAccount,
              tag: modalData.tagAccount || null,
              status: "ACTIVE"
            }
          } : undefined }
        />
      </div>
    </div>
  );
}