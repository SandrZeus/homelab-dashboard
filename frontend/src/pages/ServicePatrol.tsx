import { useState } from "react";
import {
  useServicePatrolTargets,
  useDeleteTarget,
} from "../hooks/useServicePatrolTargets";
import { useServicePatrolEvents } from "../hooks/useServicePatrolEvents";
import { ServiceCard } from "../components/servicepatrol/ServiceCard";
import { SummaryCards } from "../components/servicepatrol/SummaryCards";
import { TargetForm } from "../components/servicepatrol/TargetForm";
import { TargetHistory } from "../components/servicepatrol/TargetHistory";
import type { Target } from "../types";
import "../styles/components/servicepatrol.css";

export default function ServicePatrol() {
  useServicePatrolEvents({ enabled: true });

  const { data: targets, isLoading, isError } = useServicePatrolTargets();
  const deleteMutation = useDeleteTarget();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Target | undefined>(undefined);
  const [historyTarget, setHistoryTarget] = useState<Target | null>(null);

  const handleCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const handleEdit = (target: Target) => {
    setEditing(target);
    setFormOpen(true);
  };

  const handleDelete = (target: Target) => {
    if (!confirm(`Delete target "${target.name}"?`)) return;
    deleteMutation.mutate(target.id);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditing(undefined);
  };

  return (
    <div className="sp-page">
      <div className="sp-header">
        <h1 className="sp-title">ServicePatrol</h1>
        <button className="sp-btn sp-btn--primary" onClick={handleCreate}>
          + Add target
        </button>
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
        <>
          <SummaryCards targets={targets} />
          <div className="sp-svc-list">
            {targets.map((t) => (
              <ServiceCard
                key={t.id}
                target={t}
                onSelect={setHistoryTarget}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {formOpen && <TargetForm target={editing} onClose={handleFormClose} />}
      {historyTarget && (
        <TargetHistory
          target={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
}
