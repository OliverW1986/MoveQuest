import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // TODO: Add authentication logic
  const isAuthenticated = true; // Replace with actual auth check

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p>Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}