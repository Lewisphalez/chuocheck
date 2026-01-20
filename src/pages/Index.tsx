import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user && userRole) {
        // Redirect authenticated users to their dashboard
        if (userRole === 'lecturer') {
          navigate('/lecturer/dashboard');
        } else if (userRole === 'student') {
          navigate('/student/dashboard');
        }
      } else {
        // Redirect unauthenticated users to landing page
        navigate('/landing');
      }
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
};

export default Index;
