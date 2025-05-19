import React, { useEffect } from "react";

export default function UpbitWebSocket() {
  useEffect(() => {
    // 1. 웹소켓 생성
    const socket = new WebSocket("wss://api.upbit.com/websocket/v1");

    // 2. 웹소켓 연결이 열리면 요청 메시지 전송
    socket.onopen = () => {
      console.log("WebSocket 연결 완료.");

      const requestMessage = [
        { "ticket": "test example" },
        {
          "type": "ticker",
          "codes": ["KRW-SOL", "KRW-USDT", "KRW-XRP"]
        },
        { "format": "DEFAULT" }
      ];

      socket.send(JSON.stringify(requestMessage));
    };

    // 3. 메시지 수신 시 처리
    socket.onmessage = (event) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const textDecoder = new TextDecoder("utf-8");
          const decoded = textDecoder.decode(reader.result as ArrayBuffer);
          console.log("수신 데이터:", decoded);
        }
      };
      reader.readAsArrayBuffer(event.data as Blob);
    };

    // 4. 에러 처리
    socket.onerror = (error) => {
      console.error("WebSocket 에러:", error);
    };

    // 5. 연결 종료 처리
    socket.onclose = () => {
      console.log("WebSocket 연결 종료.");
    };

    // 6. 30초마다 ping 메시지 전송
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        console.log("Ping 전송.");
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 60000);

    // 컴포넌트 언마운트 시 웹소켓 종료 및 ping 인터벌 해제
    return () => {
      clearInterval(pingInterval);
      socket.close();
    };
  }, []);

}