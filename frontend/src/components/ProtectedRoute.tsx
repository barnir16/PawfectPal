import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type ProtectedRouteProps = {
  children: ReactNode;
  requireProvider?: boolean;
};

export const ProtectedRoute = ({
  children,
  requireProvider = false,
}: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Provider-only page → check role
  if (requireProvider && !user?.is_provider) {
    // Redirect back or home
    return <Navigate to={location.state?.from || "/dashboard"} replace />;
  }

  return <>{children}</>;
};
