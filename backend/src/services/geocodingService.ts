import { GeocodingResponse, Coordinates } from '../types/geocodingTypes';

//GeocodingService class to handle geocoding operations
export class GeocodingService {
  /**
   * Get coordinates from Google Maps API using a zipcode
   * 
   * @param zipcode - The zipcode to geocode
   * @returns {Promise<Coordinates>} - Returns an object containing the coordinates (latitude and longitude) of the zipcode 
   */
  static async getCoordinates(zipcode: string): Promise<Coordinates> {
    // Get Google Maps API key from environment variables and check if it exists
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not found in environment variables');
    }

    // Construct the URL for the Google Maps Geocoding API
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=${apiKey}`;

    try {
      // Fetch the response from the Google Maps Geocoding API
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error fetching coordinates from Google Maps API');
      }

      const data = await response.json() as GeocodingResponse;

      // Check if the API returned any results 
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error(`No results found for zipcode ${zipcode}`);
      }

      // Extract the latitude and longitude from the response
      const location = data.results[0].geometry.location;
      
      return {
        lat: location.lat,
        lng: location.lng
      };

    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error(`Error geocoding zipcode ${zipcode}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 