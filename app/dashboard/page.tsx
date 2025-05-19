'use client';
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import BankBalanceSection from "@/components/bank/bank-balance-section";
import { fetchBankInfoDetail } from "@/api/bankInfoApi";
import BankHeader from "@/components/common/bank-header";
import BankInfoSection from "@/components/bank/BankInfoSection";


// 간단한 더미 데이터 타입 및 생성 함수
interface CandleData {
  time: string;
  open: number;
  close: number;
  high: number;
  low: number;
  isUp: boolean;
}


interface BankInfoDetail {
  bankId: number;
  bankName: string;
  bankImageUrl: string;
  bankPhoneNumber: string;
  bankEmail: string;
  bankCode: string;
}

// 더미 데이터 생성 함수
const generateDummyData = (): CandleData[] => {
  const data: CandleData[] = [];

  for (let i = 0; i < 25; i++) {
    const hour = Math.floor(i / 5) + 13;
    const minute = (i % 5) * 10;
    const time = `${hour}:${minute.toString().padStart(2, '0')}`;

    const baseValue = 100 + Math.random() * 30;
    const open = baseValue;
    const close = baseValue + (Math.random() - 0.5) * 8;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;

    data.push({
      time,
      open,
      close,
      high,
      low,
      isUp: close > open
    });
  }

  return data;
};

// 각 섹션용 더미 데이터
const tokenPriceData = generateDummyData();
const capitalTrendData = generateDummyData();
const bankBalanceData = generateDummyData();
const tokenVolumeData = generateDummyData();

// 그라데이션 바 타입
interface SegmentProps {
  label?: string;
  width: string;
  startColor: string;
  endColor: string;
  textColor?: string;
}

// 그라데이션 프로그레스 바 컴포넌트
const GradientProgressBar: React.FC<{ segments: SegmentProps[] }> = ({ segments }) => {
  return (
    <div className="flex h-8 rounded-md overflow-hidden shadow-sm">
      {segments.map((segment, index) => (
        <div
          key={index}
          style={{
            background: `linear-gradient(to right, var(--${segment.startColor}), var(--${segment.endColor}))`,
          }}
          className={`text-center py-1 ${segment.width} flex items-center justify-center ${segment.textColor || "text-black"
            } font-medium text-xs transition-all duration-300 hover:brightness-105`}
        >
          {segment.label}
        </div>
      ))}
    </div>
  );
};

// 차트 컴포넌트
const CryptoChart: React.FC<{ data: CandleData[] }> = ({ data }) => {
  const chartId = `chart-${Math.random().toString(36).substring(2, 9)}`;
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 최소값, 최대값 계산
  const allValues = data.flatMap(d => [d.high, d.low]);
  const min = Math.min(...allValues) * 0.98;
  const max = Math.max(...allValues) * 1.02;
  const range = max - min;

  // 차트 레이아웃 설정
  const width = 400;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // 시간 간격 계산
  const timeLabels = [
    data[0].time,
    data[Math.floor(data.length * 0.25)].time,
    data[Math.floor(data.length * 0.5)].time,
    data[Math.floor(data.length * 0.75)].time,
    data[data.length - 1].time
  ];

  // 가격 간격 계산
  const priceStep = range / 4;
  const priceLabels = [
    Math.round(max),
    Math.round(max - priceStep),
    Math.round(max - 2 * priceStep),
    Math.round(max - 3 * priceStep),
    Math.round(min)
  ];

  // 차트 데이터를 SVG 좌표로 변환
  const xScale = (index: number) => padding.left + (index / (data.length - 1)) * innerWidth;
  const yScale = (value: number) => padding.top + ((max - value) / range) * innerHeight;

  // 선 차트를 위한 경로 생성
  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(d.close)}`)
    .join(" ");

  // 영역 차트를 위한 경로 생성
  const areaPath =
    `${data.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(d.close)}`).join(" ")} ` +
    `L${xScale(data.length - 1)},${height - padding.bottom} ` +
    `L${padding.left},${height - padding.bottom} Z`;

  // 마우스 이벤트 핸들러
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });

    // x 좌표에 가장 가까운 캔들 찾기
    let closestIndex = null;
    let closestDistance = Infinity;

    data.forEach((_, i) => {
      const candleX = xScale(i);
      const distance = Math.abs(x - candleX);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    });

    setHoveredCandle(closestDistance < 15 ? closestIndex : null);
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
  };

  // 캔들 너비 계산
  const candleWidth = innerWidth / (data.length * 2);

  return (
    <div className="relative w-full h-full">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* 배경 그라데이션 */}
        <defs>
          <linearGradient id={`areaGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(244, 63, 94, 0.2)" />
            <stop offset="100%" stopColor="rgba(244, 63, 94, 0)" />
          </linearGradient>
        </defs>

        {/* 그리드 라인 - 가로 */}
        {priceLabels.map((_, i) => (
          <line
            key={`hgrid-${i}`}
            x1={padding.left}
            y1={padding.top + (i / (priceLabels.length - 1)) * innerHeight}
            x2={width - padding.right}
            y2={padding.top + (i / (priceLabels.length - 1)) * innerHeight}
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth="0.5"
          />
        ))}

        {/* 그리드 라인 - 세로 */}
        {timeLabels.map((_, i) => (
          <line
            key={`vgrid-${i}`}
            x1={padding.left + (i / (timeLabels.length - 1)) * innerWidth}
            y1={padding.top}
            x2={padding.left + (i / (timeLabels.length - 1)) * innerWidth}
            y2={height - padding.bottom}
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth="0.5"
          />
        ))}

        {/* 시간 레이블 */}
        {timeLabels.map((label, i) => (
          <text
            key={`time-${i}`}
            x={padding.left + (i / (timeLabels.length - 1)) * innerWidth}
            y={height - 5}
            fontSize="8"
            fill="rgba(148, 163, 184, 0.7)"
            textAnchor="middle"
          >
            {label}
          </text>
        ))}

        {/* 가격 레이블 */}
        {priceLabels.map((label, i) => (
          <text
            key={`price-${i}`}
            x={padding.left - 5}
            y={padding.top + (i / (priceLabels.length - 1)) * innerHeight + 3}
            fontSize="8"
            fill="rgba(148, 163, 184, 0.7)"
            textAnchor="end"
          >
            {label.toLocaleString()}
          </text>
        ))}

        {/* 영역 차트 */}
        <path d={areaPath} fill={`url(#areaGradient-${chartId})`} />

        {/* 선 차트 */}
        <path d={linePath} stroke="rgba(244, 63, 94, 0.8)" strokeWidth="1.5" fill="none" />

        {/* 캔들스틱 */}
        {data.map((candle, i) => {
          const x = xScale(i);
          const isHovered = hoveredCandle === i;

          // 가격 스케일링
          const scaledOpen = yScale(candle.open);
          const scaledClose = yScale(candle.close);
          const scaledHigh = yScale(candle.high);
          const scaledLow = yScale(candle.low);

          // 캔들 몸통 계산
          const bodyTop = Math.min(scaledOpen, scaledClose);
          const bodyBottom = Math.max(scaledOpen, scaledClose);

          return (
            <g key={`candle-${i}`}>
              {/* 윅(wick) 그리기 */}
              <line
                x1={x}
                y1={scaledHigh}
                x2={x}
                y2={scaledLow}
                stroke={candle.isUp ? (isHovered ? "#10b981" : "#34d399") : (isHovered ? "#f43f5e" : "#fb7185")}
                strokeWidth={isHovered ? 2 : 1}
              />

              {/* 캔들 몸통 그리기 */}
              <rect
                x={x - (isHovered ? candleWidth * 0.75 : candleWidth / 2)}
                y={bodyTop}
                width={isHovered ? candleWidth * 1.5 : candleWidth}
                height={Math.max(bodyBottom - bodyTop, 1)}
                rx={1}
                fill={candle.isUp ? (isHovered ? "#10b981" : "#34d399") : (isHovered ? "#f43f5e" : "#fb7185")}
              />
            </g>
          );
        })}
      </svg>

      {/* 호버 정보 */}
      {hoveredCandle !== null && (
        <div
          className="absolute bg-black/80 text-black  text-xs p-2 rounded pointer-events-none z-10 backdrop-blur-sm border border-gray-700"
          style={{
            left: `${mousePosition.x + 10}px`,
            top: `${mousePosition.y - 60}px`,
            transform: mousePosition.x > width / 2 ? "translateX(-100%)" : "translateX(0)",
          }}
        >
          <div className="font-medium">{data[hoveredCandle].time}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
            <div className="text-gray-400">Open:</div>
            <div>{data[hoveredCandle].open.toLocaleString()}</div>
            <div className="text-gray-400">Close:</div>
            <div className={data[hoveredCandle].isUp ? "text-green-400" : "text-rose-400"}>
              {data[hoveredCandle].close.toLocaleString()}
            </div>
            <div className="text-gray-400">High:</div>
            <div className="text-green-400">{data[hoveredCandle].high.toLocaleString()}</div>
            <div className="text-gray-400">Low:</div>
            <div className="text-rose-400">{data[hoveredCandle].low.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// 은행 상세 페이지 컴포넌트
export default function BankDetailPage() {
  const [selectedCoin, setSelectedCoin] = useState("XRP");
  const [bankInfo, setBankInfo] = useState<BankInfoDetail | null>(null);

  // 은행 정보를 가져오는 함수
  const loadBankInfo = async () => {
    try {
      const data = await fetchBankInfoDetail();
      setBankInfo(data);
    } catch (error) {
      console.error("Failed to fetch bank info:", error);
    }
  };


  // 은행 삭제 함수 (예시)
  const handleDeleteBank = () => {
    alert("은행 삭제 기능 호출됨!");
    // 실제 삭제 로직 추가 필요
  };

  useEffect(() => {
    loadBankInfo(); // 컴포넌트가 마운트될 때 은행 정보 가져오기
  }, []);

  if (!bankInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        <BankHeader bankName={bankInfo.bankName} onDelete={handleDeleteBank} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BankInfoSection
            bankName={bankInfo?.bankName}
            bankImageUrl={bankInfo?.bankImageUrl}
            bankPhoneNumber={bankInfo?.bankPhoneNumber}
            bankEmail={bankInfo?.bankEmail}
            bankCode={bankInfo?.bankCode}
            onPhoneChange={loadBankInfo}
          />


          {/* Token Price Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-md font-medium mb-4">토큰 현재가</h2>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-sm">1.12142KRW</div>
              <div className="text-red-500">+3.4%</div>
            </div>

            <GradientProgressBar
              segments={[
                {
                  label: "USDT",
                  width: "w-1/3",
                  startColor: "rose-300",
                  endColor: "rose-200",
                  textColor: "text-rose-900",
                },
                {
                  label: "XRP",
                  width: "w-1/3",
                  startColor: "gray-200",
                  endColor: "gray-300",
                  textColor: "text-gray-700",
                },
                { label: "", width: "w-1/3", startColor: "rose-500", endColor: "rose-400" },
              ]}
            />

            {/* Chart using dynamic data */}
            <div className="w-full h-32 relative mt-4">
              <CryptoChart data={tokenPriceData} />
            </div>
          </div>

          {/* Asset Balance Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-md font-medium mb-4">자본금 추이</h2>
            <div className="flex items-center justify-between mb-2">
              <div className="w-full">
                <input
                  type="text"
                  value="1,232,324,242,242,400KRW"
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="text-red-500 ml-2">+3.4%</div>
            </div>

            {/* Chart using dynamic data */}
            <div className="w-full h-32 relative mt-4">
              <CryptoChart data={capitalTrendData} />
            </div>
          </div>

          {/* Bank Balance Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <BankBalanceSection />
          </div>

          {/* Token Value Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-medium">토큰 거래량</h2>
              <div className="relative">
                <select
                  className="appearance-none border border-gray-300 rounded-lg p-2 pr-8 bg-white"
                  value={selectedCoin}
                  onChange={(e) => setSelectedCoin(e.target.value)}
                >
                  <option value="XRP">XRP</option>
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-sm">3,321.233WOORI</div>
              <div className="text-red-500">+3.4%</div>
            </div>

            {/* Chart using dynamic data */}
            <div className="w-full h-32 relative mt-4">
              <CryptoChart data={tokenVolumeData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}