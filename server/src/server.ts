import app from './app';
import { connectDB } from './config/db';
import { config } from './config/env';
import { SeedService } from './services/seedService';

const startServer = async () => {
  try {
    // Connect Database
    await connectDB();

    // Auto seed default catalog if database is empty
    await SeedService.seedCatalogIfEmpty();

    // Start Express Listener on all network interfaces
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`[SellPilot Server] Running in ${config.nodeEnv} mode on port ${config.port}`);
      console.log(`[SellPilot Server] Health Check: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    console.error('[SellPilot Server] Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
