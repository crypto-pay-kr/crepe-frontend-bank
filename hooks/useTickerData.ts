import { useState, useEffect } from "react";
import { useWebSocket } from "@/context/WebSocketContext";
import { TickerData } from "@/types/Coin";


export function useTickerData() {
  const { socket } = useWebSocket();
  const [tickerData, setTickerData] = useState<Record<string, TickerData>>({});

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const blob = event.data;
        const reader = new FileReader();

        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result as string) as TickerData;
            if (data.type === 'ticker') {
              setTickerData(prev => ({
                ...prev,
                [data.code]: data
              }));
            }
          } catch (parseError) {
            console.error('WebSocket message parsing error:', parseError);
          }
        };

        reader.readAsText(blob);
      } catch (error) {
        console.error('WebSocket message handling error:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

  return tickerData;
}