import api from './api';
import { PollenApiResponse } from '../types/pollen';

export class PollenService {
  /**
   * Get pollen forecast using saved location
   * @param days Number of forecast days (1-5, default: 5)
   */
  static async getPollenForecast(days: number = 5): Promise<PollenApiResponse> {
    const response = await api.get(`/pollen/forecast?days=${days}`);
    return response.data;
  }

  /**
   * Get current pollen data for the saved location
   * @returns PollenApiResponse with current pollen data
   */
  static async getCurrentPollen(): Promise<PollenApiResponse> {
    return this.getPollenForecast(1);
  }
}