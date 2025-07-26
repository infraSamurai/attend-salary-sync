import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedComponentProps {
  children: React.ReactNode;
  permission?: string;
  roles?: string | string[];
  fallback?: React.ReactNode;
}

const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  permission,
  roles,
  fallback = null
}) => {
  const { hasPermission, hasRole } = useAuth();

  // Check permission if specified
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check roles if specified
  if (roles && !hasRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedComponent;