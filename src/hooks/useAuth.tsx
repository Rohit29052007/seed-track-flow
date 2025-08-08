import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useRateLimiter } from './useRateLimiter';
import { useInputValidation } from './useInputValidation';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Rate limiting for auth attempts
  const signInLimiter = useRateLimiter('signIn', {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 15 * 60 * 1000 // 15 minutes
  });
  
  const signUpLimiter = useRateLimiter('signUp', {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000 // 1 hour
  });
  
  const { validateField, sanitizeInput } = useInputValidation();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    // Rate limiting check
    const clientId = 'user'; // In a real app, you might use IP address or session ID
    if (signUpLimiter.isBlocked(clientId)) {
      const remaining = signUpLimiter.getBlockedTimeRemaining(clientId);
      const minutes = Math.ceil(remaining / (60 * 1000));
      return { 
        error: { 
          message: `Too many signup attempts. Please try again in ${minutes} minutes.` 
        } 
      };
    }
    
    // Input validation
    const emailValidation = validateField(email, { 
      required: true, 
      email: true, 
      maxLength: 254 
    });
    if (!emailValidation.isValid) {
      return { error: { message: emailValidation.error } };
    }
    
    const passwordValidation = validateField(password, { 
      required: true, 
      strongPassword: true,
      maxLength: 128 
    });
    if (!passwordValidation.isValid) {
      return { error: { message: passwordValidation.error } };
    }
    
    if (fullName) {
      const nameValidation = validateField(fullName, { 
        maxLength: 100,
        pattern: /^[a-zA-Z\s\-'\.]+$/ // Allow letters, spaces, hyphens, apostrophes, dots
      });
      if (!nameValidation.isValid) {
        return { error: { message: 'Please enter a valid name (letters, spaces, hyphens, and apostrophes only)' } };
      }
    }
    
    // Record attempt
    signUpLimiter.recordAttempt(clientId);
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());
    const sanitizedFullName = fullName ? sanitizeInput(fullName.trim()) : '';
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password, // Don't sanitize password as it may contain special characters intentionally
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: sanitizedFullName
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Rate limiting check
    const clientId = 'user'; // In a real app, you might use IP address or session ID
    if (signInLimiter.isBlocked(clientId)) {
      const remaining = signInLimiter.getBlockedTimeRemaining(clientId);
      const minutes = Math.ceil(remaining / (60 * 1000));
      return { 
        error: { 
          message: `Too many login attempts. Please try again in ${minutes} minutes.` 
        } 
      };
    }
    
    // Input validation
    const emailValidation = validateField(email, { 
      required: true, 
      email: true, 
      maxLength: 254 
    });
    if (!emailValidation.isValid) {
      return { error: { message: emailValidation.error } };
    }
    
    const passwordValidation = validateField(password, { 
      required: true, 
      maxLength: 128 
    });
    if (!passwordValidation.isValid) {
      return { error: { message: passwordValidation.error } };
    }
    
    // Record attempt
    signInLimiter.recordAttempt(clientId);
    
    // Sanitize email input
    const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());
    
    const { error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password, // Don't sanitize password
    });
    return { error };
  };

  const signOut = async () => {
    const cleanupAuthState = () => {
      // Clear auth state and rate limiting data
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.startsWith('rateLimit_')) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    };

    try {
      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });
      window.location.href = '/auth';
    } catch (error) {
      // Error signing out - redirect anyway for security
      window.location.href = '/auth';
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    // Expose rate limiting info for UI feedback
    getSignInAttemptsRemaining: () => signInLimiter.getRemainingAttempts('user'),
    getSignUpAttemptsRemaining: () => signUpLimiter.getRemainingAttempts('user'),
    isSignInBlocked: () => signInLimiter.isBlocked('user'),
    isSignUpBlocked: () => signUpLimiter.isBlocked('user')
  };
};