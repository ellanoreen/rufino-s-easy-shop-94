import crypto from 'crypto';

/**
 * Validate customer password according to security requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (e.g. !@#$%^&*)
 */
export function validatePassword(password) {
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
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  const errors = [];
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

/**
 * Hash a password securely with a cryptographically random salt using scrypt.
 * Never stores plain text passwords.
 */
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

/**
 * Verify a plain text password against a stored hash and salt.
 */
export function verifyPassword(password, hash, salt) {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(hash, 'hex');
    if (derivedKey.length !== keyBuffer.length) return false;
    return crypto.timingSafeEqual(derivedKey, keyBuffer);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
