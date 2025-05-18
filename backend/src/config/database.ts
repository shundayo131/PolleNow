// database configuration
import { MongoClient, Db } from 'mongodb';

// Cache the database connection to avoid multiple connections
let cachedDb: Db | null = null;

/**
 * Connect to the MongoDB database 
 * 
 * This function implements a connection pooling pattern
 * - returns existing connection (cacheDB) if it exists
 * - otherwise, creates a new connection and caches it
 * 
 * @returns {Promise<Db>} - A promise that resolves to the MongoDB database object 
 */
export const connectToDatabase = async (): Promise<Db> => {
  // If already connected, return the cached connection 
  if (cachedDb) {
    return cachedDb;
  }

  // Create a new MongoDB client and connect to the database
  const client = await MongoClient.connect(process.env.MONGODB_URI as string);

  /**
   * Get a reference to the specified database 
   * if it doesn't exist, MongoDB creates it automatically when you first write to it
   */
  const db = client.db(process.env.DB_NAME);

  // Cache the database connection 
  cachedDb = db;

  return db;
}

