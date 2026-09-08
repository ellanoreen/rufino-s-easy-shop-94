import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, X, ShieldCheck, AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { validatePassword, calculatePasswordStrength } from '@/utils/passwordValidation';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Real-time password validation & strength computation
  const validation = useMemo(() => validatePassword(password), [password]);
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const isFormValid = useMemo(() => {
    return (
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      validation.isValid &&
      password === confirmPassword
    );
  }, [name, email, validation.isValid, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Verify all requirements before submission
    if (!validation.isValid) {
      setErrorMessage(
        validation.errors[0] || 'Password does not meet all security requirements.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter to confirm.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await register(name.trim(), email.trim(), password, confirmPassword);
      if (success) {
        navigate('/');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg shadow-lg border-border">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="font-display text-2xl font-bold tracking-tight">Create Account</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Join Rufino's Furniture with a secure customer account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20 animate-in fade-in-50"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="e.g. Maria Santos"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  required
                  className="pr-10"
                  autoComplete="new-password"
                  aria-describedby="password-requirements"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="pt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Strength:</span>
                    <span
                      className={`font-medium ${
                        strength.label === 'Strong'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : strength.label === 'Good'
                          ? 'text-blue-600 dark:text-blue-400'
                          : strength.label === 'Fair'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-500'
                      }`}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Password Requirements */}
              <div
                id="password-requirements"
                className="mt-3 p-3.5 rounded-lg bg-sky-50/70 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 text-xs space-y-1.5"
              >
                <p className="font-semibold text-sky-900 dark:text-sky-200 text-xs">
                  Password Requirements:
                </p>
                <div className="flex items-start gap-2 text-sky-700 dark:text-sky-300">
                  <Lock className="h-4 w-4 mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" />
                  <p className="leading-relaxed">
                    Your password must be at least 8 characters and should include a combination of numbers, letters and special characters (!$@%).
                  </p>
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  required
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Confirm Password Match Feedback */}
              {confirmPassword.length > 0 && (
                <div className="pt-1">
                  {passwordsMatch ? (
                    <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check className="h-3.5 w-3.5" />
                      <span>Passwords match</span>
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                      <X className="h-3.5 w-3.5" />
                      <span>Passwords do not match</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-4 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
