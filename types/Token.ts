

export interface RequestDTO {
  tokenName: string;
  tokenCurrency: string;
  changeReason: string;
  portfolioCoins: PortfolioCoin[];
}

export interface PortfolioItem {
    coinName?: string;
    currency: string;
    currentAmount?: number;
    newAmount?: string;
    amount?: string;
    price?: string;
}


export interface PortfolioCoin {
    coinName: string;
    currency: string;
    amount: number;
    currentPrice: number;
}

export interface TokenChange {
    symbol: string
    oldValue: string
    newValue: string
    status: string
    statusType: "increase" | "decrease" | "new"
}

export interface TokenValue {
    value: string
    change?: string
    changeType?: "increase" | "decrease"
}

// token request status에 대한 매핑 함수
export function mapTokenRequestStatus(status: string): { label: string; bgClass: string; textClass: string } {
  switch (status) {
    case "APPROVED":
      return { label: "승인", bgClass: "bg-green-100", textClass: "text-green-700" };
    case "REJECTED":
      return { label: "반려", bgClass: "bg-red-100", textClass: "text-red-700" };
    case "PENDING":
      return { label: "대기중", bgClass: "bg-yellow-100", textClass: "text-yellow-700" };
    default:
      return { label: status, bgClass: "bg-gray-100", textClass: "text-gray-700" };
  }
}