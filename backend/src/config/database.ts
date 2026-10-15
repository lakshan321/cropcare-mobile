import mongoose from 'mongoose';
import { env } from './env';

let mongoMemoryServer: any = null;

export const connectDB = async (): Promise<string> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.host;
  }

  let uri = env.MONGODB_URI;

  if (!uri) {
    console.log('[Database] No MONGODB_URI provided. Initializing in-memory MongoDB server for development/testing...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      uri = mongoMemoryServer.getUri();
      console.log(`[Database] In-memory MongoDB running at: ${uri}`);
    } catch (err) {
      console.error('[Database] Failed to initialize MongoMemoryServer, falling back to localhost:27017/cropcare', err);
      uri = 'mongodb://127.0.0.1:27017/cropcare';
    }
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return uri;
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    // If external URI failed and we haven't tried memory server yet, fallback to memory server
    if (!mongoMemoryServer) {
      console.log('[Database] Falling back to MongoMemoryServer...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const fallbackUri = mongoMemoryServer.getUri();
        const conn = await mongoose.connect(fallbackUri);
        console.log(`[Database] Fallback In-memory MongoDB connected: ${fallbackUri}`);
        return fallbackUri;
      } catch (memErr) {
        console.error('[Database] Fatal: Unable to connect to MongoDB or start memory server:', memErr);
        throw memErr;
      }
    }
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
  }
};
