import React from "react";

interface BankHeaderProps {
  bankName: string;
}

const BankHeader: React.FC<BankHeaderProps> = ({ bankName}) => {
  return (
    <div className="p-4 bg-white shadow-sm mb-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          
          <h1 className="text-lg font-bold text-gray-800">{bankName}</h1>
        </div>
      </div>
    </div>
  );
};

export default BankHeader;