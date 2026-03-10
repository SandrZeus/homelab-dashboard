import { useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useTheme } from "../hooks/useTheme";
import { useSettings } from "../hooks/useSettings";
import { MetricsCards } from "../components/dashboard/MetricsCards";
import { PodsTable } from "../components/dashboard/PodsTable";
import { SettingsModal } from "../components/ui/SettingsModal";
import { SettingsIcon } from "../components/ui/SettingsIcon";
import "../styles/components/dashboard.css";

export default function Dashboard() {
  const { data, connected } = useWebSocket();
  const { theme, setTheme } = useTheme();
  const { tempUnit, setTempUnit } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Homelab Dashboard</h1>
        <div className="dashboard-header-right">
          <div className="live-indicator">
            <div
              className={`live-dot ${connected ? "live-dot--connected" : "live-dot--disconnected"}`}
            />
            <span className="live-label">
              {connected ? "Live" : "Reconnecting..."}
            </span>
          </div>
          <button
            className="settings-btn"
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      {!data ? (
        <p className="connecting-text">Connecting...</p>
      ) : (
        <>
          <MetricsCards metrics={data.metrics} tempUnit={tempUnit} />
          <PodsTable pods={data.pods} />
        </>
      )}

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          theme={theme}
          setTheme={setTheme}
          tempUnit={tempUnit}
          setTempUnit={setTempUnit}
        />
      )}
    </div>
  );
}
