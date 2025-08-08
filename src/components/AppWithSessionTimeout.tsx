import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { SessionTimeoutModal } from './SessionTimeoutModal';

interface AppWithSessionTimeoutProps {
  children: React.ReactNode;
}

export const AppWithSessionTimeout: React.FC<AppWithSessionTimeoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Session timeout configuration - 30 minutes with 2 minute warning
  const sessionConfig = {
    timeoutMs: 30 * 60 * 1000, // 30 minutes
    warningMs: 2 * 60 * 1000,  // 2 minutes warning
    onTimeout: () => {
      setShowWarning(false);
      signOut();
    },
    onWarning: () => {
      setTimeRemaining(2 * 60 * 1000); // 2 minutes in milliseconds
      setShowWarning(true);
    }
  };

  const { extendSession, getTimeRemaining } = useSessionTimeout(sessionConfig);

  const handleExtendSession = () => {
    setShowWarning(false);
    extendSession();
  };

  const handleLogout = () => {
    setShowWarning(false);
    signOut();
  };

  // Update time remaining for countdown
  React.useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        setShowWarning(false);
        signOut();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning, getTimeRemaining, signOut]);

  return (
    <>
      {children}
      {user && (
        <SessionTimeoutModal
          isOpen={showWarning}
          timeRemaining={timeRemaining}
          onExtendSession={handleExtendSession}
          onLogout={handleLogout}
        />
      )}
    </>
  );
};