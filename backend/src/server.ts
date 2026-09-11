import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { startSlaBackgroundJob } from './jobs/slaChecker.job.js';
import { seedDatabase } from './seed.js';

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ PostgreSQL database connected successfully via Prisma');

    // Automatically seed if database is empty
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('🌱 Database is empty. Running automatic initial seed...');
        await seedDatabase();
        console.log('✅ Automatic seeding completed successfully!');
      }
    } catch (seedErr) {
      console.warn('⚠️ Seeding check notice:', seedErr);
    }

    // Start background SLA job
    startSlaBackgroundJob();

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 CivicFlow Backend running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`👉 Health check: http://localhost:${env.PORT}/api/health`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, closing server and disconnecting database...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('👋 Database disconnected. Server shut down cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Failed to start backend server:', error);
    process.exit(1);
  }
}

startServer();