import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { apiRequest } from "./lib/api";

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("ttm_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await apiRequest("/api/auth/me");
        setUser(currentUser);
      } catch {
        localStorage.removeItem("ttm_token");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  if (loading) {
    return <div className="screen-center">Loading workspace...</div>;
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/" replace /> : <AuthPage onAuthSuccess={setUser} />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute user={user}>
            <DashboardPage
              user={user}
              onLogout={() => {
                localStorage.removeItem("ttm_token");
                setUser(null);
              }}
            />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? "/" : "/auth"} replace />} />
    </Routes>
  );
}
