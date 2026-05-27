import { useEffect, useRef, useCallback } from "react";

export function useWebSocket(onMessage: (event: string, data: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    // const ws = new WebSocket("ws://localhost:3000/ws");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log("🔌 WebSocket connected");
    };

    ws.onmessage = (event) => {
      const { event: type, data } = JSON.parse(event.data);
      onMessage(type, data);
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket disconnected, reconnecting in 3s...");
      setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current = ws;
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);
}