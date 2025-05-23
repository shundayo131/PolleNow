import { APIGatewayProxyHandler } from 'aws-lambda';
import { UserLocationService } from '../../services/userLocationService';
import { authMiddleware } from '../../middleware/auth';
import middy from '@middy/core';
import { AuthenticatedEvent } from '../../types/authTypes';

/**
 * Handler to delete user location 
 * 
 * Deletes the current location for the authenticated user.
 * Return null if no location is found.
 */
const deleteLocationHandler = async (event: AuthenticatedEvent): Promise<any> => {
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
        body: JSON.stringify({ message: 'Unauthorized' }),
      };  
    } 

    // Delete the user location using UserLocationService
    const result = await UserLocationService.deleteLocation(userId);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Delete location error:', error);

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

export const handler = middy(deleteLocationHandler)
  .use(authMiddleware());