import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute:
 * - Guarantees that unauthenticated users cannot access in-app workspace routes.
 * - If not authenticated (currentUser is null or token missing), redirects immediately to /login with replace: true.
 * - If requireRole is specified (e.g. 'INSTITUTION') or requireInstitution is true, checks if user has that role.
 *   If not, redirects to /feed with replace: true.
 */
export default function ProtectedRoute({ children, requireRole = null, requireInstitution = false }) {
  const { currentUser, token, isAuthenticated, isInstitution } = useAuth();
  const location = useLocation();

  const effectiveRequireRole = (requireInstitution || requireRole === 'INSTITUTION') ? 'INSTITUTION' : requireRole;

  if (!isAuthenticated || !currentUser || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (effectiveRequireRole === 'INSTITUTION' && !isInstitution) {
    return <Navigate to="/feed" replace state={{ roleRequired: 'INSTITUTION' }} />;
  }

  return children;
}
