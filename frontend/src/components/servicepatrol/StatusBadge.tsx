import "../../styles/components/servicepatrol.css";

export type Status = "up" | "down" | "unknown";

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className="sp-status">
      <span className={`sp-status-dot sp-status-dot--${status}`} />
      <span className="sp-status-label">{label ?? status}</span>
    </span>
  );
}
