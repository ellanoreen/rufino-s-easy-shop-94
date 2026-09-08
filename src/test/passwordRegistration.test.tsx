import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '@/pages/Register';
import { AuthProvider } from '@/context/AuthContext';
import { validatePassword, calculatePasswordStrength } from '@/utils/passwordValidation';
import { validatePassword as serverValidatePassword, hashPassword, verifyPassword } from '../../server/auth.js';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderRegister = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Password Validation Logic (Client & Server Parity)', () => {
  it('rejects passwords shorter than 8 characters', () => {
    const res = validatePassword('Ab1!xyz');
    expect(res.isValid).toBe(false);
    expect(res.criteria.hasMinLength).toBe(false);
    expect(res.errors).toContain('Password must be at least 8 characters long.');
  });

  it('rejects passwords without an uppercase letter', () => {
    const res = validatePassword('weakpass123!');
    expect(res.isValid).toBe(false);
    expect(res.criteria.hasUppercase).toBe(false);
    expect(res.errors).toContain('Password must contain at least 1 uppercase letter (A-Z).');
  });

  it('rejects passwords without a lowercase letter', () => {
    const res = validatePassword('WEAKPASS123!');
    expect(res.isValid).toBe(false);
    expect(res.criteria.hasLowercase).toBe(false);
    expect(res.errors).toContain('Password must contain at least 1 lowercase letter (a-z).');
  });

  it('rejects passwords without a number', () => {
    const res = validatePassword('WeakPassword!');
    expect(res.isValid).toBe(false);
    expect(res.criteria.hasNumber).toBe(false);
    expect(res.errors).toContain('Password must contain at least 1 number (0-9).');
  });

  it('rejects passwords without a special character', () => {
    const res = validatePassword('WeakPassword123');
    expect(res.isValid).toBe(false);
    expect(res.criteria.hasSpecialChar).toBe(false);
    expect(res.errors).toContain('Password must contain at least 1 special character (e.g. !@#$%^&*).');
  });

  it('accepts valid strong passwords meeting all 5 requirements', () => {
    const validPasswords = ['Rufino123!', 'Secur3#Pass', 'C0mplex@Furniture', 'Adm1n$Strong99'];
    for (const pwd of validPasswords) {
      const clientRes = validatePassword(pwd);
      const serverRes = serverValidatePassword(pwd);

      expect(clientRes.isValid).toBe(true);
      expect(clientRes.errors).toHaveLength(0);
      expect(clientRes.criteria.hasMinLength).toBe(true);
      expect(clientRes.criteria.hasUppercase).toBe(true);
      expect(clientRes.criteria.hasLowercase).toBe(true);
      expect(clientRes.criteria.hasNumber).toBe(true);
      expect(clientRes.criteria.hasSpecialChar).toBe(true);

      // Verify exact parity with backend validation
      expect(serverRes.isValid).toBe(true);
      expect(serverRes.errors).toHaveLength(0);
    }
  });

  it('calculates password strength accurately', () => {
    expect(calculatePasswordStrength('').label).toBe('Weak');
    expect(calculatePasswordStrength('abc').label).toBe('Weak');
    expect(calculatePasswordStrength('Abc123').label).toBe('Fair');
    expect(calculatePasswordStrength('Abc12345').label).toBe('Good');
    expect(calculatePasswordStrength('Abc12345!').label).toBe('Strong');
  });

  it('securely hashes and verifies passwords with scrypt on backend', () => {
    const plainPassword = 'CustomerSecure#2026';
    const { hash, salt } = hashPassword(plainPassword);

    expect(hash).toBeDefined();
    expect(salt).toBeDefined();
    expect(hash).not.toEqual(plainPassword);

    // Verify correct password matches
    expect(verifyPassword(plainPassword, hash, salt)).toBe(true);

    // Verify incorrect password fails
    expect(verifyPassword('WrongPassword123!', hash, salt)).toBe(false);
  });
});

describe('Customer Registration Form UI & Real-Time Validation', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.restoreAllMocks();
  });

  it('renders all required form fields, password checklist, and buttons', () => {
    renderRegister();

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password$/i)).toBeInTheDocument();

    // Password requirements single sentence
    expect(screen.getByText(/password requirements:/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /your password must be at least 8 characters and should include a combination of numbers, letters and special characters \(!\$@%\)\./i
      )
    ).toBeInTheDocument();

    // Create Account submit button
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('toggles Show/Hide Password and Confirm Password via eye icons', () => {
    renderRegister();

    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(/^confirm password$/i) as HTMLInputElement;

    const togglePasswordBtn = screen.getByRole('button', { name: /show password/i });
    const toggleConfirmBtn = screen.getByRole('button', { name: /show confirm password/i });

    expect(passwordInput.type).toBe('password');
    expect(confirmInput.type).toBe('password');

    // Toggle main password
    fireEvent.click(togglePasswordBtn);
    expect(passwordInput.type).toBe('text');
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(passwordInput.type).toBe('password');

    // Toggle confirm password
    fireEvent.click(toggleConfirmBtn);
    expect(confirmInput.type).toBe('text');
    expect(screen.getByRole('button', { name: /hide confirm password/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /hide confirm password/i }));
    expect(confirmInput.type).toBe('password');
  });

  it('updates password strength in real-time as user types', () => {
    renderRegister();

    const passwordInput = screen.getByLabelText(/^password$/i);

    // Type lowercase only: "abc"
    fireEvent.change(passwordInput, { target: { value: 'abc' } });
    expect(screen.getByText('Weak')).toBeInTheDocument();

    // Add uppercase and numbers: "abcA1"
    fireEvent.change(passwordInput, { target: { value: 'abcA1' } });
    expect(screen.getByText('Fair')).toBeInTheDocument();

    // Add more characters: "abcA1234"
    fireEvent.change(passwordInput, { target: { value: 'abcA1234' } });
    expect(screen.getByText('Good')).toBeInTheDocument();

    // Add special character: "abcA1234!"
    fireEvent.change(passwordInput, { target: { value: 'abcA1234!' } });
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('displays real-time feedback for Confirm Password match and mismatch', () => {
    renderRegister();

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/^confirm password$/i);

    fireEvent.change(passwordInput, { target: { value: 'RufinoPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPass' } });

    // Should show mismatch
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();

    // Correct confirm password
    fireEvent.change(confirmInput, { target: { value: 'RufinoPass123!' } });
    expect(screen.getByText('Passwords match')).toBeInTheDocument();
  });

  it('keeps submit button disabled until all criteria and confirm password match', () => {
    renderRegister();

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/^confirm password$/i);
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    // Fill name and email
    fireEvent.change(nameInput, { target: { value: 'Juan Dela Cruz' } });
    fireEvent.change(emailInput, { target: { value: 'juan@example.com' } });
    expect(submitBtn).toBeDisabled();

    // Fill weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.change(confirmInput, { target: { value: 'weak' } });
    expect(submitBtn).toBeDisabled();

    // Fill strong password but mismatched confirm
    fireEvent.change(passwordInput, { target: { value: 'Strong#Pass2026' } });
    fireEvent.change(confirmInput, { target: { value: 'Mismatch#Pass2026' } });
    expect(submitBtn).toBeDisabled();

    // Match confirm password
    fireEvent.change(confirmInput, { target: { value: 'Strong#Pass2026' } });
    expect(submitBtn).not.toBeDisabled();
  });

  it('submits registration successfully when all criteria are satisfied', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Account created successfully',
        user: { id: 'u-100', name: 'Maria Santos', email: 'maria@example.com', role: 'customer' },
      }),
    });

    renderRegister();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Maria Santos' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'maria@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'MariaSantos@2026' } });
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), { target: { value: 'MariaSantos@2026' } });

    const submitBtn = screen.getByRole('button', { name: /create account/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
