// 코인 시세 API 호출을 위한 URL
const COIN_PRICE_URL = process.env.NEXT_COIN_PRICE_URL;



// 코인 시세 가져오기
export const fetchCoinPrices = async () => {
    try {
        const response = await fetch(`${COIN_PRICE_URL}`);
        if (!response.ok) {
            throw new Error(`시세 조회 실패: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);

        // 시세 데이터를 객체 형태로 변환
        const updatedPrices = data.reduce((acc: any, item: any) => {
            acc[item.market] = item.trade_price;

            return acc;
        }, {});

        return updatedPrices; // 시세 데이터 반환
    } catch (err) {
        console.error("Error fetching coin prices:", err);
        throw err; // 에러를 호출한 쪽으로 전달
    }
};