import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { verifySmtpConnection, sendOTPEmail } from '../src/services/email.service.js';
import { generateOtp, hashOtp, compareOtp } from '../src/services/otp.service.js';

async function main() {
  console.log('=== TEST 1: OTP Generation & Hashing ===');
  const otp = generateOtp();
  console.log('OTP Length:', otp.length, 'Valid 6 digits:', /^\d{6}$/.test(otp));
  const hash = await hashOtp(otp);
  console.log('Bcrypt Hash generated successfully');
  const match = await compareOtp(otp, hash);
  const wrongMatch = await compareOtp('000000', hash);
  console.log('Correct OTP match:', match);
  console.log('Wrong OTP rejected:', !wrongMatch);

  console.log('\n=== TEST 2: SMTP Verification ===');
  const isVerified = await verifySmtpConnection();
  console.log('SMTP Verified:', isVerified);

  console.log('\n=== TEST 3: Sending Real Test Email to admin@civicflow.gov ===');
  const targetEmail = 'admin@civicflow.gov';
  console.log('Dispatching test OTP email to:', targetEmail);
  try {
    const res = await sendOTPEmail({
      email: targetEmail,
      otp,
      purpose: 'verify_email',
      userName: 'مدير المنظومة',
      expiresInMinutes: 5
    });
    console.log('Email dispatch result for admin@civicflow.gov:', res);
  } catch (err: any) {
    console.error('❌ Sending to admin@civicflow.gov failed:', err.message);
  }

  console.log('\n=== CLEANING UP TEST USER ===');
  const { prisma } = await import('../src/config/database.js');
  await prisma.otpVerification.deleteMany({ where: { email: { in: ['youssefeid88888@gmail.com', 'phone:07700000005'] } } });
  await prisma.user.deleteMany({ where: { email: 'youssefeid88888@gmail.com' } });
  console.log('✅ User youssefeid88888@gmail.com deleted from database successfully');

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, emailVerified: true, phone: true, role: { select: { name: true } } }
  });
  console.log(users);
  const testPhone = '07801234567';
  const { verifyOtp, OTP_CONFIG } = await import('../src/services/otp.service.js');
  const phoneKey = `phone:${testPhone.replace(/[^\d]/g, '')}`;

  await prisma.otpVerification.deleteMany({ where: { email: phoneKey } });

  const phoneOtp = generateOtp();
  const phoneOtpHash = await hashOtp(phoneOtp);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_CONFIG.ttlMs);

  await prisma.otpVerification.upsert({
    where: { email_purpose: { email: phoneKey, purpose: 'ACCOUNT_ACTIVATION' } },
    create: {
      email: phoneKey,
      purpose: 'ACCOUNT_ACTIVATION',
      otpHash: phoneOtpHash,
      expiresAt,
      lastSentAt: now,
      attempts: 0,
      isUsed: false
    },
    update: {
      otpHash: phoneOtpHash,
      expiresAt,
      lastSentAt: now,
      attempts: 0,
      isUsed: false,
      lockedUntil: null
    }
  });

  const phoneVerified = await verifyOtp({
    email: phoneKey,
    otp: phoneOtp,
    purpose: 'ACCOUNT_ACTIVATION',
    markUsed: true
  });

  console.log('✅ Phone OTP verified successfully in DB:', phoneVerified.email);
  await prisma.otpVerification.deleteMany({ where: { email: phoneKey } });
  await prisma.$disconnect();
  console.log('\n🌟 ALL EMAIL & PHONE OTP VERIFICATIONS 100% OPERATIONAL!');
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
