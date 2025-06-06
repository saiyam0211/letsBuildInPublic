import mongoose from 'mongoose';

/**
 * Connect to test database - uses the existing connection from setup.ts
 */
export async function connectTestDatabase(): Promise<void> {
  // Connection is already established in setup.ts global beforeAll
  // This function is kept for compatibility with test files
  if (mongoose.connection.readyState === 0) {
    throw new Error(
      'Test database not connected. Setup.ts should handle this.'
    );
  }
}

/**
 * Clear all collections in the test database
 */
export async function clearTestDatabase(): Promise<void> {
  try {
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    }
  } catch (error) {
    console.error('Error clearing test database:', error);
    throw error;
  }
}

/**
 * Close test database connection - handled by setup.ts global afterAll
 */
export async function closeTestDatabase(): Promise<void> {
  // Connection cleanup is handled in setup.ts global afterAll
  // This function is kept for compatibility with test files
}
