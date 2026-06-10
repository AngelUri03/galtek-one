import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function RequireGuest() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/ventas" replace /> : <Outlet />;
}