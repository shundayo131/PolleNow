import { APIGatewayProxyHandler } from 'aws-lambda';
import { UserLocationService } from '../../services/userLocationService';
import { authMiddleware } from '../../middleware/auth';
import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import { AuthenticatedEvent } from '../../types/authTypes';
import { UserLocationInput } from '../../models/userLocation';

/**
 * Handler to save user location 
 * 
 * If the user already has a location, it will be updated. 
 * If not, a new location will be created.
 */
const saveLocationHandler = async (event: AuthenticatedEvent): Promise<any> => {
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

    /**
     * Parsing the request body.
     * Considering to use 'jsonBodyParser' middleware. 
     */
    const body = JSON.parse(event.body || '{}');
    const { zipCode, coordinates } = body;

    // Validate input 
    if (!zipCode) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Missing required fields: zipCode' }),
      };
    }

    const userLocationInput: UserLocationInput = {
      userId,
      zipCode,
      coordinates,
    };

    // Save or update the user location using UserLocationService
    const location = await UserLocationService.saveLocation(userLocationInput);

    // Return success response
    return {
      statusCode: 200, // Use 200 instead of 201 since this could be an update
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(location),
    };
  } catch (error) {
    console.error('Save location error:', error);
    
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

// Export the handler with middleware 
export const handler = middy(saveLocationHandler)
  .use(authMiddleware())
  // .use(jsonBodyParser()); // Remove it for now because the code above is parsing json. 
