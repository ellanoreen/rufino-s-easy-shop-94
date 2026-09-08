export interface PasswordCriteria {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  criteria: PasswordCriteria;
}

export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

/**
 * Validate customer password according to Rufino's Furniture security standards:
 * - At least 8 characters long
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (e.g. !@#$%^&*)
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password must be a string'],
      criteria: {
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
      },
    };
  }

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = SPECIAL_CHAR_REGEX.test(password);

  const errors: string[] = [];
  if (!hasMinLength) errors.push('Password must be at least 8 characters long.');
  if (!hasUppercase) errors.push('Password must contain at least 1 uppercase letter (A-Z).');
  if (!hasLowercase) errors.push('Password must contain at least 1 lowercase letter (a-z).');
  if (!hasNumber) errors.push('Password must contain at least 1 number (0-9).');
  if (!hasSpecialChar) errors.push('Password must contain at least 1 special character (e.g. !@#$%^&*).');

  return {
    isValid: errors.length === 0,
    errors,
    criteria: {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
    },
  };
}

export interface PasswordStrength {
  score: number; // 0 to 5
  percentage: number; // 0 to 100
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, percentage: 0, label: 'Weak', color: 'bg-slate-200 dark:bg-slate-700' };
  }

  const { criteria } = validatePassword(password);
  const metCount = Object.values(criteria).filter(Boolean).length;
  const percentage = Math.min(100, Math.round((metCount / 5) * 100));

  if (metCount <= 2) {
    return { score: metCount, percentage, label: 'Weak', color: 'bg-red-500' };
  }
  if (metCount === 3) {
    return { score: metCount, percentage, label: 'Fair', color: 'bg-amber-500' };
  }
  if (metCount === 4) {
    return { score: metCount, percentage, label: 'Good', color: 'bg-blue-500' };
  }
  return { score: 5, percentage: 100, label: 'Strong', color: 'bg-emerald-500' };
}
