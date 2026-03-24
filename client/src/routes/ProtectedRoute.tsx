import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore.persist.hasHydrated();

  // 🔥 Wait for Zustand to load persisted state
  if (!hasHydrated) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore.persist.hasHydrated();

  if (!hasHydrated) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}