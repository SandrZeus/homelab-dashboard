import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getAccessToken, setAccessToken } from "./api/client";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { AppLayout } from "./components/layout/AppLayout";
import ServicePatrol from "./pages/ServicePatrol";
import { WebSocketProvider } from "./hooks/useWebSocket";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return getAccessToken() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function tryRestore() {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
        }
      } catch {
      } finally {
        setReady(true);
      }
    }
    tryRestore();
  }, []);

  if (!ready) return null;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <PrivateRoute>
            <WebSocketProvider>
              <AppLayout />
            </WebSocketProvider>
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/servicepatrol" element={<ServicePatrol />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
