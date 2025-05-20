"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

const UPBIT_URL = process.env.NEXT_PUBLIC_UPBIT_URL;

interface WebSocketContextValue {
  socket: WebSocket | null;
}

const WebSocketContext = createContext<WebSocketContextValue>({ socket: null });

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const newSocket = new WebSocket(`${UPBIT_URL}`);
    newSocket.onopen = () => {
      newSocket.send(JSON.stringify([
        { "ticket": "test example" },
        { "type": "ticker", "codes": ["KRW-SOL", "KRW-USDT", "KRW-XRP"] },
        { "format": "DEFAULT" }
      ]));
    };
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}