import { app } from './app';
import { connectDB } from './config/database';
import { env } from './config/env';
import { User } from './models/User';
import { seedDatabase } from './seed/seed';

const startServer = async () => {
  try {
    await connectDB();

    // Check if database needs initial seeding
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] No existing users detected. Auto-seeding initial development accounts...');
      await seedDatabase();
    }

    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🌱 CropCare Backend API is LIVE on port ${env.PORT}`);
      console.log(`   Local URL:    http://localhost:${env.PORT}`);
      console.log(`   Network Host: 0.0.0.0 (Accessible to LAN physical devices)`);
      console.log(`   Environment:  ${env.NODE_ENV}`);
      console.log(`   AI Provider:  ${env.DIAGNOSIS_PROVIDER}`);
      console.log(`====================================================`);
      console.log(`Demo Credentials:`);
      console.log(`  Farmer:  username: "farmer_kamal"   password: "Farmer123!"`);
      console.log(`  Officer: username: "officer_perera" password: "Officer123!"`);
      console.log(`====================================================`);
    });

    const shutdown = async () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[Server] Fatal error starting server:', error);
    process.exit(1);
  }
};

startServer();
