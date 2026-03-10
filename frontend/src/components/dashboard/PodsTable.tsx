import type { PodSummary } from "../../types";
import "../../styles/components/pods.css";

function formatBytes(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)}G` : `${mb.toFixed(0)}M`;
}

function StatusBadge({ ready, phase }: { ready: boolean; phase: string }) {
  const ok = ready && phase === "Running";
  return (
    <span className="status-badge">
      <span
        className={`status-dot ${ok ? "status-dot--running" : "status-dot--error"}`}
      />
      <span className={ok ? "status-text--running" : "status-text--error"}>
        {phase}
      </span>
    </span>
  );
}

export function PodsTable({ pods }: { pods: PodSummary[] }) {
  return (
    <div className="pods-container">
      <div className="pods-header">
        <h2 className="pods-title">
          Pods <span className="pods-count">({pods.length})</span>
        </h2>
      </div>
      <div className="pods-table-wrapper">
        <table className="pods-table">
          <thead>
            <tr>
              {[
                "Name",
                "Namespace",
                "Status",
                "Restarts",
                "CPU",
                "Memory",
                "Age",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pods.map((pod) => (
              <tr key={`${pod.namespace}/${pod.name}`}>
                <td className="pod-name">{pod.name}</td>
                <td className="pod-namespace">{pod.namespace}</td>
                <td>
                  <StatusBadge ready={pod.ready} phase={pod.phase} />
                </td>
                <td
                  className={
                    pod.restarts > 0 ? "pod-restarts--warn" : "pod-restarts--ok"
                  }
                >
                  {pod.restarts}
                </td>
                <td className="pod-resource">{pod.cpuCores}m</td>
                <td className="pod-resource">{formatBytes(pod.memoryBytes)}</td>
                <td className="pod-resource">{pod.age}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
