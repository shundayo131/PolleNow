import { connectToDatabase } from './config/database';

async function testConnection() {
  try {
    const db = await connectToDatabase();
    console.log('Connected successfully to MongoDB');
    
    // Test creating a collection
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
  } catch (error) {
    console.error('Connection error:', error);
  }
}

testConnection();