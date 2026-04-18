import type { Target } from "../../types";
import { StatusBadge } from "./StatusBadge";
import "../../styles/components/servicepatrol.css";

interface TargetListProps {
  targets: Target[];
  onSelect?: (target: Target) => void;
  onEdit?: (target: Target) => void;
  onDelete?: (target: Target) => void;
}

export function TargetList({
  targets,
  onSelect,
  onEdit,
  onDelete,
}: TargetListProps) {
  return (
    <div className="sp-list-wrap">
      <table className="sp-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>URL</th>
            <th>Status</th>
            <th>Interval</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {targets.map((t) => (
            <tr key={t.id} onClick={() => onSelect?.(t)} className="sp-row">
              <td className="sp-cell-name">{t.name}</td>
              <td className="sp-cell-url">{t.url}</td>
              <td>
                <StatusBadge
                  status={t.active ? "unknown" : "down"}
                  label={t.active ? "active" : "paused"}
                />
              </td>
              <td className="sp-cell-interval">{t.interval_seconds}s</td>
              <td className="sp-cell-actions">
                {onEdit && (
                  <button
                    className="sp-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(t);
                    }}
                    aria-label="Edit"
                  >
                    ✎
                  </button>
                )}
                {onDelete && (
                  <button
                    className="sp-action-btn sp-action-btn--danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(t);
                    }}
                    aria-label="Delete"
                  >
                    ×
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
