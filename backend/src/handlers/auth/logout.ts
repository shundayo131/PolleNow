import { APIGatewayProxyHandler } from 'aws-lambda';
import { AuthService } from '../../services/authService';
import { authMiddleware } from '../../middleware/auth';
import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import { AuthenticatedEvent } from '../../types/authTypes';

const logoutHandler: APIGatewayProxyHandler = async (event: AuthenticatedEvent): Promise<any> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    
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

    const result = await AuthService.logoutUser(userId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Logout error:', error);
    
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
};

export const handler = middy(logoutHandler)
  .use(authMiddleware());