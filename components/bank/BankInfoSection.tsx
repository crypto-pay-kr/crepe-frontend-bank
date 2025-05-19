import { useState } from "react";
import Link from "next/link";
import { changeBankPhone } from "@/api/bankInfoApi";



interface BankInfoSectionProps {
  bankName?: string;
  bankImageUrl?: string;
  bankPhoneNumber?: string;
  bankEmail?: string;
  bankCode?: string;
  onPhoneChange?: () => void; 
}

export default function BankInfoSection({
  bankName = "",
  bankImageUrl = "",
  bankPhoneNumber = "",
  bankEmail = "",
  bankCode = "",
  onPhoneChange = () => {}, 
}: BankInfoSectionProps) {

  const [phoneInput, setPhoneInput] = useState(bankPhoneNumber);
  const [isEditing, setIsEditing] = useState(false);

  const handleChangePhoneClick = async () => {
    try {
      const result = await changeBankPhone(phoneInput);
      console.log(result);
      alert("연결 번호가 변경되었습니다.");
      setIsEditing(false); // 수정 모드 종료
      onPhoneChange(); // 부모 컴포넌트에 변경 알림
    } catch (error) {
      console.error(error);
      alert("번호 변경 실패");
    }
  };

  return (
    <>
      {/* Bank Info Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-md font-medium text-gray-700">은행 CI 이미지 정보</h2>
          <button className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            수정하기
          </button>
        </div>
        <div className="w-full h-40 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
          {bankImageUrl ? (
            // 이미지가 있으면 로고 표시
            <img
              src={bankImageUrl}
              alt={bankName}
              className="h-32 object-contain"
            />
          ) : (
            // 이미지가 없으면 은행 이름 출력
            <div className="w-32 h-32 bg-white rounded-md flex items-center justify-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                {bankName}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Info Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-md font-medium text-gray-700 mb-4">은행 정보</h2>
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">대표 전화</div>
          <div className="flex">
            <input
              type="text"
              value={phoneInput}
              readOnly={!isEditing}       
              onFocus={() => setIsEditing(true)} 
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-10/12 p-2 border text-gray-500 border-gray-300 rounded-lg"
            />
            <button
              onClick={handleChangePhoneClick}
              className="w-1/6 ml-1 px-3 py-1 bg-blue-500 text-white rounded-md"
            >
              변경
            </button>
          </div>
        </div>


        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">은행 이메일</div>
            <div className="flex">
              <input
                type="text"
                value={bankEmail}
                readOnly
                className="w-full p-2 border text-gray-500 border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">은행 코드</div>
            <div className="flex">
              <input
                type="text"
                value={bankCode}
                readOnly
                className="w-full p-2 border text-gray-500 border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/dashboard/account" className="text-xs text-gray-500">
            <button className="w-full p-3 text-left border border-gray-300 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors mb-1">
              <span>은행 계좌 관리</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-gray-400"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}