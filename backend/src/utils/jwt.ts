import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types/authTypes';

// JWT configuration constants 
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';


// Generate a short-lived JWT access token
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any, // TypeScript doesn't recognize the type of expiresIn
    algorithm: 'HS256',
  });
}


// Generate a long-lived JWT refresh token
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN as any, // TypeScript doesn't recognize the type of expiresIn
    algorithm: 'HS256',
  });
}


// Verify and decode a JWT token
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Decode JWT token
export const decodeToken = (token: string): any => {
  return jwt.decode(token);
}