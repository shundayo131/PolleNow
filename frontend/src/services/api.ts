import axios from 'axios';

// Define the base URL for the API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create an axios instance with the base URL and headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor that runs before every request is sent to the server. 
 * 
 * It adds the JWT access token to the Authroization header.
 */
api.interceptors.request.use(
  // Handle successful requests (1st argument of use)
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  // Handle errors (2nd argument of use)
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor that runs after every response is received from the server.
 * 
 * It checks for 401 Unauthorized errors and attempts to refresh the token.
 * If the refresh fails, it clears local storage and redirects to the login page.
 */
api.interceptors.response.use(
  // Handle successful responses
  // Just return the response as is
  (response) => {
    return response;
  },
  // Handle errors (request failed)
  async (error) => {
    // Extract the original request from the error object
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried refreshing token yet
    if (error.response.status === 401 && !originalRequest._retry) {
      // Mark the original request as retried
      originalRequest._retry = true;
      
      try {
        // Get userId and refreshToken from localStorage
        const userId = localStorage.getItem('userId');
        const refreshToken = localStorage.getItem('refreshToken');
        
        // If we have the necessary data to refresh token
        if (userId && refreshToken) {
          try {
            // Call the backend refresh token endpoint
            const response = await axios.post(`${API_URL}/auth/refresh-token`, {
              userId,
              refreshToken
            });

            // Extract the new access token from the response
            const { accessToken } = response.data;
            
            // Save the new access token
            localStorage.setItem('accessToken', accessToken);
            
            // Update the authorization header
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            
            // Retry the original request
            return api(originalRequest);

            // If refresh token endpoint doesn't exist or refresh token is invalid
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Clear local storage and redirect to login
            localStorage.clear();
            // Redirect to login page
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
      } catch (refreshError) {
        // If refresh token is invalid, clear storage and redirect to login
        console.error('Token refresh failed:', refreshError);

        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;