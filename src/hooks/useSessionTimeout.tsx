import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

interface SessionTimeoutConfig {
  timeoutMs: number; // Session timeout in milliseconds
  warningMs: number; // Show warning before this many milliseconds before timeout
  onTimeout: () => void;
  onWarning?: () => void;
}

export const useSessionTimeout = (config: SessionTimeoutConfig) => {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Only set timers if user is authenticated
    if (!user) return;

    // Set warning timer
    if (config.onWarning) {
      warningRef.current = setTimeout(() => {
        config.onWarning?.();
      }, config.timeoutMs - config.warningMs);
    }

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      config.onTimeout();
    }, config.timeoutMs);
  }, [user, config]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!user) {
      // Clear timers when user logs out
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
      return;
    }

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [user, handleActivity, resetTimer]);

  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const getTimeRemaining = useCallback(() => {
    if (!user) return 0;
    const elapsed = Date.now() - lastActivityRef.current;
    return Math.max(0, config.timeoutMs - elapsed);
  }, [user, config.timeoutMs]);

  return {
    extendSession,
    getTimeRemaining
  };
};