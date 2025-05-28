'use client';

import { useEffect, useRef, useState } from "react";
import { getRemainingCoinBalance, RemainingCoinBalanceResponse } from "@/api/bankAccountApi";

// 숫자 포맷팅 유틸
function formatNumber(num: number): string {
  return num.toLocaleString();
}

export default function BankBalanceSection() {
  const [remainingCoins, setRemainingCoins] = useState<RemainingCoinBalanceResponse[]>([]);

  // 각 코인 API 데이터 찾기 (없을 경우 대비, 기본값 넣기)
  const solData = remainingCoins.find((item) => item.currency === "SOL") || {
    coinName: "솔라나",
    currency: "SOL",
    publishedBalance: 0,
    accountBalance: 0,
    remainingBalance: 0,
  };
  const xrpData = remainingCoins.find((item) => item.currency === "XRP") || {
    coinName: "리플",
    currency: "XRP",
    publishedBalance: 0,
    accountBalance: 0,
    remainingBalance: 0,
  };
  const usdtData = remainingCoins.find((item) => item.currency === "USDT") || {
    coinName: "테더",
    currency: "USDT",
    publishedBalance: 0,
    accountBalance: 0,
    remainingBalance: 0,
  };

  // 프로그래스바 % 계산 (잔여 / 발행 * 100)
  const solRatio = solData.publishedBalance
    ? (solData.remainingBalance / solData.publishedBalance) * 100
    : 0;
  const xrpRatio = xrpData.publishedBalance
    ? (xrpData.remainingBalance / xrpData.publishedBalance) * 100
    : 0;
  const usdtRatio = usdtData.publishedBalance
    ? (usdtData.remainingBalance / usdtData.publishedBalance) * 100
    : 0;

  useEffect(() => {
    // 컴포넌트 마운트 시 API 호출
    getRemainingCoinBalance()
      .then((response) => {
        setRemainingCoins(response);
      })
      .catch((err) => console.error("잔여 코인 조회 실패:", err));
  }, []);

  // 개별 코인 컴포넌트
  const CoinBalance = ({
    coinData,
    ratio,
    colors
  }: {
    coinData: any,
    ratio: number,
    colors: { main: string, light: string, text: string, bg: string }
  }) => (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${colors.bg}`}></div>
          <span className="font-semibold text-gray-900 text-sm">
            {coinData.coinName} ({formatNumber(coinData.publishedBalance)})
          </span>
          <span className="text-xs text-gray-500 font-mono">{coinData.currency}</span>
        </div>
        <div className={`text-xs font-medium px-2 py-0.5 rounded-md ${colors.light} ${colors.text}`}>
          {ratio.toFixed(2)}% 잔여
        </div>
      </div>

      {/* 프로그래스바 */}
      <div className="relative">
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          {/* 사용된 부분 (어두운 색) */}
          <div
            style={{ width: `${100 - ratio}%` }}
            className={`absolute left-0 top-0 h-full ${colors.main} transition-all duration-700 ease-out`}
          />
          {/* 잔여 부분 (밝은 색) */}
          <div
            style={{
              width: `${ratio}%`,
              left: `${100 - ratio}%`
            }}
            className={`absolute top-0 h-full ${colors.light} transition-all duration-700 ease-out`}
          />
          {/* 중앙 구분선 */}
          {ratio > 5 && ratio < 95 && (
            <div
              style={{ left: `${100 - ratio}%` }}
              className="absolute top-0 w-0.5 h-full bg-white opacity-60"
            />
          )}
        </div>

        {/* 하단 라벨 */}
        <div className="flex justify-between mt-1">
          <div className="text-xs text-gray-600">
            사용: {formatNumber(coinData.accountBalance)}
          </div>
          <div className={`text-xs font-medium ${colors.text}`}>
            잔여: {formatNumber(coinData.remainingBalance)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">

      <div className="space-y-6">
        {/* SOL */}
        <CoinBalance
          coinData={solData}
          ratio={solRatio}
          colors={{
            main: 'bg-rose-500', // 진한 장미색
            light: 'bg-rose-200', // 밝은 장미색
            text: 'text-rose-500',
            bg: 'bg-rose-500'
          }}
        />

        {/* XRP */}
        <CoinBalance
          coinData={xrpData}
          ratio={xrpRatio}
          colors={{
            main: 'bg-gray-500', // 진한 회색
            light: 'bg-gray-200', // 밝은 회색
            text: 'text-gray-500',
            bg: 'bg-gray-500'
          }}
        />

        {/* USDT */}
        <CoinBalance
          coinData={usdtData}
          ratio={usdtRatio}
          colors={{
            main: 'bg-green-600', // 진한 초록색
            light: 'bg-green-200', // 밝은 초록색
            text: 'text-green-600',
            bg: 'bg-green-600'
          }}
        />
      </div>
      {/* 요약 통계 */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500 mb-1">총 발행</div>
            <div className="font-semibold text-gray-900">
              {formatNumber(solData.publishedBalance + xrpData.publishedBalance + usdtData.publishedBalance)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">총 사용</div>
            <div className="font-semibold text-gray-900">
              {formatNumber(solData.accountBalance + xrpData.accountBalance + usdtData.accountBalance)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">총 잔여</div>
            <div className="font-semibold text-green-600">
              {formatNumber(solData.remainingBalance + xrpData.remainingBalance + usdtData.remainingBalance)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}