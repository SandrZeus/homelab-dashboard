import { useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Target, Check } from "../../types";
import { useTargetHistory } from "../../hooks/useServicePatrolTargets";
import {
  deriveTransitions,
  findLatestCheckForTransition,
  type Transition,
} from "./historyHelpers";
import "../../styles/components/servicepatrol.css";

interface TargetHistoryProps {
  target: Target;
  onClose: () => void;
}

export function TargetHistory({ target, onClose }: TargetHistoryProps) {
  const { data: history, isLoading, isError } = useTargetHistory(target.id);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const chronological = history ? [...history].reverse() : [];
  const successCount = chronological.filter((c) => c.success).length;
  const failureCount = chronological.length - successCount;
  const avgLatency = chronological.length
    ? Math.round(
        chronological.reduce((a, c) => a + c.response_time_ms, 0) /
          chronological.length,
      )
    : 0;

  const chartData = chronological.map((c) => ({
    time: new Date(c.checked_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    latency: c.response_time_ms,
  }));

  const transitions = history ? deriveTransitions(history) : [];

  return (
    <div className="sp-modal-backdrop">
      <div
        className="sp-modal sp-modal--wide"
        role="dialog"
        aria-labelledby="sp-history-title"
      >
        <div className="sp-modal-header">
          <div>
            <h2 id="sp-history-title" className="sp-modal-title">
              {target.name}
            </h2>
            <p className="sp-modal-subtitle">{target.url}</p>
          </div>
          <button
            className="sp-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="sp-history-body">
          {isLoading && <p className="sp-empty">Loading history...</p>}
          {isError && <p className="sp-empty">Failed to load history.</p>}
          {history && history.length === 0 && (
            <p className="sp-empty">No checks recorded yet.</p>
          )}

          {history && history.length > 0 && (
            <>
              <div className="sp-stats">
                <Stat label="Checks" value={chronological.length.toString()} />
                <Stat
                  label="Successful"
                  value={successCount.toString()}
                  tone="ok"
                />
                <Stat
                  label="Failed"
                  value={failureCount.toString()}
                  tone={failureCount > 0 ? "err" : "default"}
                />
                <Stat label="Avg latency" value={`${avgLatency}ms`} />
              </div>

              <div className="sp-chart-wrap">
                <LatencyChart data={chartData} />
              </div>

              <div className="sp-transitions">
                <h3 className="sp-section-header">State changes</h3>
                {transitions.length === 0 && (
                  <p className="sp-empty sp-empty--inline">
                    No state changes observed.
                  </p>
                )}
                {transitions.length > 0 && (
                  <div className="sp-history-list">
                    <table className="sp-table">
                      <tbody>
                        {transitions.map((t, i) => (
                          <TransitionRow
                            key={`${t.at}-${i}`}
                            transition={t}
                            latestCheck={findLatestCheckForTransition(
                              chronological,
                              t,
                            )}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "err";
}) {
  return (
    <div className="sp-stat">
      <div className="sp-stat-label">{label}</div>
      <div className={`sp-stat-value sp-stat-value--${tone}`}>{value}</div>
    </div>
  );
}

function LatencyChart({ data }: { data: { time: string; latency: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
          stroke="var(--border-primary)"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
          stroke="var(--border-primary)"
          unit="ms"
        />
        <Tooltip
          contentStyle={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary)",
            borderRadius: 6,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--text-primary)" }}
        />
        <Line
          type="monotone"
          dataKey="latency"
          stroke="var(--accent-blue)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function TransitionRow({
  transition: t,
  latestCheck,
}: {
  transition: Transition;
  latestCheck?: Check;
}) {
  const isUp = t.to === "ok";
  const code = latestCheck?.status_code;
  const codeText = latestCheck
    ? latestCheck.error_message
      ? `- ${latestCheck.error_message}`
      : code
        ? `${code} - ${isUp ? "OK" : "Error"}`
        : ""
    : "";

  const time = new Date(t.at).toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <tr>
      <td className="sp-tr-status">
        <span
          className={`sp-status-pill sp-status-pill--${isUp ? "up" : "down"}`}
        >
          {isUp ? "Up" : "Down"}
        </span>
      </td>
      <td className="sp-tr-time">{time}</td>
      <td className="sp-tr-info">{codeText}</td>
    </tr>
  );
}
