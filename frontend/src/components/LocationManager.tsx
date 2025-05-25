import React, { useState } from 'react';
import { AxiosError } from 'axios';
import { LocationData } from '../types/pollen';
import { LocationService } from '../services/locationService';

interface LocationManagerProps {
  savedLocation: LocationData | null;
  onLocationUpdated: (location: LocationData | null) => void;
}

const LocationManager: React.FC<LocationManagerProps> = ({ 
  savedLocation, 
  onLocationUpdated 
}) => {
  const [zipCode, setZipCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const newLocation = await LocationService.saveLocation(zipCode.trim());
      onLocationUpdated(newLocation);
      setIsEditing(false);
      setZipCode('');
    } catch (err) {
      setError(err instanceof AxiosError ? err.response?.data?.message || 'Failed to save location' : 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!confirm('Are you sure you want to delete your saved location?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await LocationService.deleteLocation();
      onLocationUpdated(null);
    } catch (err) {
      setError(err instanceof AxiosError ? err.response?.data?.message || 'Failed to delete location' : 'Failed to delete location');
    } finally {
      setLoading(false);
    }
  };

  if (!savedLocation && !isEditing) {
    return (
      <div className="location-manager no-location">
        <div className="location-prompt">
          <h3>📍 Save Your Location</h3>
          <p>Save your ZIP code to get personalized pollen forecasts</p>
          <button 
            onClick={() => setIsEditing(true)}
            className="save-location-btn"
          >
            Save Location
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="location-manager editing">
        <form onSubmit={handleSaveLocation} className="location-form">
          <div className="form-group">
            <label htmlFor="zipCode">ZIP Code</label>
            <input
              type="text"
              id="zipCode"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Enter your ZIP code"
              pattern="[0-9]{5}"
              title="Please enter a valid 5-digit ZIP code"
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-actions">
            <button 
              type="submit" 
              disabled={loading || !zipCode.trim()}
              className="submit-button"
            >
              {loading ? 'Saving...' : 'Save Location'}
            </button>
            <button 
              type="button"
              onClick={() => {
                setIsEditing(false);
                setZipCode('');
                setError('');
              }}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="location-manager saved">
      {savedLocation && (
        <div className="location-display">
          <div className="location-info">
            <span className="location-icon">📍</span>
            <div className="location-details">
              <div className="zip-code">{savedLocation.zipCode}</div>
              <div className="coordinates">
                {savedLocation.coordinates.lat.toFixed(4)}, {savedLocation.coordinates.lng.toFixed(4)}
              </div>
            </div>
          </div>
          
          <div className="location-actions">
            <button 
              onClick={() => setIsEditing(true)}
              className="edit-button"
            >
              Change
            </button>
            <button 
              onClick={handleDeleteLocation}
              disabled={loading}
              className="delete-button"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default LocationManager;