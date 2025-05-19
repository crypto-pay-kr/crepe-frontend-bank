import React from "react";

interface BankHeaderProps {
  bankName: string;
  onDelete: () => void; // 삭제 버튼 클릭 시 호출할 함수
}

const BankHeader: React.FC<BankHeaderProps> = ({ bankName, onDelete }) => {
  return (
    <div className="p-4 bg-white shadow-sm mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-600"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-lg font-medium text-gray-700">{bankName}</h1>
        </div>
        <button
          onClick={onDelete}
          className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
        >
          은행 삭제
        </button>
      </div>
    </div>
  );
};

export default BankHeader;