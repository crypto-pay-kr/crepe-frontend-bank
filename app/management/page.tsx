"use client"

import SuspendedBanksList from "@/components/bank/suspended-bank-list"
import { useState } from "react"

export default function BankManagementPage() {
  const [showSuspendedList, setShowSuspendedList] = useState(false)
  
  return (
    <>
        <SuspendedBanksList onBack={() => setShowSuspendedList(false)} />
    </>
  )
}