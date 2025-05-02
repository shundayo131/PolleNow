import { APIGatewayProxyEvent } from 'aws-lambda';

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  user?: {
    userId: string;
    email: string;
  }; 
}

export interface TokenPayload {
  userId: string;
  email: string;
}

// To be updated 
export interface AuthResponse {
  user: {
    userId: string;
    email: string;
  };
  accessToken: string;
  refreshToken: string;
}