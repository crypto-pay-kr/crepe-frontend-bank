export interface BankInfoDetail {
    bankId: number;
    bankName: string;
    managerName: string;
    bankImageUrl: string;
    bankPhoneNumber: string;
    bankEmail: string;
    bankCode: string;
}

export interface BankProduct{
    subId: string
    name: string
    balance:number
}

export interface GetAllBalanceResponse {
    balance: {
        coinImageUrl: string;
        coinName: string;
        currency: string;
        balance: number;
    }[];
    bankTokenInfo: {
        bankImageUrl: string;
        currency: string;
        name: string;
        balance: number;
        krw: string;
        product: BankProduct[];
    }[];
}