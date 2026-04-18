import { useWebSocket } from "../hooks/useWebSocket";
import { useSettings } from "../hooks/useSettings";
import { MetricsCards } from "../components/dashboard/MetricsCards";
import { PodsTable } from "../components/dashboard/PodsTable";
import "../styles/components/dashboard.css";

export default function Dashboard() {
  const { data } = useWebSocket();
  const { tempUnit } = useSettings();

  if (!data) return <p className="connecting-text">Connecting...</p>;

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>
      <MetricsCards metrics={data.metrics} tempUnit={tempUnit} />
      <PodsTable pods={data.pods} />
    </div>
  );
}
