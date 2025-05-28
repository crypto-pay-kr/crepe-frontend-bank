'use client';
import { useState, useEffect } from "react";
import BankBalanceSection from "@/components/bank/bank-balance-section";
import { fetchBankInfoDetail } from "@/api/bankInfoApi";
import BankHeader from "@/components/common/BankHeader";
import BankInfoSection from "@/components/bank/BankInfoSection";
import { useBankContext } from "@/context/BankContext";
import { BankInfoDetail, GetAllBalanceResponse } from "@/types/Bank";
import {getTokenHistory, getTokenInfo, getTokenPrice, getTokenVolume} from "@/api/tokenApi";
import {useTickerData} from "@/hooks/useTickerData";
import type { TokenInfoResponse, PortfolioDetail } from "@/types/Token";
import CryptoChart from "@/components/common/CryptoChart";

// 차트용 캔들 데이터
interface CandleData {
  time: string;
  open: number;
  close: number;
  high: number;
  low: number;
  isUp: boolean;
}

// 초기 데이터 생성 함수
const generateDummyData = (): CandleData[] => {
  const data: CandleData[] = [];

  for (let i = 0; i < 25; i++) {
    const hour = Math.floor(i / 5) + 13;
    const minute = (i % 5) * 10;
    const time = `${hour}:${minute.toString().padStart(2, '0')}`;

    const baseValue = 100 + Math.random() * 30;
    const open = baseValue;
    const close = baseValue + (Math.random() - 0.5) * 8;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;

    data.push({
      time,
      open,
      close,
      high,
      low,
      isUp: close > open
    });
  }

  return data;
};

// 각 섹션용 더미 데이터
const tokenPriceData = generateDummyData();
const capitalTrendData = generateDummyData();
const bankBalanceData = generateDummyData();
const tokenVolumeData = generateDummyData();


// 은행 대시보드 상세 페이지 컴포넌트
export default function BankDetailPage() {
  const { bankName, setBankName } = useBankContext();
  const [tokenRequests, setTokenRequests] = useState<any[]>([]);
  const [bankInfo, setBankInfo] = useState<BankInfoDetail| null>(null);
  const tickerData = useTickerData();
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<GetAllBalanceResponse['bankTokenInfo']>([]);
  const [capitalInKRW, setCapitalInKRW] = useState<number | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfoResponse | null>(null);
  const [tokenVolume, setTokenVolume] = useState<number | null>(null);
  const [prices, setPrices] = useState<{ [key: string]: number }>({
    "KRW-SOL": 0,
    "KRW-XRP": 0,
    "KRW-USDT": 0,
  });
  // 은행 정보를 가져오는 함수
  const loadBankInfo = async () => {
    try {
      const data = await fetchBankInfoDetail();
      setBankInfo(data);
      setBankName(data.bankName);
    } catch (error) {
      console.error("Failed to fetch bank info:", error);
    }
  };
  useEffect(() => {
    loadBankInfo();
  }, []);
  useEffect(() => {
    console.log("Current bankName:", bankName);
  }, [bankName]);

  // 1) 데이터 호출 함수
  const fetchTokenData = async () => {
    try {
      const data = await getTokenHistory(0, 10);
      const sortedData = data.sort(
          (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTokenRequests(sortedData);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchTokenData();
  }, []);


  // 토큰 정보 조회
  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        const info = await getTokenInfo();
        setTokenInfo(info);
      } catch (err) {
        console.error("토큰 정보 가져오기 실패", err);
      }
    };
    fetchTokenInfo();
  }, []);

  // 토큰 KRW 변환
  useEffect(() => {
    if (!tokenInfo || !tickerData) return;

    const totalKRW = tokenInfo.portfolios.reduce((sum: number, p: any) => {
      const price = tickerData[`KRW-${p.currency}`]?.trade_price ?? 0;
      const amount = parseFloat(p.amount ?? 0);
      return sum + amount * price;
    }, 0);

    setCapitalInKRW(Math.floor(totalKRW));
  }, [tokenInfo, tickerData]);

  // 토큰 시세 조회
  useEffect(() => {
    const loadPrice = async () => {
      try {
        const data = await getTokenPrice();
        console.log("받아온 tokenPrice:", data);
        setTokenPrice(Number(data));
      } catch (error) {
        console.error("Failed to fetch token price", error);
      }
    };
    loadPrice();
  }, []);

  // 토큰 거래량 조회
  useEffect(() => {
    const fetchVolume = async () => {
      try {
        const volume = await getTokenVolume();
        setTokenVolume(Number(volume));
      } catch (err) {
        console.error("토큰 거래량 조회 실패", err);
      }
    };
    // 즉시 한 번 호출
    fetchVolume();

    const interval = setInterval(() => {
      fetchVolume();
    }, 5000); // 30분에 1번 api 재호출 3600000

    return () => clearInterval(interval);
  }, []);


  // 차트 데이터 조회
  const [capitalChartData, setCapitalChartData] = useState<CandleData[]>(generateDummyData());
  const [tokenPriceChartData, setTokenPriceChartData] = useState<CandleData[]>(generateDummyData());
  const [tokenVolumeChartData, setTokenVolumeChartData] = useState<CandleData[]>(generateDummyData());

  // 공통적으로 사용하는 캔들 생성 함수
  const updateChartData = (
      prevData: CandleData[],
      newValue: number,
  ): CandleData[] => {
    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;

    const prevClose = prevData[prevData.length - 1]?.close ?? newValue;
    const open = prevClose;
    const close = newValue;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;

    const newCandle: CandleData = {
      time,
      open,
      close,
      high,
      low,
      isUp: close >= open,
    };

    return [...prevData.slice(-24), newCandle];
  };

  useEffect(() => {
    if (capitalInKRW === null) return;
    setCapitalChartData((prev) => updateChartData(prev, capitalInKRW));
  }, [capitalInKRW]);

  useEffect(() => {
    if (tokenVolume === null) return;
    setTokenVolumeChartData((prev) => updateChartData(prev, tokenVolume));
  }, [tokenVolume]);

  useEffect(() => {
    if (tokenPrice === null) return;
    setTokenPriceChartData((prev) => updateChartData(prev, tokenPrice));
  }, [tokenPrice]);


  if (!bankInfo) {
    return <div>Loading...</div>;
  }


  return (
      <div className="flex h-screen bg-gray-100">
        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4">
          <BankHeader bankName={bankInfo.bankName}/>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BankInfoSection
                bankName={bankInfo?.bankName}
                bankImageUrl={bankInfo?.bankImageUrl}
                bankPhoneNumber={bankInfo?.bankPhoneNumber}
                bankEmail={bankInfo?.bankEmail}
                bankCode={bankInfo?.bankCode}
                onPhoneChange={loadBankInfo}
            />


            {/* Token Price Section */}
            <div className="bg-white p-4 rounded-lg shadow-sm space-y-1">
              <h3 className="text-base font-medium text-gray-700">토큰 현재가</h3>
              {tokenPrice != null ? (
                  <span className="text-base font-semibold text-gray-900">
                  {tokenPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                    {tokenRequests[0]?.currency || ""}
                </span>
              ) : (
                  <span className="text-sm text-gray-400">가격 없음</span>
              )}

              {/* Chart using dynamic data */}
              <div className="w-full h-32 relative mt-4">
                <CryptoChart data={tokenPriceChartData} />
              </div>
            </div>

            {/* Asset Balance Section */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-base font-medium text-gray-700">자본금 추이</h2>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-full text-base font-semibold text-gray-900">
                    {capitalInKRW !== null
                        ? `${capitalInKRW.toLocaleString()} KRW`
                        : "불러오는 중..."}
                  </div>
                </div>
              </div>

              {/* Chart using dynamic data */}
              <div className="w-full h-32 relative mt-4">
                <CryptoChart data={capitalChartData} />
              </div>
            </div>

            {/* Bank Balance Section */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <BankBalanceSection  />
            </div>

            {/* Token Value Section */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-medium text-gray-700">토큰 거래량</h2>
              </div>
              <div className="text-base font-semibold text-gray-900">
                {tokenVolume !== null
                    ? `${tokenVolume.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${tokenRequests[0]?.currency || ""}`
                    : "불러오는 중..."}
              </div>

              {/* Chart using dynamic data */}
              <div className="w-full h-32 relative mt-4">
                <CryptoChart data={tokenVolumeChartData} />
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
