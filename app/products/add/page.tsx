"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
    FormDataType,
    InterestRateCategory,
    RegisterProductRequest,
    mapProductTypeToBackend,
} from "@/types/Product";
import Step1 from "@/components/product/add/Step1";
import Step2 from "@/components/product/add/Step2";
import { registerProduct } from "@/api/productApi";


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

export default function AddProductPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const dataFromQuery = searchParams.get("data");
    let parsedData: Partial<any> = {};
    if (dataFromQuery) {
        try {
            parsedData = JSON.parse(dataFromQuery);
        } catch (e) {
            console.error("Failed to parse query data:", e);
        }
    }

    const [isModify, setIsModify] = useState(false);

    useEffect(() => {
        if (dataFromQuery) {
            setIsModify(true);
        }
    }, [dataFromQuery]);


    const initialFormData: FormDataType = {
        productName: parsedData.productName ?? "",
        description: parsedData.description ?? "",
        productType: convertProductType(parsedData.type),
        depositAmount: parsedData.budget != null ? parsedData.budget.toString() : "",
        periodCondition: "",
        interestRate:
            parsedData.baseInterestRate != null ? parsedData.baseInterestRate.toString() : "",
        maxMonthlyPayment:
            parsedData.maxMonthlyPayment != null
                ? parsedData.maxMonthlyPayment.toString()
                : "",
        period: "",
        tags: parsedData.tags ?? [],
        // 만약 수정 모드면 백엔드 우대금리 데이터를 사용하여 자동 채워줌
        additionalInterestRates: parsedData.preferentialConditions ?? [],
        maxParticipants:
            parsedData.maxParticipants != null
                ? parsedData.maxParticipants.toString()
                : "",
        startDate: parsedData.startDate ?? "",
        endDate: parsedData.endDate ?? "",
        eligibilityAgeGroups: parsedData.eligibilityAgeGroups ?? [],
        eligibilityOccupations: parsedData.eligibilityOccupations ?? [],
        eligibilityIncomeLevels: parsedData.eligibilityIncomeLevels ?? [],
        imageUrl: parsedData.imageUrl ?? "",
        guideFileUrl: parsedData.guideFileUrl ?? "",
        // joinConditions는 그대로 문자열로 받음
        joinConditions: parsedData.joinConditions ?? "",
    };



    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormDataType>(initialFormData);

    // 파일 상태
    const [productImageFile, setProductImageFile] = useState<File | null>(null);
    const [guideFile, setGuideFile] = useState<File | null>(null);

    // 드롭다운 제어
    const [showTagSelector, setShowTagSelector] = useState(false);
    const [showCategorySelector, setShowCategorySelector] = useState<"AGE" | "AMOUNT" | "DEPOSIT" | null>(null);

    // Ref
    const tagSelectorRef = useRef<HTMLDivElement>(null);
    const categorySelectorRef = useRef<HTMLDivElement>(null);

    // 공통 인풋 변경 핸들러
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev: FormDataType) => ({
            ...prev,
            [name]: value,
        }));
    };

    // 태그 처리
    const handleAddTag = (tag: string) => {
        if (!formData.tags.includes(tag)) {
            setFormData((prev: FormDataType) => ({
                ...prev,
                tags: [...prev.tags, tag],
            }));
        }
        setShowTagSelector(false);
    };

    const handleRemoveTag = (index: number) => {
        setFormData((prev: FormDataType) => {
            const newTags = [...prev.tags];
            newTags.splice(index, 1);
            return { ...prev, tags: newTags };
        });
    };

    // 우대 금리 추가/제거
    const handleAddInterestRate = (category: InterestRateCategory) => {
        setFormData((prev: FormDataType) => {
            const existingIndex = prev.additionalInterestRates.findIndex(
                (item) => item.type === category.type
            );
            if (existingIndex !== -1) {
                const updatedRates = [...prev.additionalInterestRates];
                updatedRates[existingIndex] = category;
                return { ...prev, additionalInterestRates: updatedRates };
            } else {
                return {
                    ...prev,
                    additionalInterestRates: [...prev.additionalInterestRates, category],
                };
            }
        });
        setShowCategorySelector(null);
    };

    const handleRemoveInterestRate = (index: number) => {
        setFormData((prev: FormDataType) => {
            const newRates = [...prev.additionalInterestRates];
            newRates.splice(index, 1);
            return { ...prev, additionalInterestRates: newRates };
        });
    };

    // 자격 조건 토글 핸들러
    const handleToggleEligibility = (
        field: "eligibilityAgeGroups" | "eligibilityOccupations" | "eligibilityIncomeLevels",
        optionId: string
    ) => {
        setFormData((prev: FormDataType) => {
            const currentArray = prev[field];
            return {
                ...prev,
                [field]: currentArray.includes(optionId)
                    ? currentArray.filter((val: string) => val !== optionId)
                    : [...currentArray, optionId],
            };
        });
    };

    // 외부 영역 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tagSelectorRef.current && !tagSelectorRef.current.contains(event.target as Node)) {
                setShowTagSelector(false);
            }
            if (categorySelectorRef.current && !categorySelectorRef.current.contains(event.target as Node)) {
                setShowCategorySelector(null);
            }
        };

        if (showTagSelector || showCategorySelector) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showTagSelector, showCategorySelector]);

    // 파일 업로드 핸들러
    const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setProductImageFile(e.target.files[0]);
        }
    };

    const handleGuideFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setGuideFile(e.target.files[0]);
        }
    };

    // 단계 이동 핸들러
    const handleNextStep = () => setCurrentStep(2);
    const handlePrevStep = () => setCurrentStep(1);

    // 최종 제출
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const mappedType = mapProductTypeToBackend(formData.productType);

        const finalRequestData: RegisterProductRequest = {
            productName: formData.productName,
            type: mappedType,
            eligibilityCriteria: {
                ageGroups: formData.eligibilityAgeGroups.length ? formData.eligibilityAgeGroups : ["YOUTH"],
                occupations: formData.eligibilityOccupations.length ? formData.eligibilityOccupations : ["ALL_OCCUPATIONS"],
                incomeLevels: formData.eligibilityIncomeLevels.length ? formData.eligibilityIncomeLevels : ["NO_LIMIT"],
            },
            budget: parseInt(formData.depositAmount || "0", 10),
            baseRate: parseFloat(formData.interestRate || "0"),
            maxMonthlyPayment: formData.maxMonthlyPayment ? parseInt(formData.maxMonthlyPayment, 10) : null,
            maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants, 10) : 1000,
            preferentialRateCondition: {
                ageRateNames: formData.additionalInterestRates.filter((rate) => rate.type === "AGE").map((rate) => rate.id),
                depositRateNames: formData.additionalInterestRates.filter((rate) => rate.type === "AMOUNT").map((rate) => rate.id),
                freeDepositCountRateNames: formData.additionalInterestRates.filter((rate) => rate.type === "DEPOSIT").map((rate) => rate.id),
            },
            startDate: formData.startDate || "2025-01-20",
            endDate: formData.endDate || "2025-12-31",
            tagNames: formData.tags,
            description: formData.description,
        };

        try {
            if (!productImageFile) {
                alert("상품 CI 이미지를 선택해주세요.");
                return;
            }
            await registerProduct(finalRequestData, productImageFile, guideFile || undefined);
            alert("상품 등록이 완료되었습니다.");
            router.push("/products");
        } catch (error) {
            console.error(error);
            alert("상품 등록에 실패했습니다.");
        }
    };

    const handleCancel = () => {
        router.push("/products");
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href="/products" className="flex items-center text-gray-500 hover:text-gray-700">
                        <ArrowLeft size={18} className="mr-2" />
                        <span className="text-xl font-bold">상품 추가 요청</span>
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* 단계 표시기 */}
                    <div className="bg-gray-50 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 1 ? "bg-pink-500 text-white" : "bg-gray-200 text-gray-600"
                                        }`}
                                >
                                    1
                                </div>
                                <div className={`h-1 w-20 mx-2 ${currentStep === 2 ? "bg-pink-500" : "bg-gray-200"}`}></div>
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 2 ? "bg-pink-500 text-white" : "bg-gray-200 text-gray-600"
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

                    {/* 단계별 컴포넌트 분기 */}
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