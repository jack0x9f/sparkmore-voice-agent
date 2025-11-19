import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoSession } from '@/hooks/useDemoSession';

interface ProtectedDemoRouteProps {
  children: React.ReactNode;
}

const ProtectedDemoRoute = ({ children }: ProtectedDemoRouteProps) => {
  const { isValid, loading } = useDemoSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isValid === false) {
      navigate('/demo-login');
    }
  }, [isValid, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (isValid === false) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedDemoRoute;