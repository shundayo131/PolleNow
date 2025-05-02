import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyToken } from '../utils/jwt';
import { AuthenticatedEvent } from '../types/authTypes';

// Middleware to authenticate requests using JWT
export const authMiddleware = (): middy.MiddlewareObj<AuthenticatedEvent, APIGatewayProxyResult> => {
  return {
    before: async (handler) => {
      const authHeader = handler.event.headers.Authorization || handler.event.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('No token provided');
      }

      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = verifyToken(token);
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
