import { GeocodingService } from './services/geocodingService';
import dotenv from 'dotenv';

// Load environment variables from .env file (important for local testing)
dotenv.config();

async function testGeocoding() {
  try {
    // Test with a valid US zipcode
    const coordinates = await GeocodingService.getCoordinates('94025');
    console.log('Coordinates for 94025:', coordinates);

    // You can test with other values too
    const coordinates2 = await GeocodingService.getCoordinates('10001');
    console.log('Coordinates for 10001:', coordinates2);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testGeocoding();