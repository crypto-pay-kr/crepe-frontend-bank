
import { MappedAccount } from "@/types/Account";
import { TickerData } from "@/types/Coin";


export function updateAccountsWithTickerData(accounts: MappedAccount[], data: TickerData): MappedAccount[] {
    const currency = data.code.split('-')[1];
    return accounts.map(account => {
        if (account.coinCurrency === currency) {
            const balanceParts = account.balance.crypto.split(' ');
            const balanceAmount = parseFloat(balanceParts[0]);
            const krwValue = balanceAmount * data.trade_price;
            return {
                ...account,
                balance: {
                    ...account.balance,
                    krw: `${krwValue.toLocaleString()} KRW`,
                }
            };
        }
        return account;
    });
}