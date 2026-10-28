import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Spinner } from "../components/Spinner";
import type { UserRole } from "../api/types";

interface ProtectedRouteProps {
  role?: UserRole;
  children: ReactNode;
}

export function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Spinner size="lg" label="Restoring session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    // Redirect user to their own role's home view
    const homePath = user.role === "admin" ? "/admin" : "/books";
    return <Navigate to={homePath} replace />;
  }

  return <>{children}</>;
}
