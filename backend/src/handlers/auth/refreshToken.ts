import { APIGatewayProxyHandler } from 'aws-lambda';
import { AuthService } from '../../services/authService';
import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';

export const refreshTokenHandler: APIGatewayProxyHandler = async (event): Promise<any> => {
  try {
    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    const { userId, refreshToken } = body;

    // Validate input
    if (!userId || !refreshToken) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    // Refresh the token
    const result = await AuthService.refreshToken(userId, refreshToken);

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
    console.error('Token refresh error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const statusCode = errorMessage === 'Invalid refresh token' ? 401 : 500;
    
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: errorMessage }),
    };
  }
};

export const handler = middy(refreshTokenHandler)
  .use(jsonBodyParser());