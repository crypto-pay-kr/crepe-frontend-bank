
export type CoinMapping = Record<string, string>;

export const coinMapping: CoinMapping = {
  XRP: "리플",
  SOL: "솔라나",
  USDT: "테더",
};

export interface TickerData {
    type: string;
    code: string;  // 'KRW-SOL', 'KRW-USDT', 'KRW-XRP' 등
    trade_price: number;  // 현재가
    change: string;  // 전일 대비 (RISE, EVEN, FALL)
    change_rate: number;  // 변화율
    signed_change_rate: number;
    signed_change_price: number;
    timestamp: number;
  }