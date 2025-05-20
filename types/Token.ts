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
