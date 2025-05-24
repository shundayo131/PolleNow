import { APIGatewayProxyHandler } from 'aws-lambda';
import { PollenService } from '../../services/pollenService';
import { UserLocationService } from '../../services/userLocationService';
import { authMiddleware } from '../../middleware/auth';
import middy from '@middy/core';
import { AuthenticatedEvent } from '../../types/authTypes';

/**
 * Handler to get pollen forecast using user's saved location 
 * NOTE: the handler is currently not taking the location as input. It uses the saved location.
 * 
 * Query parameters:
 * - days: number of forecast days (1-5, default: 5)
 */
const getPollenForecastHandler = async (event: AuthenticatedEvent): Promise<any> => {
  try {
    // Extract userId from the event context
    const userId = event.requestContext.authorizer?.userId;

    // Check if userId is present
    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          success: false,
          message: 'Unauthorized' 
        }),
      };
    }

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const days = queryParams.days ? parseInt(queryParams.days) : 5; // Default to 5 days

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 5) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          success: false,
          message: 'Days parameter must be a number between 1 and 5',
          received: queryParams.days
        }),
      };
    }

    // Get user's saved location
    const userLocation = await UserLocationService.getLocation(userId);
    
    // If no location is found, return 404
    if (!userLocation || !userLocation.coordinates) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          success: false,
          message: 'No saved location found. Please save your location first.',
          action: 'SAVE_LOCATION_REQUIRED',
          hint: 'Use the location endpoints to save your location before getting pollen data.'
        }),
      };
    }

    // Get pollen forecast data using saved coordinates
    const pollenData = await PollenService.getPollenForecast(userLocation.coordinates, days);
    
    // Format the data for frontend
    const formattedData = PollenService.formatPollenData(pollenData);

    // Get today's summary for quick access
    const todaySummary = formattedData.forecast.length > 0 ? {
      date: formattedData.forecast[0].date,
      dayName: formattedData.forecast[0].dayName,
      pollenLevels: formattedData.forecast[0].pollenLevels,
      healthRecommendations: formattedData.forecast[0].healthRecommendations
    } : null;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: {
          location: {
            zipCode: userLocation.zipCode,
            coordinates: userLocation.coordinates
          },
          forecast: formattedData.forecast,
          todaySummary: todaySummary,
          meta: {
            regionCode: formattedData.regionCode,
            totalDays: formattedData.totalDays,
            daysRequested: days,
            timestamp: new Date().toISOString()
          }
        }
      }),
    };

  } catch (error) {
    console.error('Pollen forecast error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: false,
        message: `Failed to get pollen forecast: ${errorMessage}`,
        timestamp: new Date().toISOString()
      }),
    };
  }
};

export const handler = middy(getPollenForecastHandler)
  .use(authMiddleware());