import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { startSlaBackgroundJob } from './jobs/slaChecker.job.js';
import { seedDatabase } from './seed.js';

export const IRAQI_GOVERNORATES = [
  'دهوك',
  'نينوى',
  'أربيل',
  'كركوك',
  'السليمانية',
  'صلاح الدين',
  'الأنبار',
  'ديالى',
  'بغداد',
  'واسط',
  'بابل',
  'كربلاء',
  'النجف',
  'القادسية',
  'ميسان',
  'ذي قار',
  'المثنى',
  'البصرة',
  'حلبجة'
];

async function ensureIraqiGovernorates() {
  try {
    for (const name of IRAQI_GOVERNORATES) {
      const existing = await prisma.city.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } }
      });
      if (!existing) {
        await prisma.city.create({
          data: { name, status: 'ACTIVE' }
        });
      }
    }
    console.log('✅ Ensured all 19 Iraqi Governorates are registered in the database.');
  } catch (err) {
    console.warn('⚠️ Governorates sync notice:', err);
  }
}

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

    // Ensure all 19 Iraqi Governorates exist
    await ensureIraqiGovernorates();

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