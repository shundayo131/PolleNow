import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { AxiosError } from 'axios';

// Homepage component
const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const [protectedData, setProtectedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testProtectedRoute = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/protected');
      setProtectedData(response.data);
    } catch (err) {
      console.error('Protected route error:', err);
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Failed to access protected route');
      } else {
        setError('Failed to access protected route');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="home-container">
      <header className="app-header">
        <h1>Pollenow</h1>
        <button onClick={logout} className="logout-button">Logout</button>
      </header>
      
      <main className="main-content">
        <section className="welcome-section">
          <h2>Welcome, {user?.name}!</h2>
          <p>You have successfully logged into the application.</p>
          
          <div style={{ marginTop: '30px' }}>
            <button 
              onClick={testProtectedRoute} 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Testing...' : 'Test Protected Route'}
            </button>
            
            {error && <div className="error-message" style={{ marginTop: '10px' }}>{error}</div>}
            
            {protectedData && (
              <div style={{ marginTop: '20px', textAlign: 'left', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                <h3>Protected Data:</h3>
                <pre>{JSON.stringify(protectedData, null, 2)}</pre>
              </div>
            )}
          </div>
        </section>
        
        <section className="user-info">
          <h3>Your Account Information</h3>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Account Created:</strong> {new Date(user?.createdAt || '').toLocaleDateString()}</p>
        </section>
      </main>
    </div>
  );
};

export default Home;