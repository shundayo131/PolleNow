import { connectToDatabase } from '../config/database';
import { UserLocation, UserLocationInput, sanitizeUserLocation } from '../models/userLocation';
import { Coordinates } from '../types/geocodingTypes';
import { GeocodingService } from './geocodingService';
import { ObjectId } from 'mongodb';

/**
 * UserLocationService class to handle user location management.
 * Provides methods for saving, retrieving, and deleting user locations.
 */
export class UserLocationService {
  /**
   * Save a new location for a user 
   * 
   * @param userId - The ID of the use 
   * @returns {}
   */
  static async saveLocation(locationInput: UserLocationInput) {
    // Connect to the database
    const db = await connectToDatabase();
    const locationsCollection = db.collection<UserLocation>('user_locations');

    // If coordinates are not provided, get them from the zipcode
    if (!locationInput.coordinates) {
      try {
        const coordinates = await GeocodingService.getCoordinates(locationInput.zipCode);
        locationInput.coordinates = coordinates;
      } catch (error) {
        console.error('Error getting coordinates:', error);
      }
    }

    // Check if user already has a location
    const existingLocation = await locationsCollection.findOne({
      userId: new ObjectId(locationInput.userId)
    });

    // If the user already has a location, update it 
    if (existingLocation) {
      // Update the existing location
      const updateFields = {
        zipCode: locationInput.zipCode,
        coordinates: locationInput.coordinates,
        updatedAt: new Date()
      };

      await locationsCollection.updateOne(
        { userId: new ObjectId(locationInput.userId) },
        { $set: updateFields }
      );

      // Fetch and return the updated location
      const updatedLocation = await locationsCollection.findOne({
        userId: new ObjectId(locationInput.userId)
      });

      return sanitizeUserLocation(updatedLocation as UserLocation);

    // If the user does not have a location, create a new one 
    } else {
      // Create a new location
      const newLocation: UserLocation = {
        userId: new ObjectId(locationInput.userId),
        zipCode: locationInput.zipCode,
        coordinates: locationInput.coordinates as Coordinates,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await locationsCollection.insertOne(newLocation);
      const location = { ...newLocation, _id: result.insertedId };

      return sanitizeUserLocation(location);
    }
  }


  /**
   * Get a user's location by user ID
   * 
   * @params userId - The ID of the user
   * @returns {Promise<UserLocationResponse | null>} - Returns the user's location or null if not found
   */
  static async getLocation(userId: string) {
    // Connect to the database
    const db = await connectToDatabase();
    const locationsCollection = db.collection<UserLocation>('user_locations');

    // Find the user's location by user ID
    const location = await locationsCollection.findOne({
      userId: new ObjectId(userId)
    });

    if (!location) {
      return null; // Location not found
    }

    return sanitizeUserLocation(location as UserLocation);
  }


  /**
   * Delete a user's location by user ID
   * 
   * @params userId - The ID of the user
   * @returns {Promise<boolean>} - Returns true if the location was deleted, false otherwise
   */
  static async deleteLocation(userId: string) {
    // Connect to the database
    const db = await connectToDatabase();
    const locationsCollection = db.collection<UserLocation>('user_locations');

    // Delete the user's location by user ID
    const result = await locationsCollection.deleteOne({
      userId: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      throw new Error('Location not found');
    }

    return { success: true, message: 'Location deleted successfully' };    
  }
}