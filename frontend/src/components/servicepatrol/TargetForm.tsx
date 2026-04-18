import { useState, useEffect } from "react";
import type { Target } from "../../types";
import {
  useCreateTarget,
  useUpdateTarget,
} from "../../hooks/useServicePatrolTargets";
import "../../styles/components/servicepatrol.css";

interface TargetFormProps {
  target?: Target;
  onClose: () => void;
}

const DEFAULTS = {
  name: "",
  url: "",
  method: "GET",
  interval_seconds: 30,
  timeout_seconds: 5,
  expected_status: 200,
  active: true,
};

export function TargetForm({ target, onClose }: TargetFormProps) {
  const [form, setForm] = useState(() =>
    target
      ? {
          name: target.name,
          url: target.url,
          method: target.method,
          interval_seconds: target.interval_seconds,
          timeout_seconds: target.timeout_seconds,
          expected_status: target.expected_status,
          active: target.active,
        }
      : DEFAULTS,
  );

  const createMutation = useCreateTarget();
  const updateMutation = useUpdateTarget();
  const isEdit = target !== undefined;
  const mutation = isEdit ? updateMutation : createMutation;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isEdit) {
      updateMutation.mutate(
        { id: target.id, target: form },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate(form, { onSuccess: onClose });
    }
  };

  return (
    <div className="sp-modal-backdrop">
      <div className="sp-modal" role="dialog" aria-labelledby="sp-form-title">
        <div className="sp-modal-header">
          <h2 id="sp-form-title" className="sp-modal-title">
            {isEdit ? "Edit target" : "New target"}
          </h2>
          <button
            className="sp-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="sp-form">
          <div className="sp-field">
            <label htmlFor="sp-name">Name</label>
            <input
              id="sp-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="sp-field">
            <label htmlFor="sp-url">URL</label>
            <input
              id="sp-url"
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://example.com/health"
              required
            />
          </div>

          <div className="sp-field-row">
            <div className="sp-field">
              <label htmlFor="sp-method">Method</label>
              <select
                id="sp-method"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
              >
                <option value="GET">GET</option>
                <option value="HEAD">HEAD</option>
                <option value="POST">POST</option>
              </select>
            </div>

            <div className="sp-field">
              <label htmlFor="sp-status">Expected status</label>
              <input
                id="sp-status"
                type="number"
                value={form.expected_status}
                onChange={(e) =>
                  setForm({ ...form, expected_status: Number(e.target.value) })
                }
                min={100}
                max={599}
                required
              />
            </div>
          </div>

          <div className="sp-field-row">
            <div className="sp-field">
              <label htmlFor="sp-interval">Interval (seconds)</label>
              <input
                id="sp-interval"
                type="number"
                value={form.interval_seconds}
                onChange={(e) =>
                  setForm({ ...form, interval_seconds: Number(e.target.value) })
                }
                min={5}
                max={3600}
                required
              />
            </div>

            <div className="sp-field">
              <label htmlFor="sp-timeout">Timeout (seconds)</label>
              <input
                id="sp-timeout"
                type="number"
                value={form.timeout_seconds}
                onChange={(e) =>
                  setForm({ ...form, timeout_seconds: Number(e.target.value) })
                }
                min={1}
                max={60}
                required
              />
            </div>
          </div>

          <div className="sp-field sp-field--checkbox">
            <label>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active (actively monitor this target)
            </label>
          </div>

          {mutation.isError && (
            <p className="sp-form-error">
              Failed to save. Check your input and try again.
            </p>
          )}

          <div className="sp-modal-actions">
            <button
              type="button"
              className="sp-btn"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="sp-btn sp-btn--primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Create target"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
