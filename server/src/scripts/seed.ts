import { connectDB, disconnectDB } from '../config/db';
import { SeedService } from '../services/seedService';

const run = async (): Promise<void> => {
  const connection = await connectDB();
  if (!connection) {
    throw new Error('Unable to connect to MongoDB for catalog seeding');
  }

  try {
    const result = await SeedService.seedCatalogIfEmpty();
    console.log(`[Seed] Restored ${result.seededCount} missing products; ${result.totalCount} active products available.`);
  } finally {
    await disconnectDB();
  }
};

run().catch((error) => {
  console.error('[Seed] Catalog restore failed:', error);
  process.exitCode = 1;
});
