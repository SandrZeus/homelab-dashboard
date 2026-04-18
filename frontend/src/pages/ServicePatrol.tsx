import {
  useServicePatrolTargets,
  useDeleteTarget,
} from "../hooks/useServicePatrolTargets";
import { TargetList } from "../components/servicepatrol/TargetList";
import type { Target } from "../types";
import "../styles/components/servicepatrol.css";

export default function ServicePatrol() {
  const { data: targets, isLoading, isError } = useServicePatrolTargets();
  const deleteMutation = useDeleteTarget();

  const handleDelete = (target: Target) => {
    if (!confirm(`Delete target "${target.name}"?`)) return;
    deleteMutation.mutate(target.id);
  };

  return (
    <div className="sp-page">
      <div className="sp-header">
        <h1 className="sp-title">ServicePatrol</h1>
        <button className="sp-btn sp-btn--primary">+ Add target</button>
      </div>

      {isLoading && <p className="sp-empty">Loading targets...</p>}

      {isError && (
        <p className="sp-empty">
          Failed to load targets. Is ServicePatrol running?
        </p>
      )}

      {targets && targets.length === 0 && (
        <p className="sp-empty">No targets configured yet.</p>
      )}

      {targets && targets.length > 0 && (
        <TargetList targets={targets} onDelete={handleDelete} />
      )}
    </div>
  );
}
