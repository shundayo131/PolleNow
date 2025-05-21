import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyToken } from '../utils/jwt';
import { AuthenticatedEvent } from '../types/authTypes';

/**
 * Autthentication middleware using JWT tokens 
 * 
 * This middleware extracts the JWT token from the Authorization header.
 * Verifies the token's validity and signature using the JWT secret. 
 * Adds the decoded user information to the event context for use in handlers. 
 * 
 * @returns {middy.MiddlewareObj} - A Middy middleware object for request authenticaiton 
 * 
 */
export const authMiddleware = (): middy.MiddlewareObj<AuthenticatedEvent, APIGatewayProxyResult> => {
  return {
    before: async (handler) => {
      // Extract Autorization header, handling case sensitivity variations 
      const authHeader = handler.event.headers.Authorization || handler.event.headers.authorization;

      // Validate if the Autorization header is present and follows the Bearer token format
      if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('No token provided');
      }

      // Extract the token from the Authorization header
      const token = authHeader.split(' ')[1];
      
      try {
        // Verify the token using the JWT secret 
        const decoded = verifyToken(token);

        // Inject the decoded user information into the event context
        handler.event.requestContext.authorizer = {
          userId: decoded.userId,
          email: decoded.email  
        };
      } catch (error) {
        throw new Error('Invalid token');
      }
    }
  }
};
