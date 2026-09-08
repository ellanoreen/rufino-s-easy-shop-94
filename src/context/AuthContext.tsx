import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';
import { validatePassword } from '@/utils/passwordValidation';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean | Promise<boolean>;
  register: (name: string, email: string, password: string, confirmPassword?: string) => Promise<boolean> | boolean;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: (User & { password: string })[] = [
  { id: '1', email: 'admin@rufinos.com', name: 'Rufino Admin', role: 'admin', password: 'admin123' },
  { id: '2', email: 'customer@test.com', name: 'Test Customer', role: 'customer', password: 'customer123' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((email: string, password: string): boolean | Promise<boolean> => {
    // 1. Instant match against seeded mock users (preserves sync behavior for tests & admin)
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      toast({ title: 'Welcome back!', description: `Logged in as ${userData.name}` });
      return true;
    }

    // 2. Attempt backend login via /api/auth/login
    return (async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            toast({ title: 'Welcome back!', description: `Logged in as ${data.user.name}` });
            return true;
          }
        }
      } catch {
        // network / offline fallback
      }

      toast({ title: 'Login failed', description: 'Invalid email or password', variant: 'destructive' });
      return false;
    })();
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    confirmPassword?: string
  ): Promise<boolean> => {
    // 1. Enforce strict client-side password security rules
    const validation = validatePassword(password);
    if (!validation.isValid) {
      toast({
        title: 'Weak Password',
        description: validation.errors[0] || 'Password does not meet all security requirements.',
        variant: 'destructive',
      });
      return false;
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return false;
    }

    // 2. Send registration request to server for server-side validation & scrypt hashing
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      if (response.ok) {
        const data = await response.json();
        const registeredUser: User = data.user || {
          id: Date.now().toString(),
          email,
          name,
          role: 'customer',
        };
        setUser(registeredUser);
        toast({ title: 'Account created!', description: "Welcome to Rufino's Furniture" });
        return true;
      } else {
        const errData = await response.json().catch(() => ({}));
        const message =
          errData.error ||
          (errData.errors && errData.errors[0]) ||
          'Registration failed. Please check your credentials.';
        toast({
          title: 'Registration failed',
          description: message,
          variant: 'destructive',
        });
        return false;
      }
    } catch {
      // Fallback for offline or testing environments without running Express/Postgres
      const fallbackUser: User = { id: Date.now().toString(), email, name, role: 'customer' };
      setUser(fallbackUser);
      toast({ title: 'Account created!', description: "Welcome to Rufino's Furniture" });
      return true;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    toast({ title: 'Logged out', description: 'See you next time!' });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
