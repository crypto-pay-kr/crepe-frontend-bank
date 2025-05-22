"use client";
import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { getTokenHistory } from "@/api/tokenApi";
import TokenRequestModal from "@/components/bank/TokenRequestModal";
import SubHeader from "@/components/common/SubHeader";

export default function BankTokenRequests() {
  const [tokenRequests, setTokenRequests] = useState<any[]>([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedPortfolioDetails, setSelectedPortfolioDetails] = useState<any[]>([]);
  const [selectedTotalSupplyAmount, setSelectedTotalSupplyAmount] = useState(0);

  useEffect(() => {
    getTokenHistory(0, 10)
      .then((data) => {
        const sortedData = data.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTokenRequests(sortedData);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleConfirm = (request: any) => {
    // 요청된 전체 데이터 셋을 그대로 보관
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  const handleApproveRequest = () => {
    console.log(`${selectedBank} 승인 처리`);
    // 실제 구현에서는 API 호출 등을 통해 승인 처리
    setIsDetailsModalOpen(false);
  };

  const handleAddToken = () => {
    setSelectedPortfolioDetails([]); // 신규 추가는 빈 포트폴리오로 설정
    setSelectedTotalSupplyAmount(0); // 신규 추가는 총 공급량 0으로 설정
    setIsAddTokenModalOpen(true);
  };

  return (
    <div className="flex-1 h-screen p-8 overflow-auto bg-gray-50">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <SubHeader bankName="" onAdd={handleAddToken} />
        {/* 헤더 섹션 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">은행 토큰 요청 수락</h1>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="p-6 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="은행명 검색"
                className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-lg w-[300px] focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all"
              />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {/* 토큰 요청 테이블 */}
        <div className="px-6 pb-6">
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full table-fixed">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left font-bold text-gray-500 text-sm w-1/8">종류</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-500 text-sm w-1/6">토큰 정보</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-500 text-sm w-1/5">요청 날짜</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-500 text-sm w-1/5">변경 사유</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-500 text-sm w-1/5">반려 사유</th>
                  <th className="py-3 px-4 text-center font-bold text-gray-500 text-sm w-1/6">상태</th>
                  <th className="py-3 px-4 text-center font-bold text-gray-500 text-sm w-1/6">관리</th>
                </tr>
              </thead>
              <tbody>
                {tokenRequests.map((request, index) => (
                  <tr key={request.tokenHistoryId || index} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-gray-600 w-1/6">{request.requestType}</td>
                    <td className="py-4 px-4 text-gray-800 w-1/4">
                      {`${request.tokenName} (${request.currency})`}
                    </td>
                    <td className="py-4 px-4 text-gray-600 w-1/5">
                      {new Date(request.createdAt).toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-4 text-gray-600 w-1/5">{request.changeReason || " - "}</td>
                    <td className="py-4 px-4 text-gray-600 w-1/5">{request.rejectReason || " - "}</td>
                    <td className="py-4 px-4 text-center text-gray-600 w-1/6">{request.status}</td>
                    <td className="py-4 px-4 text-center w-1/6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() =>
                            handleConfirm(request)
                          }
                          className="px-3 py-1.5 rounded-md text-sm font-medium border border-pink-500 bg-pink-500 text-white hover:bg-pink-600 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check size={14} /> 상세 확인
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TokenRequestModal
        isOpen={isDetailsModalOpen || isAddTokenModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setIsAddTokenModalOpen(false);
        }}
        onSubmit={handleApproveRequest}
        requestData={!isAddTokenModalOpen ? selectedRequest : undefined}
        isAddMode={isAddTokenModalOpen}
      />
    </div>
  );
}