import type { SystemMetrics } from "../../types";
import type { TempUnit } from "../../hooks/useSettings";
import "../../styles/components/metrics.css";

function formatBytes(bytes: number): string {
  const gb = bytes / 1024 / 1024 / 1024;
  return gb >= 1
    ? `${gb.toFixed(1)} GB`
    : `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTemp(celsius: number, unit: TempUnit): string {
  if (unit === "fahrenheit") {
    return `${((celsius * 9) / 5 + 32).toFixed(1)}°F`;
  }
  return `${celsius.toFixed(1)}°C`;
}

function tempPercent(celsius: number): number {
  return Math.min((celsius / 85) * 100, 100);
}

function progressClass(percent: number): string {
  if (percent > 85) return "metric-progress-bar--high";
  if (percent > 60) return "metric-progress-bar--medium";
  return "metric-progress-bar--low";
}

function MetricCard({
  label,
  value,
  sub,
  percent,
}: {
  label: string;
  value: string;
  sub?: string;
  percent?: number;
}) {
  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      {sub && <p className="metric-sub">{sub}</p>}
      {percent !== undefined && (
        <div className="metric-progress-track">
          <div
            className={`metric-progress-bar ${progressClass(percent)}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function MetricsCards({
  metrics,
  tempUnit,
}: {
  metrics: SystemMetrics;
  tempUnit: TempUnit;
}) {
  return (
    <div className="metrics-grid">
      <MetricCard
        label="CPU Temp"
        value={formatTemp(metrics.cpuTempCelsius, tempUnit)}
        percent={tempPercent(metrics.cpuTempCelsius)}
      />
      <MetricCard
        label="CPU"
        value={`${metrics.cpuUsagePercent.toFixed(1)}%`}
        percent={metrics.cpuUsagePercent}
      />
      <MetricCard
        label="Memory"
        value={`${metrics.memoryUsagePercent.toFixed(1)}%`}
        sub={`${formatBytes(metrics.memoryUsedBytes)} / ${formatBytes(metrics.memoryTotalBytes)}`}
        percent={metrics.memoryUsagePercent}
      />
      <MetricCard
        label="Disk"
        value={`${metrics.diskUsagePercent.toFixed(1)}%`}
        sub={`${formatBytes(metrics.diskUsedBytes)} / ${formatBytes(metrics.diskTotalBytes)}`}
        percent={metrics.diskUsagePercent}
      />
      <MetricCard label="Uptime" value={formatUptime(metrics.uptimeSeconds)} />
    </div>
  );
}
