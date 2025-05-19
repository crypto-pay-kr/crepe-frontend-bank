const COIN_PRICE_URL = process.env.NEXT_COIN_PRICE_URL;

// 코인 시세 가져오기
export const fetchCoinPrices = async () => {
    try {
      const response = await fetch("https://api.upbit.com/v1/ticker?markets=KRW-SOL,KRW-XRP,KRW-USDT");
      if (!response.ok) {
        throw new Error(`시세 조회 실패: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("API 응답 데이터:", data); // 응답 데이터 확인
  
    // market을 키로 하는 객체로 변환
    const updatedPrices = data.reduce((acc: any, item: any) => {
        acc[item.market] = item.trade_price; // 전체 데이터를 저장
        return acc;
      }, {});
  
      console.log("변환된 시세 데이터:", updatedPrices); // 변환된 데이터 확인
      return updatedPrices; // 시세 데이터 반환
    } catch (err) {
      console.error("Error fetching coin prices:", err);
      throw err; // 에러를 호출한 쪽으로 전달
    }
  };