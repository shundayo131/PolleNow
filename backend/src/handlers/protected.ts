import { APIGatewayProxyHandler } from 'aws-lambda';
import { authMiddleware } from '../middleware/auth';
import middy from '@middy/core';
import { AuthenticatedEvent } from '../types/authTypes';

/**
 * Test endpoint to verify the authentication middleware 
 * 
 * @param {AuthenticatedEvent} event - The event object containing the request context and authorizer information 
 * @returns {Promise<any>} - A promise that resolves to the response object
 */
const protectedHandler = async (event: AuthenticatedEvent): Promise<any> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    const email = event.requestContext.authorizer?.email;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        message: 'This is a protected route',
        user: {
          userId,
          email
        }
      }),
    };
  } catch (error) {
    console.error('Protected route error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        message: 'An error occurred' 
      }),
    };
  }
};

export const handler = middy(protectedHandler)
  .use(authMiddleware());