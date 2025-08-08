import { useState, useCallback } from 'react';

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  strongPassword?: boolean;
  custom?: (value: string) => string | null;
}

interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export const useInputValidation = () => {
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validateField = useCallback((value: string, rules: ValidationRules): ValidationResult => {
    // Required check
    if (rules.required && (!value || value.trim() === '')) {
      return { isValid: false, error: 'This field is required' };
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) {
      return { isValid: true, error: null };
    }

    // Length checks
    if (rules.minLength && value.length < rules.minLength) {
      return { isValid: false, error: `Minimum length is ${rules.minLength} characters` };
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return { isValid: false, error: `Maximum length is ${rules.maxLength} characters` };
    }

    // Email validation
    if (rules.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { isValid: false, error: 'Please enter a valid email address' };
      }
    }

    // Strong password validation
    if (rules.strongPassword) {
      if (value.length < 8) {
        return { isValid: false, error: 'Password must be at least 8 characters long' };
      }
      if (!/(?=.*[a-z])/.test(value)) {
        return { isValid: false, error: 'Password must contain at least one lowercase letter' };
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        return { isValid: false, error: 'Password must contain at least one uppercase letter' };
      }
      if (!/(?=.*\d)/.test(value)) {
        return { isValid: false, error: 'Password must contain at least one number' };
      }
      if (!/(?=.*[@$!%*?&])/.test(value)) {
        return { isValid: false, error: 'Password must contain at least one special character (@$!%*?&)' };
      }
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return { isValid: false, error: 'Please enter a valid format' };
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return { isValid: false, error: customError };
      }
    }

    return { isValid: true, error: null };
  }, []);

  const updateFieldError = useCallback((fieldName: string, error: string | null) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  const validateAndUpdateField = useCallback((fieldName: string, value: string, rules: ValidationRules) => {
    const result = validateField(value, rules);
    updateFieldError(fieldName, result.error);
    return result;
  }, [validateField, updateFieldError]);

  const clearFieldError = useCallback((fieldName: string) => {
    updateFieldError(fieldName, null);
  }, [updateFieldError]);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasErrors = useCallback(() => {
    return Object.values(errors).some(error => error !== null);
  }, [errors]);

  // Sanitize input to prevent XSS
  const sanitizeInput = useCallback((value: string): string => {
    return value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }, []);

  return {
    errors,
    validateField,
    validateAndUpdateField,
    updateFieldError,
    clearFieldError,
    clearAllErrors,
    hasErrors,
    sanitizeInput
  };
};