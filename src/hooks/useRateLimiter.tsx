import { useState, useCallback } from 'react';

interface RateLimiterConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  blocked: boolean;
  blockedUntil?: number;
}

export const useRateLimiter = (key: string, config: RateLimiterConfig) => {
  const [attempts, setAttempts] = useState<Map<string, AttemptRecord>>(new Map());

  const isBlocked = useCallback((identifier: string = 'default'): boolean => {
    const storageKey = `rateLimit_${key}_${identifier}`;
    const now = Date.now();
    
    // Check localStorage for persistence across page reloads
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed: AttemptRecord = JSON.parse(stored);
        if (parsed.blocked && parsed.blockedUntil && now < parsed.blockedUntil) {
          return true;
        }
        if (parsed.blocked && parsed.blockedUntil && now >= parsed.blockedUntil) {
          // Block expired, clean up
          localStorage.removeItem(storageKey);
          setAttempts(prev => {
            const newMap = new Map(prev);
            newMap.delete(identifier);
            return newMap;
          });
          return false;
        }
      } catch (e) {
        // Invalid stored data, clean up
        localStorage.removeItem(storageKey);
      }
    }

    const attempt = attempts.get(identifier);
    if (!attempt) return false;

    if (attempt.blocked && attempt.blockedUntil && now < attempt.blockedUntil) {
      return true;
    }

    return false;
  }, [key, attempts, config.blockDurationMs]);

  const recordAttempt = useCallback((identifier: string = 'default'): boolean => {
    const storageKey = `rateLimit_${key}_${identifier}`;
    const now = Date.now();

    if (isBlocked(identifier)) {
      return false; // Already blocked
    }

    setAttempts(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(identifier);
      
      if (!existing || (now - existing.firstAttempt) > config.windowMs) {
        // First attempt or outside window, reset
        const newRecord: AttemptRecord = {
          count: 1,
          firstAttempt: now,
          blocked: false
        };
        newMap.set(identifier, newRecord);
        localStorage.setItem(storageKey, JSON.stringify(newRecord));
        return newMap;
      }

      // Within window, increment
      const newCount = existing.count + 1;
      if (newCount >= config.maxAttempts) {
        // Block the identifier
        const blockedRecord: AttemptRecord = {
          ...existing,
          count: newCount,
          blocked: true,
          blockedUntil: now + config.blockDurationMs
        };
        newMap.set(identifier, blockedRecord);
        localStorage.setItem(storageKey, JSON.stringify(blockedRecord));
      } else {
        const updatedRecord: AttemptRecord = {
          ...existing,
          count: newCount
        };
        newMap.set(identifier, updatedRecord);
        localStorage.setItem(storageKey, JSON.stringify(updatedRecord));
      }

      return newMap;
    });

    return true; // Attempt recorded successfully
  }, [key, attempts, config, isBlocked]);

  const getRemainingAttempts = useCallback((identifier: string = 'default'): number => {
    if (isBlocked(identifier)) return 0;
    
    const attempt = attempts.get(identifier);
    if (!attempt) return config.maxAttempts;
    
    const now = Date.now();
    if ((now - attempt.firstAttempt) > config.windowMs) {
      return config.maxAttempts; // Outside window
    }
    
    return Math.max(0, config.maxAttempts - attempt.count);
  }, [attempts, config, isBlocked]);

  const getBlockedTimeRemaining = useCallback((identifier: string = 'default'): number => {
    const attempt = attempts.get(identifier);
    if (!attempt || !attempt.blocked || !attempt.blockedUntil) return 0;
    
    const now = Date.now();
    return Math.max(0, attempt.blockedUntil - now);
  }, [attempts]);

  return {
    isBlocked,
    recordAttempt,
    getRemainingAttempts,
    getBlockedTimeRemaining
  };
};