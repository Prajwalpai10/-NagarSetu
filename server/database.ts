import { MongoClient, type Db } from 'mongodb';

let client: MongoClient | null = null;
let database: Db | null = null;

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  const databaseName = process.env.MONGODB_DB_NAME;

  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is required in production.');
    }
    return;
  }
  if (!databaseName) {
    throw new Error('MONGODB_DB_NAME is required when MONGODB_URI is configured.');
  }

  if (client) throw new Error('MongoDB is already connected.');
  const connectingClient = new MongoClient(uri, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? 10000),
  });
  try {
    await connectingClient.connect();
    const connectingDatabase = connectingClient.db(databaseName);
    await connectingDatabase.command({ ping: 1 });
    await Promise.all([
      connectingDatabase.collection('users').createIndex({ email: 1 }, { unique: true }),
      connectingDatabase.collection('users').createIndex({ id: 1 }, { unique: true }),
      connectingDatabase.collection('departments').createIndex({ id: 1 }, { unique: true }),
      connectingDatabase.collection('departments').createIndex({ name: 1 }, { unique: true }),
      connectingDatabase.collection('complaints').createIndex({ id: 1 }, { unique: true }),
      connectingDatabase.collection('complaints').createIndex({ citizenId: 1, createdAt: -1 }),
      connectingDatabase.collection('complaints').createIndex({ assignedOfficerId: 1, updatedAt: -1 }),
      connectingDatabase.collection('attachments').createIndex({ key: 1 }, { unique: true }),
      connectingDatabase.collection('attachments').createIndex({ ownerId: 1, createdAt: -1 }),
    ]);
    client = connectingClient;
    database = connectingDatabase;
  } catch (error) {
    await connectingClient.close();
    throw new Error(`MongoDB connection or index initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function getDatabase(): Db | null {
  return database;
}

export function getMongoClient(): MongoClient | null {
  return client;
}

export async function closeDatabase(): Promise<void> {
  if (client) await client.close();
  client = null;
  database = null;
}
