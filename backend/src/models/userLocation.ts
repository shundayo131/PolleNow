import { ObjectId } from 'mongodb';
import { Coordinates } from '../types/geocodingTypes';

/**
 * UserLocation interface represents a user's location in the database.
 * It includes the user's ID, zipcode, coordinates (latitude and longitude),
 * and timestamps for creation and update. 
 */
export interface UserLocation {
  _id?: ObjectId;
  userId: ObjectId;
  zipCode: string;
  coordinates: Coordinates;
  createdAt: Date;
  updatedAt: Date;
}

// Input type for creating / updating a user location
export interface UserLocationInput {
  userId: string;
  zipCode: string;
  coordinates?: Coordinates;
}

// Response type
export interface UserLocationResponse {
  _id: string;
  userId: string;
  zipCode: string;
  coordinates: Coordinates;
  createdAt: Date;
  updatedAt: Date;
}

// Function to format user location data before sending it to the client
export const sanitizeUserLocation = (location: UserLocation): UserLocationResponse => {
  return {
    _id: location._id?.toString() || '',
    userId: location.userId.toString(),
    zipCode: location.zipCode,
    coordinates: location.coordinates,
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
  };
}