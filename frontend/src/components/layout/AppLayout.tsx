import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useWebSocket } from "../../hooks/useWebSocket";
import "../../styles/components/layout.css";

export function AppLayout() {
  const { connected } = useWebSocket();

  return (
    <div className="app-layout">
      <Sidebar connected={connected} />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
