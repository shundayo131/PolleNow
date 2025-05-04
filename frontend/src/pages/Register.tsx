import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RegisterCredentials } from '../types/auth';

const Register: React.FC = () => {
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await register(credentials);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="auth-form-container">
      <h1>Register</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={credentials.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={credentials.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
            minLength={8}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <p className="auth-link">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;