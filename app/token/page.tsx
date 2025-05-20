"use client"
import { useState, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight, X, Check } from "lucide-react"
import { getTokenHistory } from "@/api/tokenApi"
import RejectionReasonModal from "@/components/token/rejection-reason-modal"
import TokenRequestModal from "@/components/bank/TokenRequestModal"
import SubHeader from "@/components/common/SubHeader"


export default function BankTokenRequests() {

  const [tokenRequests, setTokenRequests] = useState<any[]>([]);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState("")
  const [selectedRequestType, setSelectedRequestType] = useState<"view" | "new">("view")

  useEffect(() => {
    getTokenHistory(0, 10)
      .then((data) => {
        setTokenRequests(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleReject = (bankName: string, requestType: "view" | "new") => {
    // 모달 열기 전에 선택된 은행과 요청 종류 저장
    setSelectedBank(bankName)
    setSelectedRequestType(requestType)
    setIsRejectionModalOpen(true)
  }

  const handleConfirmReject = (reason: string) => {
    console.log(`${selectedBank}의 ${selectedRequestType} 반려 처리: ${reason}`)
    // 실제 구현에서는 API 호출 등을 통해 반려 처리
    setIsRejectionModalOpen(false)
  }

  const handleConfirm = (bankName: string, requestType: "view" | "new") => {
    // 요청 확인 버튼 클릭 시 상세 모달 표시
    setSelectedBank(bankName)
    setSelectedRequestType(requestType)
    setIsDetailsModalOpen(true)
  }

  const handleApproveRequest = () => {
    console.log(`${selectedBank}의 ${selectedRequestType} 승인 처리`)
    // 실제 구현에서는 API 호출 등을 통해 승인 처리
    setIsDetailsModalOpen(false)
  }

  const handleAddToken = () => {
    setIsAddTokenModalOpen(true); // 추가된 핸들러
  };

  return (
    <div className="flex-1 h-screen p-8 overflow-auto bg-gray-50">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <SubHeader bankName="신한은행" onAddAccount={handleAddToken} />
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
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left font-bold text-gray-500 text-sm">토큰 정보</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-500 text-sm">요청 날짜</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-500 text-sm w-40">변경 사유</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-500 text-sm w-40">반려 사유</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-500 text-sm">상태</th>
                  <th className="py-3 px-4 text-middle font-bold text-gray-500 text-sm">관리</th>
                </tr>
              </thead>
              <tbody>
                {tokenRequests.map((request, index) => (
                  <tr key={request.tokenHistoryId || index} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-gray-800">
                      {`${request.tokenName} (${request.currency})`}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(request.createdAt).toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-4 text-gray-600">{request.changeReason || " - "}</td>
                    <td className="py-4 px-4 text-gray-600">{request.rejectReason || " - "}</td>
                    <td className="py-4 px-4 text-gray-600">{request.requestType}</td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleReject(request.bank, request.type)}
                          className="px-3 py-1.5 rounded-md text-sm font-medium border  border-gray-300 text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <X size={14} /> 취소
                        </button>

                        <button
                          onClick={() => handleConfirm(request.bank, request.type)}
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

          {/* 페이지네이션 */}
          <div className="flex flex-col items-center mt-6 gap-4">
            <nav className="flex items-center justify-center gap-1">
              <button className="w-9 h-9 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors">
                <ChevronLeft size={18} />
              </button>

              <button className="w-9 h-9 flex items-center justify-center rounded-md bg-pink-500 text-white font-medium">
                1
              </button>

              <button className="w-9 h-9 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors">
                <ChevronRight size={18} />
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* 반려 사유 모달 */}
      <RejectionReasonModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={handleConfirmReject}
        targetName={selectedBank}
      />

      {/* 요청 상세 모달 */}
      <TokenRequestModal
        isOpen={isDetailsModalOpen || isAddTokenModalOpen}
        onClose={() => {
          if (isDetailsModalOpen) setIsDetailsModalOpen(false);
          if (isAddTokenModalOpen) setIsAddTokenModalOpen(false);
        }}
        onSubmit={handleApproveRequest}
        requestType={isAddTokenModalOpen ? "new" : selectedRequestType}
        portfolioDetails={
          isAddTokenModalOpen
            ? []
            : tokenRequests.find((request) => request.bankName === selectedBank)
              ?.portfolioDetails || []
        }
        totalSupplyAmount={
          isAddTokenModalOpen
            ? 0
            : tokenRequests.find((request) => request.bankName === selectedBank)
              ?.totalSupplyAmount || 0
        }
      />
    </div>
  )
}