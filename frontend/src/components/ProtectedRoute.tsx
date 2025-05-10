import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// ProtectedRoute component to protect routes that require authentication 
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {

  // Use the AuthContext's userAuth to check if the user is authenticated
  const { isAuthenticated, loading } = useAuth();
  
  // If loading, show a loading state
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // If not authenticated, redirect to the login page 
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the children components
  return <>{children}</>;
};

// Export ProtectedRoute to wrap protected routes
export default ProtectedRoute;