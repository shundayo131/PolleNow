// database configuration

import { MongoClient, Db } from 'mongodb';

let cachedDb: Db | null = null;

export const connectToDatabase = async (): Promise<Db> => {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI as string);
  const db = client.db(process.env.DB_NAME);
  cachedDb = db;

  return db;
}

