import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

interface RoleGuardProps {
  role: 'customer' | 'admin';
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ role, children }) => {
  const { user, isAdmin } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (role === 'admin' && !isAdmin) return <Navigate to="/" replace />;
  if (role === 'customer' && isAdmin) return <Navigate to="/admin" replace />;

  return <>{children}</>;
};

export default RoleGuard;
