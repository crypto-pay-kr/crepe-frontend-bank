'use client';

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// 은행 잔액 섹션 컴포넌트
export default function BankBalanceSection() {
  // 데이터 생성 및 상태 관리
  const [balanceData, setBalanceData] = useState(() => generateBalanceData());
  
  // 차트 캔버스 참조
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 컴포넌트 마운트시 차트 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 해상도 설정
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // 차트 그리기 - 잔여율의 합계를 보여주는 차트
    drawChart(ctx, rect.width, rect.height, hoveredCandle, balanceData.combinedChartData);

    // 마우스 이벤트 핸들러
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });

      // 호버된 캔들 결정
      const candleWidth = rect.width / (balanceData.combinedChartData.length + 2);
      const padding = candleWidth / 2;

      let hoveredIndex = null;
      for (let i = 0; i < balanceData.combinedChartData.length; i++) {
        const candleX = padding + i * candleWidth;
        if (Math.abs(x - candleX) < candleWidth / 2) {
          hoveredIndex = i;
          break;
        }
      }

      setHoveredCandle(hoveredIndex);
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [hoveredCandle, balanceData.combinedChartData]);

  // 코인들의 총 합계
  const totalAllCoins = 
    balanceData.coins.xrp.total + 
    balanceData.coins.usdt.total + 
    balanceData.coins.eth.total;

  // 각 코인의 비율 계산 (%)
  const xrpRatio = Math.round((balanceData.coins.xrp.total / totalAllCoins) * 100);
  const usdtRatio = Math.round((balanceData.coins.usdt.total / totalAllCoins) * 100);
  const ethRatio = 100 - xrpRatio - usdtRatio; // 100%가 되도록 조정

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h2 className="text-md font-medium mb-4">은행 잔여금</h2>
      
      {/* XRP 잔액 */}
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-sm">{formatNumber(balanceData.coins.xrp.total)}XRP</div>
        <div className="text-red-500">{balanceData.coins.xrp.change}</div>
      </div>
      <div className="flex h-8 rounded-md overflow-hidden shadow-sm mb-4">
        <div
          style={{
            background: `linear-gradient(to right, var(--rose-300), var(--rose-200))`,
            width: `${balanceData.coins.xrp.availableRatio}%`
          }}
          className="text-center py-1 flex items-center justify-center text-rose-900 font-medium text-xs transition-all duration-300 hover:brightness-105"
        >
          잔여 {formatNumber(balanceData.coins.xrp.available)}XRP
        </div>
      </div>

      {/* USDT 잔액 */}
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-sm">{formatNumber(balanceData.coins.usdt.total)}USDT</div>
        <div className="text-blue-500">{balanceData.coins.usdt.change}</div>
      </div>
      <div className="flex h-8 rounded-md overflow-hidden shadow-sm mb-4">
        <div
          style={{
            background: `linear-gradient(to right, var(--blue-300), var(--blue-200))`,
            width: `${balanceData.coins.usdt.availableRatio}%`
          }}
          className="text-center py-1 flex items-center justify-center text-blue-900 font-medium text-xs transition-all duration-300 hover:brightness-105"
        >
          잔여 {formatNumber(balanceData.coins.usdt.available)}USDT
        </div>
        <div
          style={{
            background: `linear-gradient(to right, var(--blue-500), var(--blue-400))`,
            width: `${100 - balanceData.coins.usdt.availableRatio}%`
          }}
          className="text-center py-1 flex items-center justify-center text-white font-medium text-xs transition-all duration-300 hover:brightness-105"
        >
        </div>
      </div>

      {/* ETH 잔액 */}
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-sm">{formatNumber(balanceData.coins.eth.total)}ETH</div>
        <div className="text-green-500">{balanceData.coins.eth.change}</div>
      </div>
      <div className="flex h-8 rounded-md overflow-hidden shadow-sm mb-4">
        <div
          style={{
            background: `linear-gradient(to right, var(--green-300), var(--green-200))`,
            width: `${balanceData.coins.eth.availableRatio}%`
          }}
          className="text-center py-1 flex items-center justify-center text-green-900 font-medium text-xs transition-all duration-300 hover:brightness-105"
        >
          잔여 {formatNumber(balanceData.coins.eth.available)}ETH
        </div>
        <div
          style={{
            background: `linear-gradient(to right, var(--green-500), var(--green-400))`,
            width: `${100 - balanceData.coins.eth.availableRatio}%`
          }}
          className="text-center py-1 flex items-center justify-center text-white font-medium text-xs transition-all duration-300 hover:brightness-105"
        >
        </div>
      </div>

    
    
    </div>
  );
}

// 캔들 데이터 타입
interface CandleData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  isUp: boolean;
}

// 코인 잔액 정보 타입
interface CoinBalance {
  total: number;
  available: number;
  availableRatio: number; // % 단위
  change: string;
}

// 은행 잔액 데이터 타입
interface BalanceData {
  coins: {
    xrp: CoinBalance;
    usdt: CoinBalance;
    eth: CoinBalance;
  };
  combinedChartData: CandleData[]; // 각 코인의 잔여 비율을 합친 차트 데이터
}

// 동적 데이터 생성 함수
function generateBalanceData(): BalanceData {
  // XRP 잔액 데이터
  const xrpTotal = 3321232;
  const xrpAvailable = 2232123;
  const xrpChange = "+3.4%";
  const xrpAvailableRatio = Math.round((xrpAvailable / xrpTotal) * 100);

  // USDT 잔액 데이터
  const usdtTotal = 1850000;
  const usdtAvailable = 1520000;
  const usdtChange = "-1.2%";
  const usdtAvailableRatio = Math.round((usdtAvailable / usdtTotal) * 100);

  // ETH 잔액 데이터
  const ethTotal = 42500;
  const ethAvailable = 32800;
  const ethChange = "+2.7%";
  const ethAvailableRatio = Math.round((ethAvailable / ethTotal) * 100);

  // 전체 잔여율의 합계를 나타내는 차트 데이터 생성
  const combinedChartData: CandleData[] = [];
  
  for (let i = 0; i < 25; i++) {
    const day = new Date();
    day.setDate(day.getDate() - (25 - i));
    const date = `${day.getMonth() + 1}/${day.getDate()}`;
    
    // 각 날짜의 기본 값들
    const baseValue = 3100000; // 약 3.1 million
    
    // 랜덤한 변동 추가 (% 단위로 유지)
    const dailyXrpRatio = xrpAvailableRatio + (Math.random() - 0.5) * 5; // ±2.5%
    const dailyUsdtRatio = usdtAvailableRatio + (Math.random() - 0.5) * 5;
    const dailyEthRatio = ethAvailableRatio + (Math.random() - 0.5) * 5;
    
    // 잔여율의 총합 (이 날짜의 총 잔여율)
    const combinedRatio = dailyXrpRatio + dailyUsdtRatio + dailyEthRatio;
    
    // 차트에 표시할 값 (잔여율을 기준으로 스케일링)
    const open = baseValue * (combinedRatio / 300); // 300은 3개 코인의 100%를 합한 값
    const closeVariation = (Math.random() - 0.5) * 0.03; // ±1.5% 변동
    const close = open * (1 + closeVariation);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01); // 최대 +1%
    const low = Math.min(open, close) * (1 - Math.random() * 0.01); // 최대 -1%
    
    combinedChartData.push({
      date,
      open,
      close,
      high,
      low,
      isUp: close > open
    });
  }
  
  return {
    coins: {
      xrp: { total: xrpTotal, available: xrpAvailable, availableRatio: xrpAvailableRatio, change: xrpChange },
      usdt: { total: usdtTotal, available: usdtAvailable, availableRatio: usdtAvailableRatio, change: usdtChange },
      eth: { total: ethTotal, available: ethAvailable, availableRatio: ethAvailableRatio, change: ethChange }
    },
    combinedChartData
  };
}

// 숫자 포맷팅 유틸리티
function formatNumber(num: number): string {
  return num.toLocaleString();
}

// 차트 그리기 함수
function drawChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hoveredIndex: number | null,
  chartData: CandleData[]
) {
  // 캔버스 초기화
  ctx.clearRect(0, 0, width, height);

  // 배경 그라데이션
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, "rgba(30, 41, 59, 0.05)");
  bgGradient.addColorStop(1, "rgba(30, 41, 59, 0)");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 최소/최대값 계산
  const allValues = chartData.flatMap((d) => [d.high, d.low]);
  const min = Math.min(...allValues) * 0.98;
  const max = Math.max(...allValues) * 1.02;
  const range = max - min;

  // 그리드 라인
  ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
  ctx.lineWidth = 0.5;

  // 수평 그리드 라인
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = (i / gridLines) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    // 가격 레이블
    const price = max - (i / gridLines) * range;
    ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
    ctx.font = "8px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(price.toLocaleString(), 4, y - 3);
  }

  // 시간 레이블 생성
  const timeLabelsCount = 6;
  const timeStep = Math.floor(chartData.length / (timeLabelsCount - 1));
  const timeLabels = [];
  
  for (let i = 0; i < timeLabelsCount; i++) {
    const index = Math.min(i * timeStep, chartData.length - 1);
    timeLabels.push(chartData[index]?.date || "");
  }

  // 수직 그리드 라인
  const labelStep = width / (timeLabels.length - 1);

  timeLabels.forEach((label, i) => {
    const x = i * labelStep;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height - 15); // 시간 레이블 위쪽으로 멈춤
    ctx.stroke();
  });

  // 시간 레이블 그리기
  ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
  ctx.font = "8px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";

  timeLabels.forEach((label, i) => {
    const x = i * labelStep;
    ctx.fillText(label, x, height - 4);
  });

  // 영역 차트
  const areaPoints = chartData.map((candle, i) => {
    const x = (i / (chartData.length - 1)) * width;
    const y = height - ((candle.close - min) / range) * (height - 20);
    return { x, y };
  });

  // 영역 아래 부분 그리기
  ctx.beginPath();
  ctx.moveTo(areaPoints[0].x, height - 15);
  areaPoints.forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.lineTo(areaPoints[areaPoints.length - 1].x, height - 15);
  ctx.closePath();

  const areaGradient = ctx.createLinearGradient(0, 0, 0, height);
  areaGradient.addColorStop(0, "rgba(244, 63, 94, 0.2)");
  areaGradient.addColorStop(1, "rgba(244, 63, 94, 0)");
  ctx.fillStyle = areaGradient;
  ctx.fill();

  // 트렌드 라인 그리기
  ctx.beginPath();
  ctx.moveTo(areaPoints[0].x, areaPoints[0].y);
  areaPoints.forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = "rgba(244, 63, 94, 0.8)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 캔들스틱 그리기
  const candleWidth = width / (chartData.length + 2);
  const padding = candleWidth / 2;

  chartData.forEach((candle, i) => {
    const x = padding + i * candleWidth;
    const isHovered = i === hoveredIndex;

    // 가격 스케일링
    const scaledOpen = height - ((candle.open - min) / range) * (height - 20);
    const scaledClose = height - ((candle.close - min) / range) * (height - 20);
    const scaledHigh = height - ((candle.high - min) / range) * (height - 20);
    const scaledLow = height - ((candle.low - min) / range) * (height - 20);

    // 윅(wick) 그리기
    ctx.beginPath();
    ctx.moveTo(x, scaledHigh);
    ctx.lineTo(x, scaledLow);

    // 상승/하락에 따른 색상
    if (candle.isUp) {
      ctx.strokeStyle = isHovered ? "#10b981" : "#34d399";
    } else {
      ctx.strokeStyle = isHovered ? "#f43f5e" : "#fb7185";
    }

    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.stroke();

    // 캔들 몸통 그리기
    const bodyTop = Math.min(scaledOpen, scaledClose);
    const bodyBottom = Math.max(scaledOpen, scaledClose);
    const bodyHeight = Math.max(bodyBottom - bodyTop, 1); // 최소 1px

    // 캔들 몸통 그라데이션
    let bodyGradient;
    if (candle.isUp) {
      bodyGradient = ctx.createLinearGradient(x - candleWidth / 4, bodyTop, x - candleWidth / 4, bodyBottom);
      bodyGradient.addColorStop(0, isHovered ? "#059669" : "#10b981");
      bodyGradient.addColorStop(1, isHovered ? "#10b981" : "#34d399");
    } else {
      bodyGradient = ctx.createLinearGradient(x - candleWidth / 4, bodyTop, x - candleWidth / 4, bodyBottom);
      bodyGradient.addColorStop(0, isHovered ? "#e11d48" : "#f43f5e");
      bodyGradient.addColorStop(1, isHovered ? "#f43f5e" : "#fb7185");
    }

    ctx.fillStyle = bodyGradient;

    // 캔들 몸통 둥근 사각형 그리기
    const bodyWidth = isHovered ? candleWidth / 1.5 : candleWidth / 2;
    const radius = 1;
    const bodyX = x - bodyWidth / 2;

    ctx.beginPath();
    ctx.moveTo(bodyX + radius, bodyTop);
    ctx.lineTo(bodyX + bodyWidth - radius, bodyTop);
    ctx.quadraticCurveTo(bodyX + bodyWidth, bodyTop, bodyX + bodyWidth, bodyTop + radius);
    ctx.lineTo(bodyX + bodyWidth, bodyBottom - radius);
    ctx.quadraticCurveTo(bodyX + bodyWidth, bodyBottom, bodyX + bodyWidth - radius, bodyBottom);
    ctx.lineTo(bodyX + radius, bodyBottom);
    ctx.quadraticCurveTo(bodyX, bodyBottom, bodyX, bodyBottom - radius);
    ctx.lineTo(bodyX, bodyTop + radius);
    ctx.quadraticCurveTo(bodyX, bodyTop, bodyX + radius, bodyTop);
    ctx.closePath();
    ctx.fill();

    // 호버된 캔들에 그림자 효과
    if (isHovered) {
      ctx.shadowColor = candle.isUp ? "rgba(16, 185, 129, 0.5)" : "rgba(244, 63, 94, 0.5)";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  });
}