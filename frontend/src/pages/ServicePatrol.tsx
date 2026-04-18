import { useServicePatrolTargets } from "../hooks/useServicePatrolTargets";
import { TargetList } from "../components/servicepatrol/TargetList";
import "../styles/components/servicepatrol.css";

export default function ServicePatrol() {
  const { data: targets, isLoading, isError } = useServicePatrolTargets();

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

      {targets && targets.length > 0 && <TargetList targets={targets} />}
    </div>
  );
}
