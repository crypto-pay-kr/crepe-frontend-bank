export interface MappedAccount {
    bankName: string;
    coinCurrency: string;
    coinName: string;
    managerName: string;
    coinAccount: string;
    tagAccount?: string;
    status: string;
    balance: {
        krw: string;
        crypto: string;
    };
}


// 계좌 정보 타입 정의
export interface AccountBalance {
    krw: string;
    crypto: string;
}

export interface AccountInfo {
    coinName: string;
    coinCurrency: string;
    managerName: string;
    coinAccount: string;
    tagAccount?: string;
    balance: AccountBalance;
    status: string;
}