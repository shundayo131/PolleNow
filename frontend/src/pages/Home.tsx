import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  
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
          <p>This is a placeholder for the main application content.</p>
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