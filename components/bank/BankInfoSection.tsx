"use client"

import React, { useState, useRef } from "react"
import Link from "next/link"
import { toast } from "react-toastify"
import { changeBankPhone, changeBankCI } from "@/api/bankInfoApi"

interface BankInfoSectionProps {
  bankName?: string
  bankImageUrl?: string
  bankPhoneNumber?: string
  bankEmail?: string
  bankCode?: string
  onPhoneChange?: () => void
  onCIChange?: (newImageUrl: string) => void
}

export default function BankInfoSection({
  bankName = "",
  bankImageUrl = "",
  bankPhoneNumber = "",
  bankEmail = "",
  bankCode = "",
  onPhoneChange = () => {},
  onCIChange = () => {},
}: BankInfoSectionProps) {
  const [phoneInput, setPhoneInput] = useState(bankPhoneNumber)
  const [isEditing, setIsEditing] = useState(false)

  // CI 이미지 관련 state
  const [isEditingCI, setIsEditingCI] = useState(false)
  const [localBankImageUrl, setLocalBankImageUrl] = useState(bankImageUrl)
  const [selectedCIFile, setSelectedCIFile] = useState<File | null>(null)
  const ciInputRef = useRef<HTMLInputElement>(null)

  // 전화번호 변경 핸들러
  const handleChangePhoneClick = async () => {
    if (phoneInput === bankPhoneNumber) {
      toast.info("기존 번호와 동일합니다. 새로운 번호를 입력해주세요.")
      return
    }
    try {
      await changeBankPhone(phoneInput!)
      toast.success("연결 번호가 변경되었습니다.")
      setIsEditing(false)
      onPhoneChange()
    } catch (err: any) {
      console.error("번호 변경 실패:", err)
      toast.error(err.message || "번호 변경 실패")
    }
  }

  // CI 이미지를 수정 모드로 전환
  const handleCIButtonClick = () => {
    setIsEditingCI(true)
  }

  // 파일 선택 후 미리보기
  const handleCIImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedCIFile(file)
    const previewUrl = URL.createObjectURL(file)
    setLocalBankImageUrl(previewUrl)
  }

  // CI 이미지 변경 확정
  const handleConfirmCIChange = async () => {
    if (!selectedCIFile) return
    try {
      const result = await changeBankCI(selectedCIFile)
      const msg =
        typeof result === "string"
          ? result
          : "CI 이미지가 변경되었습니다."
      toast.success(msg)
      onCIChange(localBankImageUrl)
      setIsEditingCI(false)
      setSelectedCIFile(null)
    } catch (err: any) {
      console.error("CI 이미지 변경 실패:", err)
      toast.error(err.message || "CI 이미지 변경 실패")
    }
  }

  return (
    <>
      {/* CI 이미지 섹션 */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2">
          <h2 className="text-md font-medium text-gray-700">
            은행 CI 이미지 정보
          </h2>
          <button
            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            onClick={handleCIButtonClick}
          >
            수정하기
          </button>
        </div>
        <div className="w-full h-40 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center relative">
          {localBankImageUrl ? (
            <img
              src={localBankImageUrl}
              alt={bankName}
              className="h-32 object-contain"
            />
          ) : (
            <div className="w-32 h-32 bg-white rounded-md flex items-center justify-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                {bankName.charAt(0) || ""}
              </div>
            </div>
          )}
          {isEditingCI && (
            <div className="absolute bottom-2 right-2 flex gap-2">
              <button
                onClick={() => ciInputRef.current?.click()}
                className="px-3 py-1 bg-pink-500 text-white rounded-md shadow"
              >
                업로드
              </button>
              {selectedCIFile && (
                <button
                  onClick={handleConfirmCIChange}
                  className="px-3 py-1 bg-pink-500 text-white rounded-md shadow"
                >
                  수정완료
                </button>
              )}
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleCIImageChange}
          ref={ciInputRef}
          className="hidden"
        />
      </div>

      {/* 연락처, 이메일, 코드 섹션 */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-md font-medium text-gray-700 mb-4">
          은행 정보
        </h2>
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">대표 전화</div>
          <div className="flex">
            <input
              type="text"
              value={phoneInput}
              readOnly={!isEditing}
              onFocus={() => setIsEditing(true)}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-10/12 p-2 border text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button
              onClick={handleChangePhoneClick}
              className="w-1/6 ml-1 px-3 py-1 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
            >
              변경
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">은행 이메일</div>
            <input
              type="text"
              value={bankEmail}
              readOnly
              className="w-full p-2 border text-gray-500 border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">은행 코드</div>
            <input
              type="text"
              value={bankCode}
              readOnly
              className="w-full p-2 border text-gray-500 border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <Link
          href="/account"
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <button className="w-full p-3 text-left border border-gray-300 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors">
            <span>은행 계좌 관리</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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
    </>
  )
}