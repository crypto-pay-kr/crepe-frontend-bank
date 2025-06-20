"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, ChevronDown } from "lucide-react";
import { useTickerData } from "@/hooks/useTickerData";
import { toast } from "react-toastify";
import { coinMapping } from "@/types/Coin";
import { createBankToken, recreateBankToken } from "@/api/tokenApi";
import { PortfolioItem, PortfolioCoin, RequestDTO } from "@/types/Token";
import { TokenConfirmModal } from "./TokenConfirmModal";

interface TokenRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  requestData?: any;
  isAddMode: boolean;
  availableCurrencies?: string[];
}

export default function TokenRequestModal({
  isOpen,
  onClose,
  onSubmit,
  requestData,
  isAddMode,
  availableCurrencies = [],
}: TokenRequestModalProps) {
  if (!isOpen) return null;

  const tickerData = useTickerData();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [selectedToken, setSelectedToken] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");

  // readOnly 모드인지 확인
  const isReadOnlyMode = !isAddMode && requestData;

  // 초기 상태 정의
  const [formData, setFormData] = useState(() => {
    if (isReadOnlyMode) {
      return {
        tokenName: requestData.tokenName || "",
        currency: requestData.currency || "",
        changeReason: requestData.changeReason || "",
        totalValue: "",
        portfolio:
          requestData.portfolioDetails?.map((item: any) => ({
            coinName: item.coinName,
            currency: item.coinCurrency,
            currentAmount: item.updateAmount, // 기존(읽기 전용)
            newAmount: "", // 새로 수정 가능
          })) || [],
      };
    }
    // isAddMode
    return {
      tokenName: "",
      currency: "",
      changeReason: "",
      totalValue: "",
      portfolio: [],
    };
  });

  useEffect(() => {
    const total = formData.portfolio.reduce((acc: number, item: any) => {
      const price = tickerData[`KRW-${item.currency}`]?.trade_price || 0;
      const amount = parseFloat(item.newAmount || item.amount || item.currentAmount || "0"); // 모든 경우 처리
      return acc + price * amount;
    }, 0);
  
    setFormData((prev) => ({ ...prev, totalValue: total.toString() }));
  }, [formData.portfolio, tickerData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 새로 입력할 newAmount 변경 핸들러
const handleNewAmountChange = (index: number, value: string) => {
  console.log("handleNewAmountChange called. index:", index, "newAmount:", value); // <-- 로그 추가
  setFormData((prev) => {
    const updated = [...prev.portfolio];
    updated[index] = { ...updated[index], newAmount: value };
    console.log("Updated portfolio:", updated); // <-- 로그 추가
    return { ...prev, portfolio: updated };
  });
};

  const handleRemoveCurrency = (index: number) => {
    setFormData((prev) => {
      const updatedPortfolio = [...prev.portfolio];
      updatedPortfolio.splice(index, 1); // 해당 인덱스의 항목 제거
      return { ...prev, portfolio: updatedPortfolio };
    });
  };
  const handleAddTokenToPortfolio = () => {
    console.log("handleAddTokenToPortfolio called. selectedToken:", selectedToken, "tokenAmount:", tokenAmount); // <-- 로그 추가
    if (selectedToken && tokenAmount) {
      const newCoin = {
        currency: selectedToken,
        newAmount: tokenAmount, // newAmount로 추가
      };
      setFormData((prev) => {
        const updatedPortfolio = [...prev.portfolio, newCoin];
        console.log("After adding newCoin:", updatedPortfolio); // <-- 로그 추가
        return {
          ...prev,
          portfolio: updatedPortfolio,
        };
      });
      setShowTokenInput(false);
      setSelectedToken("");
      setTokenAmount("");
    } else {
      toast.error("토큰과 수량을 입력해주세요.");
    }
  };

  const handleSubmit = () => {
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    try {
      if (isReadOnlyMode) {
        // 수정(재요청) 모드: 기존 데이터 + newAmount -> recreateBankToken
        const requestDTO = {
          tokenName: formData.tokenName,
          tokenCurrency: formData.currency,
          changeReason: formData.changeReason,
          portfolioCoins: formData.portfolio.map((item: any) => ({
            coinName: coinMapping[item.currency] || item.currency, // coinMapping 사용
            currency: item.currency,
            amount: parseFloat(item.newAmount || item.currentAmount || "0"),
            currentPrice: tickerData[`KRW-${item.currency}`]?.trade_price || 0,
          })),
        };


        // 새로운 코인도 포함되도록 확인
        console.log("재요청 DTO:", requestDTO);

        const result = await recreateBankToken(requestDTO);
        console.log("재요청 성공:", result);
        onSubmit(requestDTO);
      } else {
        // 새 생성 모드
        const requestDTO: RequestDTO = {
          tokenName: formData.tokenName,
          tokenCurrency: formData.currency,
          changeReason: formData.changeReason,
          portfolioCoins: formData.portfolio.map((item: PortfolioItem): PortfolioCoin => ({
            coinName: coinMapping[item.currency] || item.currency,
            currency: item.currency,
            amount: parseFloat(item.newAmount ?? item.amount ?? "") || 0, // newAmount 우선 사용
            currentPrice: tickerData[`KRW-${item.currency}`]?.trade_price || 0,
          })),
        };

        console.log("토큰 생성 DTO:", requestDTO);
        await createBankToken(requestDTO);
        onSubmit(requestDTO);
      }
      setShowConfirmModal(false);
      onClose();
    } catch (err: any) {
      console.error("토큰 요청 오류:", err);
      toast.error(err.message || "토큰 요청에 실패했습니다.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
          {/* 고정 헤더 */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-pink-500 to-rose-400 rounded-t-lg flex-shrink-0">
            <h2 className="text-lg font-medium text-white">
              {isAddMode ? "토큰 추가" : "토큰 상세 확인"}
            </h2>
            <button onClick={onClose} className="text-white hover:text-pink-100 transition-colors">
              <X size={24} />
            </button>
          </div>
          
          {/* 스크롤 가능한 내용 영역 */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 토큰 이름 / 심볼 */}
            <div className="mb-6">
              <label className="block text-sm text-gray-700 font-medium mb-2">토큰 이름</label>
              <input
                type="text"
                name="tokenName"
                value={formData.tokenName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                readOnly={isReadOnlyMode}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm text-gray-700 font-medium mb-2">토큰 심볼</label>
              <input
                type="text"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                readOnly={isReadOnlyMode}
              />
            </div>
            {/* 변경 사유 (읽기 전용 모드일 때만) */}
            {!isAddMode && (
              <div className="mb-6">
                <label className="block text-sm text-gray-700 font-medium mb-2">변경 사유</label>
                <input
                  type="text"
                  name="changeReason"
                  value={formData.changeReason}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, changeReason: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            )}
            {/* 포트폴리오 */}
            <div className="mb-6">
              <label className="block text-sm text-gray-700 font-medium mb-2">포트폴리오 구성</label>
              <div className="space-y-2">
                {formData.portfolio.map((item: PortfolioItem, index: number) => (
                  <div
                    key={index}
                    className="border border-pink-200 bg-gradient-to-r from-pink-50/50 to-rose-50/50 rounded-md p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <span className="w-16 text-gray-700 font-medium">{item.currency}</span>
                      {/* currentAmount(읽기 전용) */}
                      {item.currentAmount !== undefined && (
                        <span className="mx-2 text-gray-700">{item.currentAmount}</span>
                      )}
                      <span className="mx-2 text-pink-500 font-bold">→</span>
                      {/* newAmount 입력 가능 */}
                      <input
                        type="text"
                        className="border border-pink-200 rounded-md p-1 w-20 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                        value={item.newAmount ?? item.amount ?? ""}
                        onChange={(e) => handleNewAmountChange(index, e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveCurrency(index)}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              {showTokenInput ? (
                <div className="border border-pink-200 bg-gradient-to-r from-pink-50/30 to-rose-50/30 rounded-md p-3 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative flex-1">
                      <select
                        value={selectedToken}
                        onChange={(e) => setSelectedToken(e.target.value)}
                        className="w-full appearance-none border border-pink-200 rounded-md p-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                      >
                        <option value="">토큰 선택</option>
                        {/* availableCurrencies에 따라 동적으로 옵션 생성 */}
                        {["XRP", "SOL", "USDT"].map((c) => {
                          const isDisabled = !availableCurrencies.includes(c);
                          return (
                            <option key={c} value={c} disabled={isDisabled}>
                              {isDisabled ? `${coinMapping[c] || c} (사용 불가)` : coinMapping[c] || c}
                            </option>
                          );
                        })}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <ChevronDown size={16} className="text-pink-500" />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      placeholder="수량"
                      className="flex-1 border border-pink-200 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowTokenInput(false)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleAddTokenToPortfolio}
                      className="px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-md text-sm shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                      추가
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowTokenInput(true)}
                  className="w-full border border-pink-200 bg-gradient-to-r from-pink-50/30 to-rose-50/30 rounded-md p-3 flex items-center justify-center text-pink-500 hover:from-pink-50 hover:to-rose-50 transition-all"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
            {/* 실시간 시세 데이터 예시 */}
            <div className="mb-4 p-4 bg-gradient-to-r from-pink-50/30 to-rose-50/30 border border-pink-100 rounded h-40 overflow-y-auto">
              <h3 className="font-bold mb-2 text-gray-700">실시간 시세 데이터</h3>
              {Object.entries(tickerData).map(([code, data]) => (
                <div key={code} className="mb-2 text-gray-700">
                  <span className="font-medium text-gray-800">{code}:</span>{" "}
                  {data.trade_price.toLocaleString()} KRW
                  <span
                    className={`ml-2 font-medium ${data.change === "RISE"
                      ? "text-red-500"
                      : data.change === "FALL"
                        ? "text-blue-500"
                        : ""
                      }`}
                  >
                    ({data.signed_change_rate.toFixed(2)}%)
                  </span>
                </div>
              ))}
            </div>
            {/* totalValue 입력 출력 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">예상 토큰 가치(현재 기준)</label>
              <input
                type="text"
                name="totalValue"
                value={Number(formData.totalValue).toLocaleString()}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="토큰 가치"
              />
            </div>
          </div>

          {/* 고정 버튼 영역 */}
          <div className="p-6 pt-0 flex-shrink-0">
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-md font-medium flex-1 shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                {isReadOnlyMode ? "재요청" : "생성하기"}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-md font-medium flex-1 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
      {showConfirmModal && (
        <TokenConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}