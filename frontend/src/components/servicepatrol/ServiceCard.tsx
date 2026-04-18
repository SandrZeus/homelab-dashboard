import type { Target } from "../../types";
import { useTargetHistory } from "../../hooks/useServicePatrolTargets";
import { Sparkline } from "./Sparkline";

interface ServiceCardProps {
  target: Target;
  onSelect?: (t: Target) => void;
  onEdit?: (t: Target) => void;
  onDelete?: (t: Target) => void;
}

type Status = "up" | "down" | "paused" | "unknown";

function computeStatus(
  target: Target,
  latestSuccess: boolean | undefined,
): Status {
  if (!target.active) return "paused";
  if (latestSuccess === undefined) return "unknown";
  return latestSuccess ? "up" : "down";
}

function statusLabel(status: Status): string {
  switch (status) {
    case "up":
      return "Up";
    case "down":
      return "Down";
    case "paused":
      return "Paused";
    case "unknown":
      return "…";
  }
}

export function ServiceCard({
  target,
  onSelect,
  onEdit,
  onDelete,
}: ServiceCardProps) {
  const { data: history } = useTargetHistory(target.id, 30);

  const latest = history?.[0];
  const status = computeStatus(target, latest?.success);

  const uptime =
    history && history.length > 0
      ? Math.round(
          (history.filter((c) => c.success).length / history.length) * 100,
        )
      : null;

  const latency = latest?.response_time_ms;

  return (
    <div
      className="sp-svc"
      onClick={() => onSelect?.(target)}
      role="button"
      tabIndex={0}
    >
      <div className={`sp-svc-bar sp-svc-bar--${status}`} />

      <div className="sp-svc-body">
        <div className="sp-svc-line1">
          <span className="sp-svc-name">{target.name}</span>
          <span className={`sp-svc-status sp-svc-status--${status}`}>
            {statusLabel(status)}
          </span>
          <span className="sp-svc-url">{target.url}</span>
        </div>

        <div className="sp-svc-line2">
          <Sparkline checks={history ?? []} dimmed={status === "paused"} />
          <span className="sp-svc-meta">
            {latency !== undefined ? `${latency}ms` : "—"}
          </span>
          <span className="sp-svc-meta">· {target.interval_seconds}s</span>
          <span className="sp-svc-meta">
            {status === "paused"
              ? "· not monitored"
              : uptime !== null
                ? `· ${uptime}% uptime`
                : "· no data"}
          </span>
        </div>
      </div>

      <div className="sp-svc-actions" onClick={(e) => e.stopPropagation()}>
        {onEdit && (
          <button
            className="sp-action-btn"
            onClick={() => onEdit(target)}
            aria-label="Edit target"
            title="Edit"
          >
            ✎
          </button>
        )}
        {onDelete && (
          <button
            className="sp-action-btn sp-action-btn--danger"
            onClick={() => onDelete(target)}
            aria-label="Delete target"
            title="Delete"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
