import { useEffect, useRef, useState } from "react";
import { getAccessToken } from "../api/client";
import type { DashboardUpdate } from "../types";

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (window.location.protocol === "https:" ? "wss://" : "ws://") +
    window.location.host;

export function useWebSocket() {
  const [data, setData] = useState<DashboardUpdate | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    async function connect() {
      const token = getAccessToken();
      if (!token || cancelled) return;

      const ws = new WebSocket(`${WS_URL}/ws?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!cancelled) setConnected(true);
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const update: DashboardUpdate = JSON.parse(event.data);
          setData(update);
        } catch {
          console.error("failed to parse ws message");
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        reconnectRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { data, connected };
}
