export interface RegisterProductRequest {
    productName: string;
    type: string;
    eligibilityCriteria: {
        ageGroups: string[];
        occupations: string[];
        incomeLevels: string[];
    };
    budget: number;
    baseRate: number;
    maxMonthlyPayment: number | null;
    maxParticipants: number;
    preferentialRateCondition: {
        ageRateNames: string[];
        depositRateNames: string[];
        freeDepositCountRateNames: string[];
    };
    startDate: string;  // "YYYY-MM-DD"
    endDate: string;    // "YYYY-MM-DD"
    tagNames: string[];
    description: string;
}

export interface FormDataType {
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
}

/**
 * 우대금리 카테고리 인터페이스
 */
export interface InterestRateCategory {
    type: "AGE" | "AMOUNT" | "DEPOSIT";
    id: string;
    name: string;
    description: string;
    rate: string;
}

/**
* 연령 카테고리
*/
export const AGE_CATEGORIES: InterestRateCategory[] = [
    { id: "YOUTH", name: "청년", description: "만 19세 이상 34세 이하", rate: "0.3", type: "AGE" },
    { id: "MIDDLE_AGED", name: "중장년", description: "만 35세 이상 64세 이하", rate: "0.2", type: "AGE" },
    { id: "SENIOR", name: "노년층", description: "만 65세 이상", rate: "0.5", type: "AGE" },
    { id: "ALL_AGES", name: "전연령", description: "나이 제한 없음", rate: "0", type: "AGE" },
];

/**
* 금액 카테고리
*/
export const AMOUNT_CATEGORIES: InterestRateCategory[] = [
    { id: "SMALL", name: "소액", description: "1천만원 미만", rate: "0", type: "AMOUNT" },
    { id: "MEDIUM", name: "중액", description: "1천만원 이상 5천만원 미만", rate: "0.2", type: "AMOUNT" },
    { id: "LARGE", name: "고액", description: "5천만원 이상 1억원 미만", rate: "0.3", type: "AMOUNT" },
    { id: "PREMIUM", name: "프리미엄", description: "1억원 이상", rate: "0.5", type: "AMOUNT" },
];

/**
 * 자유납입 카테고리
 */
export const DEPOSIT_CATEGORIES: InterestRateCategory[] = [
    { id: "NONE", name: "없음", description: "자유 납입 없음", rate: "0", type: "DEPOSIT" },
    { id: "LEVEL1", name: "초급", description: "월 3회 이상 자유 납입", rate: "0.1", type: "DEPOSIT" },
    { id: "LEVEL2", name: "중급", description: "월 5회 이상 자유 납입", rate: "0.2", type: "DEPOSIT" },
    { id: "LEVEL3", name: "고급", description: "월 10회 이상 자유 납입", rate: "0.3", type: "DEPOSIT" },
];

// 자격 조건 옵션 (옵션 배열)
export const AGE_OPTIONS = [
    { id: "YOUTH", label: "청년" },
    { id: "MIDDLE_AGED", label: "중장년" },
    { id: "SENIOR", label: "노년" },
    { id: "ALL_AGES", label: "전연령대" },
];

export const OCCUPATION_OPTIONS = [
    { id: "ALL_OCCUPATIONS", label: "제한 없음" },
    { id: "EMPLOYEE", label: "직장인" },
    { id: "SELF_EMPLOYED", label: "자영업자" },
    { id: "PUBLIC_SERVANT", label: "공무원" },
    { id: "MILITARY", label: "군인" },
    { id: "STUDENT", label: "학생" },
    { id: "HOUSEWIFE", label: "주부" },
    { id: "UNEMPLOYED", label: "무직" },
];

export const INCOME_OPTIONS = [
    { id: "LOW_INCOME", label: "저소득층" },
    { id: "LIMITED_INCOME", label: "소득제한(월 5천 이하)" },
    { id: "NO_LIMIT", label: "제한없음" },
];

/**
* 태그 목록 (임시 데이터)
*/
export const AVAILABLE_TAGS: string[] = [
    "세제혜택",
    "청년우대",
    "노년층우대",
    "고금리",
    "단기예금",
    "장기예금",
    "자유적금",
    "정기적금",
    "주택청약",
    "연금저축",
    "외화예금",
];

export interface InterestRateCategory {
    type: "AGE" | "AMOUNT" | "DEPOSIT"
    id: string
    name: string
    description: string
    rate: string
}


export function mapProductTypeToBackend(productType: string): string {
    // 프론트엔드에서 사용자가 선택한 한국어 타입을 백엔드에 맞는 문자열로 변환
    switch (productType) {
        case "예금":
            return "SAVING";
        case "적금":
            return "INSTALLMENT";
        case "상품권":
            return "VOUCHER";
        default:
            return "SAVING";
    }
}

export function mapProductTypeToFrontend(productType: string): string {
    // 백엔드에서 받은 제품 타입(SAVING, INSTALLMENT, CHUNGYAK 등)을 한국어로 변환하여 표시
    switch (productType) {
        case "SAVING":
            return "예금";
        case "INSTALLMENT":
            return "적금";
        case "VOUCHER":
            return "상품권";
        default:
            return "예금";
    }
}
