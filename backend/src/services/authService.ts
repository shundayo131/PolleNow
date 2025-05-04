import { connectToDatabase } from '../config/database';
import { sanitizeUser, User, UserInput } from '../models/user';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

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
    const db = await connectToDatabase();
    const usersCollection = db.collection<User>('users');

    // Find user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Veryfy password 
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate a token and refresh token
    const payload = {
      userId: user._id.toString(),
      email: user.email
    };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    // Update refresh token for the user in the database
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { refreshToken, updatedAt: new Date() } }
    );

    // Return sanitized user data and tokens
    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  // Logout user
  static async logoutUser(userId: string) {
    // Connect to the database
    const db = await connectToDatabase();
    const usersCollection = db.collection<User>('users');
    
    // Get user by ID and unset refresh token
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $unset: { refreshToken: "" },
        $set: { updatedAt: new Date() }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }
    
    return { success: true };
  }

  // Refresh token
  static async refreshToken(userId: string, refreshToken: string) {
    // Connect to the database
    const db = await connectToDatabase();
    const usersCollection = db.collection<User>('users');
    
    // Get user by ID
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(userId),
      refreshToken
    });
    
    if (!user) {
      throw new Error('Invalid refresh token');
    }
    
    // Generate a new access token
    const payload = {
      userId: user._id.toString(),
      email: user.email
    };
    const accessToken = generateToken(payload);
    
    return { accessToken };
  }

  // forgot password
  static async forgotPassword(email: string) {
    // Connect to the database
    const db = await connectToDatabase();
    const usersCollection = db.collection<User>('users');
    
    // Find user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate a password reset token (a random string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the reset token (so it's not stored in plain text)
    const hashedResetToken = await hashPassword(resetToken);
    
    // Set reset token expiration time (1 hour from now)
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);
    
    // Save reset token and expiration time in the database
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          passwordResetToken: hashedResetToken,
          passwordResetExpires: resetTokenExpires,
          updatedAt: new Date()
        } 
      }
    );
    
    // TODO 
    // In a real app, send email with reset link
    // For demo purposes, we'll just return the token
    return { 
      message: 'Password reset initiated',
      resetToken,
      // In production, don't return the token directly
      // This is for testing only
    };
  }

  // Reset password
  static async resetPassword(resetToken: string, newPassword: string) {
    // Connect to the database
    const db = await connectToDatabase();
    const usersCollection = db.collection<User>('users');
    
    // Find user with valid reset token that hasn't expired
    const user = await usersCollection.findOne({
      passwordResetToken: await hashPassword(resetToken),
      passwordResetExpires: { $gt: new Date() }
    });
    
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }
    
    // Update password and remove reset token fields
    const hashedPassword = await hashPassword(newPassword);
    
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        },
        $unset: {
          passwordResetToken: "",
          passwordResetExpires: ""
        }
      }
    );
    
    return { message: 'Password has been reset successfully' };
  }
}