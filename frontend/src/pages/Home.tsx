// frontend/src/pages/Home.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';
import { LocationData, PollenForecastData, DayForecast } from '../types/pollen';
import { LocationService } from '../services/locationService';
import { PollenService } from '../services/pollenService';
import LocationManager from '../components/LocationManager';
import PollenCard from '../components/PollenCard';

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const [savedLocation, setSavedLocation] = useState<LocationData | null>(null);
  const [pollenData, setPollenData] = useState<PollenForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Load saved location on component mount
  useEffect(() => {
    loadSavedLocation();
  }, []);

  // Load pollen data when location is available
  useEffect(() => {
    if (savedLocation) {
      loadPollenData();
    }
  }, [savedLocation]);

  const loadSavedLocation = async () => {
    try {
      const location = await LocationService.getSavedLocation();
      setSavedLocation(location);
    } catch (err) {
      console.error('Failed to load saved location:', err);
    }
  };

  const loadPollenData = async () => {
    if (!savedLocation) return;

    setLoading(true);
    setError('');

    try {
      const response = await PollenService.getPollenForecast(5);
      if (response.success) {
        setPollenData(response.data);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404 && err.response?.data?.action === 'SAVE_LOCATION_REQUIRED') {
        setError('Please save your location first to get pollen data.');
      } else {
        setError(err instanceof AxiosError ? err.response?.data?.message || 'Failed to load pollen data' : 'Failed to load pollen data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdated = (location: LocationData | null) => {
    setSavedLocation(location);
    if (location) {
      // Auto-load pollen data for new location
      loadPollenData();
    } else {
      // Clear pollen data when location is deleted
      setPollenData(null);
      setError('');
    }
  };

  const handleRefresh = () => {
    if (savedLocation) {
      loadPollenData();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="home-container">
      <header className="app-header">
        <h1>🌿 PolleNow</h1>
        <div className="header-actions">
          <span className="welcome-text">Welcome, {user?.name}!</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </header>
      
      <main className="main-content">
        {/* Location Management Section */}
        <section className="location-section">
          <LocationManager 
            savedLocation={savedLocation} 
            onLocationUpdated={handleLocationUpdated}
          />
        </section>

        {/* Pollen Data Section */}
        {savedLocation && (
          <>
            {/* Current Conditions */}
            <section className="current-conditions-section">
              <div className="section-header">
                <h2>Current Pollen Levels</h2>
                <button 
                  onClick={handleRefresh}
                  disabled={loading}
                  className="refresh-button"
                >
                  {loading ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
              </div>

              {error && <div className="error-message">{error}</div>}

              {pollenData?.todaySummary && (
                <div className="current-conditions">
                  <PollenCard 
                    type="grass" 
                    pollenData={pollenData.todaySummary.pollenLevels.grass} 
                  />
                  <PollenCard 
                    type="tree" 
                    pollenData={pollenData.todaySummary.pollenLevels.tree} 
                  />
                  <PollenCard 
                    type="weed" 
                    pollenData={pollenData.todaySummary.pollenLevels.weed} 
                  />
                </div>
              )}

              {lastUpdated && (
                <div className="last-updated">
                  Last updated: {lastUpdated}
                </div>
              )}
            </section>

            {/* 5-Day Forecast */}
            {pollenData?.forecast && (
              <section className="forecast-section">
                <h2>5-Day Forecast</h2>
                <div className="forecast-grid">
                  {pollenData.forecast.map((day: DayForecast) => (
                    <div key={day.date} className="day-card">
                      <div className="day-header">
                        <div className="day-date">{formatDate(day.date)}</div>
                        <div className="day-name">{day.dayName}</div>
                      </div>
                      <div className="day-pollen-levels">
                        <div className="pollen-item">
                          <span className="pollen-label">🌱</span>
                          <span 
                            className="pollen-value"
                            style={{ 
                              color: day.pollenLevels.grass.level !== null ? '#10b981' : '#6b7280' 
                            }}
                          >
                            {day.pollenLevels.grass.level || '-'}
                          </span>
                        </div>
                        <div className="pollen-item">
                          <span className="pollen-label">🌳</span>
                          <span 
                            className="pollen-value"
                            style={{ 
                              color: day.pollenLevels.tree.level !== null ? '#10b981' : '#6b7280' 
                            }}
                          >
                            {day.pollenLevels.tree.level || '-'}
                          </span>
                        </div>
                        <div className="pollen-item">
                          <span className="pollen-label">🌿</span>
                          <span 
                            className="pollen-value"
                            style={{ 
                              color: day.pollenLevels.weed.level !== null ? '#10b981' : '#6b7280' 
                            }}
                          >
                            {day.pollenLevels.weed.level || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Health Recommendations */}
            {pollenData?.todaySummary?.healthRecommendations && 
             pollenData.todaySummary.healthRecommendations.length > 0 && (
              <section className="recommendations-section">
                <h2>Health Recommendations</h2>
                <ul className="recommendations-list">
                  {pollenData.todaySummary.healthRecommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Home;