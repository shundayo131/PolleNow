// Authentication business logic

import { connectToDatabase } from '../config/database';
import { sanitizeUser, User, UserInput } from '../models/user';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { ObjectId } from 'mongodb';

export class AuthService {
  // Register user
  static async register(userInput: UserInput) {
    const { email, password, name } = userInput;
    
    const db = await connectToDatabase();
    const usersCollection = db.collection<User>('users');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(password);

    const newUser: User = {
      email,
      password: hashedPassword,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    const user = { ...newUser, _id: result.insertedId };
    
    const payload = {
      userId: user._id.toString(), 
      email: user.email
    }
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { refreshToken } }
    );

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  // Login user
  static async loginUser(email: string, password: string) {
    // Connect to the database

    // Find user by email

    // Veryfy password 

    // Generate a token and refresh token

    // Update refresh token for the user in the database

    // Return sanitized user data and tokens
    return;
  }

  // Logout user
  static async logoutUser(userId: string) {
    // Connect to the database

    // Get user by ID

    // Unset refresh token for the user in the database

  }

  // Refresh token
  static async refreshToken(userId: string, refreshToken: string) {
    // Connect to the database

    // Get user by ID

    // Verify refresh token

    // Generate a new asccess token

    // return access token
    return;
  }

  // forgot password
  static async forgotPassword(email: string) {
    // Connect to the database

    // Find user by email

    // Generate a password reset token

    // Set rest expiration time

    // Save reset token and expiration time in the database

    // In a real app, send email with reset link
    // For demo purposes, we'll just return the token


  }

  // Reset password

}