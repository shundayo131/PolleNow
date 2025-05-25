import api from './api';
import { AxiosError } from 'axios';
import { LocationData } from '../types/pollen';

export class LocationService {
  // Save user location 
  static async getSavedLocation(): Promise<LocationData | null> {
    try {
      const response = await api.get('/location');
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null; // No saved location
      }
      throw error;
    }
  }

  // Save user location 
  static async saveLocation(zipCode: string): Promise<LocationData> {
    const response = await api.post('/location', { zipCode });
    return response.data;
  }

  // delete user location
  static async deleteLocation(): Promise<void> {
    await api.delete('/location');
  }
}