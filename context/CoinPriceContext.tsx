import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchCoinPrices } from "@/api/coinApi";

interface CoinPriceContextValue {
  coinPrices: Record<string, number>;
  refreshPrices: () => void;
}

const CoinPriceContext = createContext<CoinPriceContextValue | undefined>(undefined);

export const CoinPriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coinPrices, setCoinPrices] = useState<Record<string, number>>({});

  const refreshPrices = async () => {
    try {
      const prices = await fetchCoinPrices();
      setCoinPrices(prices);
    } catch (error) {
      console.error("Failed to fetch coin prices:", error);
    }
  };

  useEffect(() => {
    refreshPrices(); // 초기 로드 시 시세 데이터 가져오기
    const interval = setInterval(refreshPrices, 30000); // 30초마다 시세 갱신
    return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 정리
  }, []);

  return (
    <CoinPriceContext.Provider value={{ coinPrices, refreshPrices }}>
      {children}
    </CoinPriceContext.Provider>
  );
};

export const useCoinPrices = () => {
  const context = useContext(CoinPriceContext);
  if (!context) {
    throw new Error("useCoinPrices must be used within a CoinPriceProvider");
  }
  return context;
};