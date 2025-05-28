'use client';
import React, { useState } from "react";

interface CandleData {
    time: string;
    open: number;
    close: number;
    high: number;
    low: number;
    isUp: boolean;
}

interface CryptoChartProps {
    data: CandleData[];
}

const CryptoChart: React.FC<CryptoChartProps> = ({ data }) => {
    const chartId = `chart-${Math.random().toString(36).substring(2, 9)}`;
    const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const allValues = data.flatMap(d => [d.high, d.low]);
    const min = Math.min(...allValues) * 0.98;
    const max = Math.max(...allValues) * 1.02;
    const range = max - min;

    const width = 400;
    const height = 120;
    const padding = { top: 10, right: 10, bottom: 20, left: 30 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const timeLabels = [
        data[0].time,
        data[Math.floor(data.length * 0.25)].time,
        data[Math.floor(data.length * 0.5)].time,
        data[Math.floor(data.length * 0.75)].time,
        data[data.length - 1].time
    ];

    const priceStep = range / 4;
    const priceLabels = [
        Math.round(max),
        Math.round(max - priceStep),
        Math.round(max - 2 * priceStep),
        Math.round(max - 3 * priceStep),
        Math.round(min)
    ];

    const xScale = (index: number) => padding.left + (index / (data.length - 1)) * innerWidth;
    const yScale = (value: number) => padding.top + ((max - value) / range) * innerHeight;

    const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(d.close)}`).join(" ");

    const areaPath =
        `${data.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(d.close)}`).join(" ")} ` +
        `L${xScale(data.length - 1)},${height - padding.bottom} ` +
        `L${padding.left},${height - padding.bottom} Z`;

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePosition({ x, y });

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

    const handleMouseLeave = () => setHoveredCandle(null);
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
                <defs>
                    <linearGradient id={`areaGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(244, 63, 94, 0.2)" />
                        <stop offset="100%" stopColor="rgba(244, 63, 94, 0)" />
                    </linearGradient>
                </defs>

                {priceLabels.map((_, i) => (
                    <line key={`hgrid-${i}`} x1={padding.left} y1={padding.top + (i / 4) * innerHeight} x2={width - padding.right} y2={padding.top + (i / 4) * innerHeight} stroke="rgba(148, 163, 184, 0.15)" strokeWidth="0.5" />
                ))}
                {timeLabels.map((_, i) => (
                    <line key={`vgrid-${i}`} x1={padding.left + (i / 4) * innerWidth} y1={padding.top} x2={padding.left + (i / 4) * innerWidth} y2={height - padding.bottom} stroke="rgba(148, 163, 184, 0.15)" strokeWidth="0.5" />
                ))}

                {timeLabels.map((label, i) => (
                    <text key={`time-${i}`} x={padding.left + (i / 4) * innerWidth} y={height - 5} fontSize="8" fill="rgba(148, 163, 184, 0.7)" textAnchor="middle">
                        {label}
                    </text>
                ))}
                {priceLabels.map((label, i) => (
                    <text key={`price-${i}`} x={padding.left - 5} y={padding.top + (i / 4) * innerHeight + 3} fontSize="8" fill="rgba(148, 163, 184, 0.7)" textAnchor="end">
                        {label.toLocaleString()}
                    </text>
                ))}

                <path d={areaPath} fill={`url(#areaGradient-${chartId})`} />
                <path d={linePath} stroke="rgba(244, 63, 94, 0.8)" strokeWidth="1.5" fill="none" />

                {data.map((candle, i) => {
                    const x = xScale(i);
                    const isHovered = hoveredCandle === i;
                    const scaledOpen = yScale(candle.open);
                    const scaledClose = yScale(candle.close);
                    const scaledHigh = yScale(candle.high);
                    const scaledLow = yScale(candle.low);
                    const bodyTop = Math.min(scaledOpen, scaledClose);
                    const bodyBottom = Math.max(scaledOpen, scaledClose);

                    return (
                        <g key={`candle-${i}`}>
                            <line x1={x} y1={scaledHigh} x2={x} y2={scaledLow} stroke={candle.isUp ? (isHovered ? "#10b981" : "#34d399") : (isHovered ? "#f43f5e" : "#fb7185")} strokeWidth={isHovered ? 2 : 1} />
                            <rect x={x - (isHovered ? candleWidth * 0.75 : candleWidth / 2)} y={bodyTop} width={isHovered ? candleWidth * 1.5 : candleWidth} height={Math.max(bodyBottom - bodyTop, 1)} rx={1} fill={candle.isUp ? (isHovered ? "#10b981" : "#34d399") : (isHovered ? "#f43f5e" : "#fb7185")} />
                        </g>
                    );
                })}
            </svg>

            {hoveredCandle !== null && (
                <div
                    className="absolute bg-black/80 text-black text-xs p-2 rounded pointer-events-none z-10 backdrop-blur-sm border border-gray-700"
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

export default CryptoChart;
