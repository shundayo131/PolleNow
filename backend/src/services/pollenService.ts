import { PollenForecastResponse } from '../types/pollenTypes';
import { Coordinates } from '../types/geocodingTypes';

export class PollenService {
  private static readonly BASE_URL = 'https://pollen.googleapis.com/v1/forecast:lookup';

  /**
   * Get pollen forecast from Google Pollen API 
   * 
   * @param coordinates - The coordinates (latitude and longitude) for the pollen forecast
   * @param days - The number of days for the forecast (default is 7)
   * @returns {Promise<PollenForecastResponse>} - The pollen forecast response
   */
  static async getPollenForecast(
    coordinates: Coordinates, 
    days: number = 5
  ): Promise<PollenForecastResponse> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Validate coordinates from saved location
    if (!coordinates.lat || !coordinates.lng) {
      throw new Error('Invalid saved location coordinates');
    }

    try {
      const requestURL = `${this.BASE_URL}?key=${apiKey}&location.longitude=${coordinates.lng}&location.latitude=${coordinates.lat}&days=${days}&plantsDescription=true&languageCode=en`;
      const response = await fetch(requestURL);

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          const err = errorData as { error?: { message?: string } }; 
          errorMessage = err.error?.message || errorMessage; 
        } catch {
          // Use default error message if response can't be parsed
        }
        throw new Error(errorMessage);
      }

      const data = await response.json() as PollenForecastResponse;
      return data;
      
    } catch (error) {
      console.error('Google Pollen API error:', error);
      throw new Error(`Failed to fetch pollen data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  /**
   * Format pollen data for frontend display
   * Simplified format focusing on essential information
   * 
   * @param pollenData - Raw pollen data from Google API
   * @returns Formatted data for frontend
   */
  static formatPollenData(pollenData: PollenForecastResponse) {
    return {
      regionCode: pollenData.regionCode || 'Unknown',
      totalDays: pollenData.dailyInfo.length,
      forecast: pollenData.dailyInfo.map(day => ({
        date: `${day.date.year}-${String(day.date.month).padStart(2, '0')}-${String(day.date.day).padStart(2, '0')}`,
        dayName: this.getDayName(new Date(day.date.year, day.date.month - 1, day.date.day)),
        pollenLevels: {
          grass: this.extractPollenLevel(day.pollenTypeInfo, 'GRASS'),
          tree: this.extractPollenLevel(day.pollenTypeInfo, 'TREE'),
          weed: this.extractPollenLevel(day.pollenTypeInfo, 'WEED')
        },
        healthRecommendations: this.extractHealthRecommendations(day.pollenTypeInfo)
      }))
    };
  }


  /**
   * Extract pollen level for a specific type
   */
  private static extractPollenLevel(pollenTypes: any[], type: string) {
    const pollen = pollenTypes.find(p => p.code === type);
    if (!pollen || !pollen.indexInfo) {
      return {
        level: null,
        category: 'No Data',
        inSeason: false
      };
    }

    return {
      level: pollen.indexInfo.value,
      category: pollen.indexInfo.category,
      inSeason: pollen.inSeason || false,
      color: pollen.indexInfo.color
    };
  }


  /**
   * Extract health recommendations from pollen data
   */
  private static extractHealthRecommendations(pollenTypes: any[]) {
    const recommendations: string[] = [];
    pollenTypes.forEach(pollen => {
      if (pollen.healthRecommendations) {
        recommendations.push(...pollen.healthRecommendations);
      }
    });
    
    // Remove duplicates and limit to 3 recommendations
    return [...new Set(recommendations)].slice(0, 3);
  }


  /**
   * Get day name from date
   */
  private static getDayName(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
  }
}