import { ObjectId } from 'mongodb';

// User model interface
export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

// Input type - only fields needed for registration
export interface UserInput {
  email: string;
  password: string;
  name: string;
}

// Response type - excludes sensitive fields 
export interface UserResponse {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export const sanitizeUser = (user: User): UserResponse => {
  return {
    _id: user._id?.toString() || '',
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}