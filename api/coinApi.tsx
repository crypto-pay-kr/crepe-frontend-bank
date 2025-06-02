const COIN_PRICE_URL = process.env.NEXT_COIN_PRICE_URL;
import { ApiError } from "@/app/error/ApiError";


// 코인 시세 가져오기
export const fetchCoinPrices = async () => {
    try {
        const response = await fetch(`${COIN_PRICE_URL}`);
        if (!response.ok) {
            throw new Error(`시세 조회 실패: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);

        const updatedPrices = data.reduce((acc: any, item: any) => {
            acc[item.market] = item.trade_price;

            return acc;
        }, {});

        return updatedPrices; 
    } catch (err) {
        if (err instanceof ApiError) {
            console.error(`ApiError: ${err.message} (Status: ${err.status})`);
          } else {
            console.error("Error fetching coin prices:", err);
          }
          throw err; 
        }
      };