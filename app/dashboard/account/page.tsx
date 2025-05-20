'use client'
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import AccountRegistrationModal from "@/components/account/ManageModal";
import AccountHeader from "@/components/account/AccountHeader";
import { fetchBankAccounts } from "@/api/bankAccountApi";
import AccountInfoComponent from "@/components/account/AccountInfo";
import { useWebSocket } from "@/context/WebSocketContext";

interface MappedAccount {
    bankName: string
    coinCurrency: string
    coinName: string
    depositorName: string
    coinAccount: string
    tagAccount?: string
    status: string
    balance: {
        krw: string
        crypto: string
    }
}

interface TickerData {
    type: string;
    code: string;  // 'KRW-SOL', 'KRW-USDT', 'KRW-XRP' 등
    trade_price: number;  // 현재가
    change: string;  // 전일 대비 (RISE, EVEN, FALL)
    change_rate: number;  // 변화율
    signed_change_rate: number;
    signed_change_price: number;
    timestamp: number;
}

export default function BankAccountPage() {
    // URL 쿼리 파라미터에서 은행 이름 가져오기
    const searchParams = useSearchParams();

    const { socket } = useWebSocket();

    const [bankName, setBankName] = useState<string>(""); // 은행 이름 상태
    const [bankAccounts, setBankAccounts] = useState<MappedAccount[]>([]);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false); // 모달 상태
    const [modalData, setModalData] = useState<MappedAccount | null>(null); // 초기 데이터 상태
    const [tickerData, setTickerData] = useState<Record<string, TickerData>>({});

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
                }));
                setBankAccounts(mappedData);
            })
            .catch((err) => console.error(err));
    }, []);

    // WebSocket 메시지 처리
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                // 받은 데이터를 디코딩 및 파싱
                const blob = event.data;
                const reader = new FileReader();
                
                reader.onload = () => {
                    try {
                        const data = JSON.parse(reader.result as string) as TickerData;
                        
                        // 데이터가 ticker 타입인지 확인 (필요에 따라 수정)
                        if (data.type === 'ticker') {
                            setTickerData(prev => ({
                                ...prev,
                                [data.code]: data
                            }));
                            
                            // 계좌 정보 업데이트 (코인 가격 반영)
                            updateAccountsWithTickerData(data);
                        }
                    } catch (parseError) {
                        console.error('WebSocket message parsing error:', parseError);
                    }
                };

                reader.readAsText(blob);
            } catch (error) {
                console.error('WebSocket message handling error:', error);
            }
        };

        socket.addEventListener('message', handleMessage);

        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, [socket, bankAccounts]);

    // 티커 데이터로 계좌 정보 업데이트
    const updateAccountsWithTickerData = (data: TickerData) => {
        // 코인 코드에서 통화명 추출 (예: 'KRW-SOL' -> 'SOL')
        const currency = data.code.split('-')[1];
        
        setBankAccounts(prevAccounts => 
            prevAccounts.map(account => {
                // 해당 통화의 계좌 정보만 업데이트
                if (account.coinCurrency === currency) {
                    // 잔고 수량 추출 (예: "0.5 SOL" -> 0.5)
                    const balanceParts = account.balance.crypto.split(' ');
                    const balanceAmount = parseFloat(balanceParts[0]);
                    
                    // 원화 가치 계산
                    const krwValue = balanceAmount * data.trade_price;
                    
                    return {
                        ...account,
                        balance: {
                            krw: `${krwValue.toLocaleString()} KRW`,
                            crypto: account.balance.crypto
                        }
                    };
                }
                return account;
            })
        );
    };

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

                {/* 디버깅용: 티커 데이터 표시 (개발 중 테스트로 사용하세유) */}
                
                {/* <div className="mb-4 p-4 bg-gray-100 rounded">
                    <h3 className="font-bold mb-2">실시간 시세 데이터:</h3>
                    {Object.entries(tickerData).map(([code, data]) => (
                        <div key={code} className="mb-2 text-black">
                            <span className="font-medium text-black">{code}:</span> {data.trade_price.toLocaleString()} KRW
                            <span className={`ml-2 ${data.change === 'RISE' ? 'text-red-500' : data.change === 'FALL' ? 'text-blue-500' : ''}`}>
                                ({data.signed_change_rate.toFixed(2)}%)
                            </span>
                        </div>
                    ))}
                </div>
                */}

                <AccountInfoComponent
                    title="계좌 정보"
                    backPath="/dashboard/account"
                    accounts={bankAccounts}
                    tickerData={tickerData}
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
    );
}