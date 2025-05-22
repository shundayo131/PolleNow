import { APIGatewayProxyHandler } from 'aws-lambda';
import { UserLocationService } from '../../services/userLocationService';
import { authMiddleware } from '../../middleware/auth';
import middy from '@middy/core';
import { AuthenticatedEvent } from '../../types/authTypes';

/**
 * Handler to save user location 
 * 
 * Retreives the current location for the authenticated user.
 * Return null if no location is found.
 */
const getLocatinonHandler = async (event: AuthenticatedEvent): Promise<any> => {
  try {
    //  Extract userId from the event context
    const userId = event.requestContext.authorizer?.userId;

    // Check if userId is present
    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    // Get the user location using UserLocationService
    const location = await UserLocationService.getLocation(userId);

    // If no location is found, return 404
    if (!location) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Location not found' }),
      };
    }

    // Return success response with location data 
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(location),
    };
  } catch (error) {
    console.error('Get location error:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: errorMessage }),
    };
  }
}

// Export the handler wrapped with auth middleware
export const handler = middy(getLocatinonHandler)
  .use(authMiddleware());