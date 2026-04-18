import { useQueries } from "@tanstack/react-query";
import type { Target } from "../../types";
import { api } from "../../api/client";

interface SummaryCardsProps {
  targets: Target[];
}

export function SummaryCards({ targets }: SummaryCardsProps) {
  const activeTargets = targets.filter((t) => t.active);

  const histories = useQueries({
    queries: activeTargets.map((t) => ({
      queryKey: ["servicepatrol", "history", t.id],
      queryFn: () => api.getTargetHistory(t.id, 30),
      staleTime: 5_000,
    })),
  });

  let up = 0;
  let down = 0;
  let totalChecks = 0;
  let totalSuccesses = 0;

  histories.forEach((q) => {
    const data = q.data;
    if (!data || data.length === 0) return;

    if (data[0].success) up++;
    else down++;

    totalChecks += data.length;
    totalSuccesses += data.filter((c) => c.success).length;
  });

  const paused = targets.length - activeTargets.length;
  const uptime24h =
    totalChecks > 0
      ? Math.round((totalSuccesses / totalChecks) * 100 * 10) / 10
      : null;

  return (
    <div className="sp-summary">
      <Card label="Targets" value={targets.length.toString()} />
      <Card label="Up" value={up.toString()} tone="ok" />
      <Card
        label="Down"
        value={down.toString()}
        tone={down > 0 ? "err" : "default"}
      />
      <Card label="Uptime" value={uptime24h !== null ? `${uptime24h}%` : "—"} />
      {paused > 0 && (
        <Card label="Paused" value={paused.toString()} tone="muted" />
      )}
    </div>
  );
}

function Card({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "err" | "muted";
}) {
  return (
    <div className="sp-summary-card">
      <p className="sp-summary-label">{label}</p>
      <p className={`sp-summary-value sp-summary-value--${tone}`}>{value}</p>
    </div>
  );
}
