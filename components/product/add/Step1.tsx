import React, { useState, useEffect } from "react";
import { ChevronDown, Plus, X, Tag } from "lucide-react";
import {
    InterestRateCategory, AVAILABLE_TAGS, AGE_CATEGORIES, AMOUNT_CATEGORIES, DEPOSIT_CATEGORIES, AGE_OPTIONS, OCCUPATION_OPTIONS, INCOME_OPTIONS,
} from "@/types/Product";
import { parseJoinConditions } from "@/utils/parseJoinConditions";
import { getAllTags } from "@/api/productApi";


interface Step1Props {
    formData: {
        productName: string;
        description: string;
        productType: string;
        depositAmount: string;
        periodCondition: string;
        interestRate: string;
        maxMonthlyPayment: string;
        period: string;
        tags: string[];
        additionalInterestRates: InterestRateCategory[];
        maxParticipants: string;
        startDate: string;
        endDate: string;
        eligibilityAgeGroups: string[];
        eligibilityOccupations: string[];
        eligibilityIncomeLevels: string[];
        joinConditions: string;
    };
    handleChange: (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => void;
    handleNextStep: () => void;
    handleCancel: () => void;
    handleAddTag: (tag: string) => void;
    showTagSelector: boolean;
    setShowTagSelector: (value: boolean) => void;
    tagSelectorRef: React.RefObject<HTMLDivElement | null>;
    handleRemoveTag: (index: number) => void;
    showCategorySelector: "AGE" | "AMOUNT" | "DEPOSIT" | null;
    setShowCategorySelector: (
        value: "AGE" | "AMOUNT" | "DEPOSIT" | null
    ) => void;
    categorySelectorRef: React.RefObject<HTMLDivElement | null>;
    handleAddInterestRate: (category: InterestRateCategory) => void;
    handleRemoveInterestRate: (index: number) => void;
    handleToggleEligibility: (
        field: "eligibilityAgeGroups" | "eligibilityOccupations" | "eligibilityIncomeLevels",
        optionId: string
    ) => void;
    isModify: boolean;
}

export default function Step1({
    formData,
    handleChange,
    handleNextStep,
    handleCancel,
    handleAddTag,
    showTagSelector,
    setShowTagSelector,
    tagSelectorRef,
    handleRemoveTag,
    showCategorySelector,
    setShowCategorySelector,
    categorySelectorRef,
    handleAddInterestRate,
    handleRemoveInterestRate,
    handleToggleEligibility,
    isModify,
}: Step1Props) {

    const [tagInput, setTagInput] = useState("");
    const [availableTags, setAvailableTags] = useState<string[]>([]);

    const isNextDisabled = !(
        formData.productName &&
        formData.productType &&
        formData.depositAmount &&
        formData.interestRate &&
        formData.startDate &&
        formData.endDate &&
        formData.tags.length > 0
    );

    const today = new Date().toISOString().split("T")[0];
    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && tagInput.trim() !== "") {
            e.preventDefault()
            e.stopPropagation()
            handleAddTag(tagInput.trim())
            setTagInput("")
        }
    }

    useEffect(() => {
        getAllTags()
            .then(setAvailableTags)
            .catch((e) => console.error("태그 조회 실패:", e));
    }, []);



    const parsedJoin = formData.joinConditions
        ? parseJoinConditions(formData.joinConditions)
        : {
            ageGroups: formData.eligibilityAgeGroups,
            occupations: formData.eligibilityOccupations,
            incomeLevels: formData.eligibilityIncomeLevels,
        };
    return (
        <div className="p-6">
            <h2 className="text-xl font-bold text-gray-700 mb-6 text-center">
                상품 기본 정보
            </h2>

            <div onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* 상품명 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            상품명
                        </label>
                        <input
                            type="text"
                            name="productName"
                            value={formData.productName}
                            onChange={handleChange}
                            placeholder="상품명을 입력해주세요"
                            className="w-full p-3 bg-gray-50 text-gray-700 border-none rounded-lg focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all"
                            required
                        />
                    </div>

                    {/* 상품 종류 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            상품 종류
                        </label>
                        <div className="relative">
                            <select
                                name="productType"
                                value={formData.productType}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 text-gray-700 border-none rounded-lg appearance-none focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all"
                                required
                            >
                                <option value="예금">예금</option>
                                <option value="적금">적금</option>
                                <option value="상품권">상품권</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                <ChevronDown size={16} className="text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* 상품 예치 자금 (총 한도) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            상품 예치 자금 (총 한도)
                        </label>
                        <input
                            type="number"
                            name="depositAmount"
                            value={formData.depositAmount}
                            onChange={handleChange}
                            placeholder="예: 8000000"
                            className="w-full p-3 bg-gray-50 text-gray-700 border-none rounded-lg focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all"
                            required
                        />
                    </div>

                    {/* 기본 금리 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            기본 금리 (%)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            name="interestRate"
                            value={formData.interestRate}
                            onChange={handleChange}
                            placeholder="예: 3.0"
                            className="w-full p-3 bg-gray-50 text-gray-700 border-none rounded-lg focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all"
                            required
                        />
                    </div>

                    {/* 최대 월 납입액 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            최대 월 납입액
                        </label>
                        <input
                            type="number"
                            name="maxMonthlyPayment"
                            value={formData.maxMonthlyPayment}
                            onChange={handleChange}
                            placeholder="예: 500000"
                            className="w-full p-3 bg-gray-50 text-gray-700 border-none rounded-lg focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all"
                        />
                    </div>

                    {/* 최대 참여자 수 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            최대 참여자 수
                        </label>
                        <input
                            type="number"
                            name="maxParticipants"
                            value={isModify ? formData.maxParticipants : ""}
                            readOnly
                            placeholder="자동 계산되어 입력됩니다"
                            className="w-full p-3 bg-gray-50 text-gray-700 border-none rounded-lg focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all"
                        />
                    </div>

                    {/* 상품 시작일 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            상품 시작일
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            min={today}
                            className="w-full p-3 bg-gray-50 text-gray-700 border-none rounded-lg focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all"
                        />
                    </div>

                    {/* 상품 종료일 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            상품 종료일
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            min={today}
                            className="w-full p-3 bg-gray-50 text-gray-700 border-none rounded-lg focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all"
                        />
                    </div>

                    {/* 자격 조건 섹션 */}
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">
                            자격 조건
                        </h3>
                        {/* 연령 조건 - parsedJoin.ageGroups 이용 */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                연령 조건
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {AGE_OPTIONS.map((option) => (
                                    <label key={option.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={parsedJoin.ageGroups.includes(option.id)}
                                            onChange={() =>
                                                handleToggleEligibility("eligibilityAgeGroups", option.id)
                                            }
                                            className="form-checkbox"
                                        />
                                        <span className="text-sm text-gray-700">
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 직업 조건 - parsedJoin.occupations 이용 */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                직업 조건
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {OCCUPATION_OPTIONS.map((option) => (
                                    <label key={option.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={parsedJoin.occupations.includes(option.id)}
                                            onChange={() =>
                                                handleToggleEligibility("eligibilityOccupations", option.id)
                                            }
                                            className="form-checkbox"
                                        />
                                        <span className="text-sm text-gray-700">
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 소득 조건 - parsedJoin.incomeLevels 이용 */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                소득 조건
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {INCOME_OPTIONS.map((option) => (
                                    <label key={option.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={parsedJoin.incomeLevels.includes(option.id)}
                                            onChange={() =>
                                                handleToggleEligibility("eligibilityIncomeLevels", option.id)
                                            }
                                            className="form-checkbox"
                                        />
                                        <span className="text-sm text-gray-700">
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>



                    {/* 태그 추가 */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            태그 추가
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {formData.tags.map((tag, index) => (
                                <div
                                    key={index}
                                    className="bg-pink-50 px-3 py-1.5 rounded-md text-sm flex items-center text-pink-600"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(index)}
                                        className="ml-2 text-pink-400 hover:text-pink-600"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {formData.tags.length === 0 && (
                                <div className="text-gray-400 text-sm">
                                    태그를 추가해주세요
                                </div>
                            )}
                        </div>
                        <div className="relative" ref={tagSelectorRef}>
                            <div className="flex">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        name="tagInput"
                                        placeholder="태그를 입력 후 Enter 또는 클릭하여 추가"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        onClick={() => setShowTagSelector(true)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-gray-700 rounded-l-lg focus:ring-2 focus:ring-pink-200 transition-all"
                                    />
                                    <Tag size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowTagSelector(true)}
                                    className="bg-pink-50 text-pink-500 px-4 rounded-r-lg hover:bg-pink-100 transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {showTagSelector && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {availableTags.map((tag, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                handleAddTag(tag);
                                                setShowTagSelector(false);
                                            }}
                                            className="p-3 hover:bg-pink-50 cursor-pointer flex items-center text-sm text-gray-700"
                                        >
                                            <Tag size={14} className="mr-2 text-pink-400" />
                                            {tag}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 우대 금리 섹션 */}
                    <div className="md:col-span-2" ref={categorySelectorRef}>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            우대 금리
                        </label>
                        <div className="space-y-2 mb-3">
                            {formData.additionalInterestRates.map((rate, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg bg-gray-50 text-gray-700 p-3"
                                >
                                    <div>
                                        <span className="font-medium text-gray-700">{rate.name}</span>
                                        <span className="text-sm text-gray-800 ml-2">
                                            ({rate.description})
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="mr-2 text-pink-500 font-medium">
                                            +{rate.rate}%
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveInterestRate(index)}
                                            className="text-gray-400 hover:text-pink-500 w-6 h-6 flex items-center justify-center rounded-full hover:bg-pink-50"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 우대 카테고리 선택 버튼 */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setShowCategorySelector("AGE")}
                                className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors text-sm"
                            >
                                <Plus size={16} className="text-pink-500" />
                                <span className="text-gray-700">연령 우대금리</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCategorySelector("AMOUNT")}
                                className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors text-sm"
                            >
                                <Plus size={16} className="text-pink-500" />
                                <span className="text-gray-700">금액 우대금리</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCategorySelector("DEPOSIT")}
                                className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors text-sm"
                            >
                                <Plus size={16} className="text-pink-500" />
                                <span className="text-gray-700">자유납입 우대금리</span>
                            </button>
                        </div>

                        {/* 우대 카테고리 선택 목록 */}
                        {showCategorySelector && (
                            <div className="mt-3 rounded-lg border border-gray-100 shadow-sm p-4 bg-white">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-gray-700">
                                        {showCategorySelector === "AGE" && "연령 우대금리 선택"}
                                        {showCategorySelector === "AMOUNT" && "금액 우대금리 선택"}
                                        {showCategorySelector === "DEPOSIT" && "자유납입 우대금리 선택"}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setShowCategorySelector(null)}
                                        className="text-sm text-gray-400 hover:text-gray-600"
                                    >
                                        취소
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {((showCategorySelector === "AGE"
                                        ? AGE_CATEGORIES
                                        : showCategorySelector === "AMOUNT"
                                            ? AMOUNT_CATEGORIES
                                            : DEPOSIT_CATEGORIES) || []
                                    ).map((category) => (
                                        <div
                                            key={category.id}
                                            className="flex items-center justify-between p-2 hover:bg-pink-50 cursor-pointer rounded-md transition-colors"
                                            onClick={() => handleAddInterestRate(category)}
                                        >
                                            <div>
                                                <span className="font-medium">{category.name}</span>
                                                <span className="text-sm text-gray-500 ml-2">
                                                    ({category.description})
                                                </span>
                                            </div>
                                            <span className="text-pink-500 font-medium">
                                                +{category.rate}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-8 flex gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 p-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={isNextDisabled}
                        className={`flex-1 p-3 rounded-lg transition-all 
                            ${isNextDisabled
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-pink-500 text-white hover:bg-pink-600"}`}
                    >
                        다음
                    </button>
                </div>
            </div>
        </div>
    );
}