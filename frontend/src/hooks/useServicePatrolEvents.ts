import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "../api/client";
import type { ServicePatrolEvent } from "../types";

interface Options {
  enabled: boolean;
  onEvent?: (event: ServicePatrolEvent) => void;
}

export function useServicePatrolEvents({ enabled, onEvent }: Options) {
  const queryClient = useQueryClient();
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    const token = getAccessToken();
    if (!token) return;

    const es = new EventSource(
      `/api/servicepatrol/events?token=${encodeURIComponent(token)}`,
    );

    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as ServicePatrolEvent;
        onEventRef.current?.(event);

        if (event.type === "state_change") {
          queryClient.invalidateQueries({
            queryKey: ["servicepatrol", "targets"],
          });
          queryClient.invalidateQueries({
            queryKey: ["servicepatrol", "history", event.target_id],
          });
        } else if (event.type === "check_complete") {
          queryClient.invalidateQueries({
            queryKey: ["servicepatrol", "history", event.target_id],
          });
        }
      } catch (err) {
        console.error("failed to parse SSE event:", err);
      }
    };

    es.onerror = () => {};

    return () => {
      es.close();
    };
  }, [enabled, queryClient]);
}
