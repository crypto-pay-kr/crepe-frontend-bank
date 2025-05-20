"use client";

import React, { createContext, useContext, useState } from "react";

interface BankContextProps {
  bankName: string;
  setBankName: (name: string) => void;
}

const BankContext = createContext<BankContextProps | undefined>(undefined);

export const BankProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bankName, setBankName] = useState("");

  return (
    <BankContext.Provider value={{ bankName, setBankName }}>
      {children}
    </BankContext.Provider>
  );
};

export const useBankContext = () => {
  const context = useContext(BankContext);
  if (!context) {
    throw new Error("useBankContext must be used within a BankProvider");
  }
  return context;
};