"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown, Plus } from "lucide-react";
import { TokenConfirmModal } from "./TokenConfirmModal";
import { createBankToken } from "@/api/tokenApi";
import { useTickerData } from "@/hooks/useTickerData";
import { coinMapping } from "@/types/Coin";


interface TokenRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    requestType: "new" | "view";
    portfolioDetails: {
        coinName: string;
        coinCurrency: string;
        prevAmount: number | null;
        prevPrice: number | null;
        updateAmount: number;
        updatePrice: number;
    }[];
    totalSupplyAmount: number;
}

export default function TokenRequestModal({
    isOpen,
    onClose,
    onSubmit,
    requestType,
    portfolioDetails,
    totalSupplyAmount,
}: TokenRequestModalProps) {
    if (!isOpen) return null;

    const tickerData = useTickerData();

    // formData에 bankName 포함 (기존 값들은 그대로 유지)
    const [formData, setFormData] = useState({
        requestType: requestType === "new" ? "NEW" : "UPDATE",
        tokenName: requestType === "new" ? "" : "",
        currency: requestType === "new" ? "" : "",
        // 기존 portfolio는 초기값으로 전달받은 portfolioDetails를 매핑 처리 (view인 경우)
        portfolio:
            requestType === "new"
                ? []
                : portfolioDetails.map((item) => ({
                    currency: item.coinCurrency,
                    amount: item.updateAmount.toString(),
                    price: item.updatePrice.toString(),
                })),
        estimatedValue: "1.23KRW",
        totalValue: "23,231,123,123,230KRW",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [selectedToken, setSelectedToken] = useState("");
    const [tokenAmount, setTokenAmount] = useState("");

    // 사용자가 토큰 추가 버튼을 눌렀을 때,
    // 선택한 토큰(selectedToken)에 대해, coinName은 coinMapping[selectedToken],
    // 수량은 tokenAmount, 현재 가격은 coinPrices[selectedToken]를 포함하도록 추가
    const handleAddTokenToPortfolio = () => {
        if (selectedToken && tokenAmount) {
            const newCoin = {
                currency: selectedToken, // 예: "XRP", "SOL", "USDT"
                amount: tokenAmount, // 입력한 수량 (문자열)
                price: "-", // 기본값 그대로 유지
            };
            setFormData((prev) => ({
                ...prev,
                portfolio: [...prev.portfolio, newCoin],
            }));
            setShowTokenInput(false);
            setSelectedToken("");
            setTokenAmount("");
        }
    };

    const handleSubmit = () => {
        setShowConfirmModal(true);
    };

    const handleConfirm = async () => {
        const requestDTO = {
            tokenName: formData.tokenName,
            tokenCurrency: formData.currency,
            portfolioCoins: formData.portfolio.map((item) => {
                const mappedCoinName = coinMapping[item.currency] || item.currency;
                const currentPrice = tickerData[`KRW-${item.currency}`]?.trade_price || 0;
                return {
                    coinName: mappedCoinName,
                    amount: parseFloat(item.amount),
                    currency: item.currency,
                    currentPrice,
                };
            }),
        };

        try {
            const result = await createBankToken(requestDTO);
            console.log("토큰 생성 성공:", result);
            onSubmit(result);
        } catch (error) {
            console.error("토큰 생성 실패:", error);
        }
        setShowConfirmModal(false);
        onClose();
    };

    const handleTokenSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedToken(e.target.value);
    };

    const handleTokenAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTokenAmount(e.target.value);
    };

    const handleAddToken = () => {
        setShowTokenInput(true);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
                <div className="bg-white rounded-lg w-full max-w-lg">
                    <div className="flex justify-between items-center p-4 bg-black">
                        <h2 className="text-lg font-medium text-[#F47C98]">토큰 생성</h2>
                        <button onClick={onClose} className="text-[#F47C98]">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="mb-6">
                            <label className="block text-sm text-gray-700 font-medium mb-2">요청 정보</label>
                            <div className="mb-4">
                                <button className="bg-blue-900 text-white px-6 py-2 rounded-md text-gray-500">
                                    {requestType === "new" ? "신규" : "변경"}
                                </button>
                            </div>
                        </div>
                        {requestType === "new" && (
                            <>
                                <div className="mb-6">
                                    <label className="block text-sm text-gray-700 font-medium mb-2">토큰 이름</label>
                                    <input
                                        type="text"
                                        name="tokenName"
                                        value={formData.tokenName}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md p-3 text-gray-500"
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm text-gray-700 font-medium mb-2">토큰 심볼</label>
                                    <input
                                        type="text"
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md p-3 text-gray-500"
                                    />
                                </div>
                            </>
                        )}
                        <div className="mb-6">
                            <label className="block text-sm text-gray-700 font-medium mb-2">포트폴리오 구성</label>
                            <div className="space-y-2">
                                {formData.portfolio.map((item, index) => (
                                    <div key={index} className="border border-gray-300 rounded-md p-3 flex items-center">
                                        <span className="w-16 text-gray-500">{item.currency}</span>
                                        <span className="mx-2 text-gray-500">{item.amount}</span>
                                        <span className="mx-2 text-gray-500">→</span>
                                        <span className="mx-2 text-gray-500">-</span>
                                    </div>
                                ))}
                            </div>
                            {showTokenInput ? (
                                <div className="border border-gray-300 rounded-md p-3 mt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="relative flex-1">
                                            <select
                                                value={selectedToken}
                                                onChange={handleTokenSelect}
                                                className="w-full appearance-none border border-gray-300 rounded-md p-2 pr-8 text-gray-500"
                                            >
                                                <option value="">토큰 선택</option>
                                                <option value="XRP">XRP</option>
                                                <option value="SOL">SOL</option>
                                                <option value="USDT">USDT</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            value={tokenAmount}
                                            onChange={handleTokenAmountChange}
                                            placeholder="수량"
                                            className="flex-1 border border-gray-300 rounded-md p-2 text-gray-500"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setShowTokenInput(false)}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500"
                                        >
                                            취소
                                        </button>
                                        <button
                                            onClick={handleAddTokenToPortfolio}
                                            className="px-3 py-1 bg-blue-900 text-white rounded-md text-sm text-gray-500"
                                        >
                                            추가
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleAddToken}
                                    className="w-full border border-gray-300 rounded-md p-3 flex items-center justify-center text-gray-500"
                                >
                                    <Plus size={18} />
                                </button>
                            )}
                        </div>
                        <div className="mb-4 p-4 bg-gray-100 rounded">
                            <h3 className="font-bold mb-2 text-gray-700">실시간 시세 데이터</h3>
                            {Object.entries(tickerData).map(([code, data]) => (
                                <div key={code} className="mb-2 text-black">
                                    <span className="font-medium text-black">{code}:</span> {data.trade_price.toLocaleString()} KRW
                                    <span className={`ml-2 ${data.change === 'RISE' ? 'text-red-500' : data.change === 'FALL' ? 'text-blue-500' : ''}`}>
                                        ({data.signed_change_rate.toFixed(2)}%)
                                    </span>
                                </div>
                            ))}
                        </div>


                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">예상 토큰 가치(현재 기준)</label>
                            <div className="flex items-center border border-gray-300 rounded-md p-3 mb-2">
                                <span className="flex-1 text-gray-500">{formData.estimatedValue}</span>
                                <span className="text-indigo-600">3.4% 감소</span>
                            </div>
                            <div className="border border-gray-300 rounded-md p-3 text-gray-500">
                                <span>{formData.totalValue}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-3 bg-blue-900 text-white rounded-md font-medium flex-1 text-gray-500"
                            >
                                요청 추가
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 rounded-md font-medium flex-1 text-gray-500"
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