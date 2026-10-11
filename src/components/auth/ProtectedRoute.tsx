/**
 * NagarSetu – Protected Route Guard
 *
 * Wraps any view that requires authentication.
 * Role-based access is enforced here – the server role from the session
 * determines what the user can see, never the URL or browser state.
 */

import React from 'react';
import { useAuth, AuthUser } from '../../context/AuthContext';
import { LoginPage, type PortalChoice } from './LoginPage';
import { AccessDeniedPage } from './AccessDeniedPage';
import { SessionLoadingScreen } from './SessionLoadingScreen';

export type RequiredRole = 'citizen' | 'officer' | 'admin';

interface ProtectedRouteProps {
  allowedRoles: RequiredRole[];
  children: React.ReactNode;
  /** Called when the user successfully logs in (to trigger redirect/rerender) */
  onLoginSuccess?: () => void;
  onRegisterClick?: () => void;
  onGoHome?: () => void;
}

function meetsRoleRequirement(user: AuthUser, allowedRoles: RequiredRole[]): boolean {
  return allowedRoles.includes(user.role as RequiredRole);
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
  onLoginSuccess,
  onRegisterClick,
  onGoHome,
}) => {
  const { user, status } = useAuth();
  const [portal, setPortal] = React.useState<PortalChoice>('citizen');

  if (status === 'loading') {
    return <SessionLoadingScreen />;
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <LoginPage
        portal={portal}
        onPortalChange={setPortal}
        onLoginSuccess={onLoginSuccess ?? (() => {})}
        onRegisterClick={onRegisterClick ?? (() => {})}
      />
    );
  }

  if (!meetsRoleRequirement(user, allowedRoles)) {
    return (
      <AccessDeniedPage
        reason={`This portal requires a ${allowedRoles.join(' or ')} account. You are signed in as ${user.role}.`}
        onGoHome={onGoHome ?? (() => {})}
      />
    );
  }

  return <>{children}</>;
};
