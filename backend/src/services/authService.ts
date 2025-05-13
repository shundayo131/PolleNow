import { connectToDatabase } from '../config/database';
import { sanitizeUser, User, UserInput } from '../models/user';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

/**
 * AuthService class to handle user authentication. 
 * Provides methods for user registration, login, logout, token refresh, and password reset. 
 */
export class AuthService {
  /**
   * Register a new user 
   * 
   * Create a new user account with the provided detais. 
   * Generate authenticqation tokens and store them in the database.
   * 
   * @param {UserInput} userInput - User input data containing email, password, and name
   * @returns {Promise<object> } - Returns an object containing the sanitized user data and tokens
   */
  static async register(userInput: UserInput) {
    const { email, password, name } = userInput;

    // Connnect to the database and access the users collection 
    const db = await connectToDatabase();
    const usersCollection = db.collection<User>('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash the password before storing it 
    const hashedPassword = await hashPassword(password);

    // Create a new user object 
    const newUser: User = {
      email,
      password: hashedPassword,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Inser the new user into the database and retrieve the generated ID 
    const result = await usersCollection.insertOne(newUser);
    const user = { ...newUser, _id: result.insertedId };
 
    // Generate authentication tokens 
    const payload = {
      userId: user._id.toString(), 
      email: user.email
    }
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Update the user with the refresh token 
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


  /**
   * Authenticate a user with email and password.
   *
   * Verify credentials and generate authentication tokens, 
   * and update the user's refresh token in the databsae. 
   *  
   * @param {string} email - User's email address
   * @param {string} password - User's password (plaintext)
   * @returns {Promise<Object>} User data and authentication tokens
   */
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


  /**
   * Log out a user by invalidating the refresh token
   * 
   * Removes the stored refresh token from the database, 
   * effectively logging the user out.
   * 
   * @param {string} userId - ID of the user to log out
   * @returns {Promise<Object>} - Returns a success message
   */
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


  /**
   * Generate a new access token using a refresh token
   * 
   * Validates the provided refresh token against the stored token
   * and issues a new access token if valid.
   * 
   * @param {string} userId - ID of the user requesting token refresh
   * @param {string} refreshToken - Current refresh token
   * @returns {Promise<Object>} New access token
   */
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


  /**
   * Initiate password reset process
   * 
   * Generates a secure reset token, stores its hashed value with expiration,
   * and returns the token to be sent to the user (typically via email).
   * 
   * @param {string} email - Email of user requesting password reset
   * @returns {Promise<Object>} Reset token and confirmation message 
   */
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

  
  /**
   * Complete password reset with new password
   * 
   * Validates the reset token, updates the user's password,
   * and removes the reset token fields from the user document.
   * 
   * @param {string} resetToken - Token provided to user for password reset
   * @param {string} newPassword - New password to set
   * @returns {Promise<Object>} Success confirmation message
   */
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