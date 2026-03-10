import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getAccessToken, setAccessToken } from "./api/client";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return getAccessToken() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function tryRestore() {
      if (getAccessToken()) {
        setReady(true);
        return;
      }
      try {
        const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
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
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
