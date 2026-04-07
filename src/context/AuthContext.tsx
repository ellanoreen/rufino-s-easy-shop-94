import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
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

  const login = useCallback((email: string, password: string) => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      toast({ title: 'Welcome back!', description: `Logged in as ${userData.name}` });
      return true;
    }
    toast({ title: 'Login failed', description: 'Invalid email or password', variant: 'destructive' });
    return false;
  }, []);

  const register = useCallback((name: string, email: string, _password: string) => {
    const newUser: User = { id: Date.now().toString(), email, name, role: 'customer' };
    setUser(newUser);
    toast({ title: 'Account created!', description: 'Welcome to Rufino\'s Furniture' });
    return true;
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
