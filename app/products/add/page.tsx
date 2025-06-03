"use client";

export const dynamic = "force-dynamic";

import React, { useRef, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import Step1 from "@/components/product/add/Step1";
import Step2 from "@/components/product/add/Step2";
import {
  FormDataType,
  InterestRateCategory,
  RegisterProductRequest,
  mapProductTypeToBackend,
} from "@/types/Product";
import { registerProduct, getProductById } from "@/api/productApi";

function convertProductType(type?: string): string {
  switch (type) {
    case "SAVING":
      return "예금";
    case "INSTALLMENT":
      return "적금";
    case "VOUCHER":
      return "상품권";
    default:
      return "";
  }
}

function AddProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const [isModify, setIsModify] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<any>>({});
  const [formData, setFormData] = useState<FormDataType | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [guideFile, setGuideFile] = useState<File | null>(null);

  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState<
    "AGE" | "AMOUNT" | "DEPOSIT" | null
  >(null);

  const tagSelectorRef = useRef<HTMLDivElement>(null);
  const categorySelectorRef = useRef<HTMLDivElement>(null);

  // 1) productId 쿼리 포착 → 수정 모드, API 호출
  useEffect(() => {
    if (productId) {
      setIsModify(true);
      getProductById(+productId).then((data) => {
        setParsedData(data);
      });
    }
  }, [productId]);

  // 2) parsedData or isModify 변경 시 formData 초기화
  useEffect(() => {
    const empty: FormDataType = {
      productName: "",
      description: "",
      productType: "예금",
      depositAmount: "",
      periodCondition: "",
      interestRate: "",
      storeType: "",
      maxMonthlyPayment: "",
      period: "",
      tags: [],
      additionalInterestRates: [],
      maxParticipants: "",
      startDate: "",
      endDate: "",
      eligibilityAgeGroups: [],
      eligibilityOccupations: [],
      eligibilityIncomeLevels: [],
      joinConditions: "",
      imageUrl: "",
      guideFileUrl: "",
    };

    if (isModify && parsedData.id != null) {
      setFormData({
        productName: parsedData.productName ?? "",
        description: parsedData.description ?? "",
        productType: convertProductType(parsedData.type),
        depositAmount: parsedData.budget?.toString() ?? "",
        periodCondition: "",
        storeType: parsedData.storeType ?? "",
        interestRate: parsedData.baseInterestRate?.toString() ?? "",
        maxMonthlyPayment: parsedData.maxMonthlyPayment?.toString() ?? "",
        period: "",
        tags: parsedData.tags ?? [],
        additionalInterestRates: parsedData.preferentialConditions ?? [],
        maxParticipants: parsedData.maxParticipants?.toString() ?? "",
        startDate: parsedData.startDate ?? "",
        endDate: parsedData.endDate ?? "",
        eligibilityAgeGroups: parsedData.eligibilityAgeGroups ?? [],
        eligibilityOccupations: parsedData.eligibilityOccupations ?? [],
        eligibilityIncomeLevels: parsedData.eligibilityIncomeLevels ?? [],
        joinConditions: parsedData.joinConditions ?? "",
        imageUrl: parsedData.imageUrl ?? "",
        guideFileUrl: parsedData.guideFileUrl ?? "",
      });
    } else if (!isModify) {
      setFormData(empty);
    }
  }, [parsedData, isModify]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        tagSelectorRef.current &&
        !tagSelectorRef.current.contains(e.target as Node)
      ) {
        setShowTagSelector(false);
      }
      if (
        categorySelectorRef.current &&
        !categorySelectorRef.current.contains(e.target as Node)
      ) {
        setShowCategorySelector(null);
      }
    };
    if (showTagSelector || showCategorySelector) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [showTagSelector, showCategorySelector]);

  // formData 준비 전 로딩
  if (!formData) {
    return <div className="p-6">로딩 중...</div>;
  }

  // 공통 핸들러들
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev!, [name]: value }));
  };

  const handleAddTag = (tag: string) => {
    const newTag = tag.trim();
    if (newTag === "") return;
    if (!formData.tags.includes(newTag)) {
      setFormData((prev) => ({
        ...prev!,
        tags: [...prev!.tags, newTag],
      }));
    }
    setShowTagSelector(false);
  };

  const handleRemoveTag = (idx: number) => {
    setFormData((prev) => {
      const tags = [...prev!.tags];
      tags.splice(idx, 1);
      return { ...prev!, tags };
    });
  };

  const handleAddInterestRate = (cat: InterestRateCategory) => {
    setFormData((prev) => {
      const idx = prev!.additionalInterestRates.findIndex((r) => r.id === cat.id);
      if (idx >= 0) return { ...prev! };
      return { ...prev!, additionalInterestRates: [...prev!.additionalInterestRates, cat] };
    });
    setShowCategorySelector(null);
  };

  const handleRemoveInterestRate = (idx: number) => {
    setFormData((prev) => {
      const rates = [...prev!.additionalInterestRates];
      rates.splice(idx, 1);
      return { ...prev!, additionalInterestRates: rates };
    });
  };

  const handleToggleEligibility = (
    field:
      | "eligibilityAgeGroups"
      | "eligibilityOccupations"
      | "eligibilityIncomeLevels",
    id: string
  ) => {
    setFormData((prev) => {
      const arr = prev![field];
      return {
        ...prev!,
        [field]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id],
      };
    });
  };

  // 태그 입력 관련 핸들러들 - 필요없으므로 제거

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setProductImageFile(e.target.files[0]);
  };
  const handleGuideFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setGuideFile(e.target.files[0]);
  };

  const handleNextStep = () => setCurrentStep(2);
  const handlePrevStep = () => setCurrentStep(1);

  const handleCancel = () => router.push("/products");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productImageFile) {
      toast.error("CI 이미지를 선택해주세요.");
      return;
    }
    const req: RegisterProductRequest = {
      productName: formData.productName,
      type: mapProductTypeToBackend(formData.productType),
      storeType:
          formData.productType === "상품권" ? formData.storeType : undefined,
      eligibilityCriteria: {
        ageGroups:
          formData.eligibilityAgeGroups.length > 0
            ? formData.eligibilityAgeGroups
            : ["YOUTH"],
        occupations:
          formData.eligibilityOccupations.length > 0
            ? formData.eligibilityOccupations
            : ["ALL_OCCUPATIONS"],
        incomeLevels:
          formData.eligibilityIncomeLevels.length > 0
            ? formData.eligibilityIncomeLevels
            : ["NO_LIMIT"],
      },
      budget: parseInt(formData.depositAmount || "0", 10),
      baseRate: parseFloat(formData.interestRate || "0"),
      maxMonthlyPayment: formData.maxMonthlyPayment
        ? parseInt(formData.maxMonthlyPayment, 10)
        : null,
      maxParticipants: formData.maxParticipants
        ? parseInt(formData.maxParticipants, 10)
        : 1000,
      preferentialRateCondition: {
        ageRateNames: formData.additionalInterestRates
          .filter((r) => r.type === "AGE")
          .map((r) => r.id),
        depositRateNames: formData.additionalInterestRates
          .filter((r) => r.type === "AMOUNT")
          .map((r) => r.id),
        freeDepositCountRateNames: formData.additionalInterestRates
          .filter((r) => r.type === "DEPOSIT")
          .map((r) => r.id),
      },
      startDate: formData.startDate,
      endDate: formData.endDate,
      tagNames: formData.tags,
      description: formData.description,
    };

    try {
      await registerProduct(req, productImageFile, guideFile || undefined);
      toast.success(isModify ? "수정 완료" : "등록 완료");
      router.push("/products");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "등록에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/products"
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={18} className="mr-2" />
            <span className="text-xl font-bold">
              {isModify ? "상품 수정" : "상품 추가 요청"}
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 1
                      ? "bg-pink-500 text-white"
                      : "bg-gray-200 text-gray-600"
                    }`}
                >
                  1
                </div>
                <div
                  className={`h-1 w-20 mx-2 ${currentStep === 2 ? "bg-pink-500" : "bg-gray-200"
                    }`}
                />
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 2
                      ? "bg-pink-500 text-white"
                      : "bg-gray-200 text-gray-600"
                    }`}
                >
                  2
                </div>
              </div>
              <div className="text-gray-500 text-sm">
                {currentStep === 1 ? "기본 정보" : "상세 내용"}
              </div>
            </div>
          </div>

          {currentStep === 1 && (
            <Step1
              formData={formData}
              handleChange={handleChange}
              handleNextStep={handleNextStep}
              handleCancel={handleCancel}
              handleAddTag={handleAddTag}
              showTagSelector={showTagSelector}
              setShowTagSelector={setShowTagSelector}
              tagSelectorRef={tagSelectorRef}
              handleRemoveTag={handleRemoveTag}
              showCategorySelector={showCategorySelector}
              setShowCategorySelector={setShowCategorySelector}
              categorySelectorRef={categorySelectorRef}
              handleAddInterestRate={handleAddInterestRate}
              handleRemoveInterestRate={handleRemoveInterestRate}
              handleToggleEligibility={handleToggleEligibility}
              isModify={isModify}
            />
          )}

          {currentStep === 2 && (
            <Step2
              formData={formData}
              handleChange={handleChange}
              handlePrevStep={handlePrevStep}
              handleSubmit={handleSubmit}
              handleProductImageChange={handleProductImageChange}
              handleProductManualChange={handleGuideFileChange}
              isModify={isModify}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// 로딩 상태 fallback 컴포넌트
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-gray-500">로딩 중...</div>
    </div>
  );
}

export default function AddProductPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AddProductContent />
    </Suspense>
  );
}