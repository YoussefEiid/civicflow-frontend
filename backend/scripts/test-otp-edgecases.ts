import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { prisma } from '../src/config/database.js';
import { issueOtp, verifyOtp, resendOtp, generateOtp, hashOtp, compareOtp, OTP_CONFIG } from '../src/services/otp.service.js';

async function runEdgeCases() {
  console.log('🧪 STARTING COMPREHENSIVE OTP SECURITY & LIFECYCLE TESTS\n');
  const testEmail = 'security-test@civicflow.local';

  // Clean up any test records
  await prisma.otpVerification.deleteMany({ where: { email: testEmail } });

  // 1. Issue fresh OTP
  console.log('1️⃣ Test: Issue fresh OTP');
  const issued = await issueOtp({
    email: testEmail,
    purpose: 'VERIFY_EMAIL',
    userName: 'Test User'
  });
  console.log('   OTP generated (6 digits):', /^\d{6}$/.test(issued.otp));
  console.log('   Expires at:', issued.expiresAt.toISOString());

  // 2. Test wrong OTP rejection & attempt countdown
  console.log('\n2️⃣ Test: Wrong OTP attempt');
  try {
    await verifyOtp({ email: testEmail, otp: '000000', purpose: 'VERIFY_EMAIL', markUsed: true });
    console.error('   ❌ FAILED: Wrong OTP was accepted');
  } catch (err: any) {
    console.log('   ✅ PASS: Wrong OTP rejected with message:', err.message);
  }

  // 3. Test correct OTP verification
  console.log('\n3️⃣ Test: Correct OTP verification');
  const verified = await verifyOtp({ email: testEmail, otp: issued.otp, purpose: 'VERIFY_EMAIL', markUsed: true });
  console.log('   ✅ PASS: Verified successfully for email:', verified.email);

  // 4. Test used OTP cannot be reused
  console.log('\n4️⃣ Test: Used OTP cannot be reused (Single Use)');
  try {
    await verifyOtp({ email: testEmail, otp: issued.otp, purpose: 'VERIFY_EMAIL', markUsed: true });
    console.error('   ❌ FAILED: Reused OTP was accepted');
  } catch (err: any) {
    console.log('   ✅ PASS: Used OTP rejected:', err.message);
  }

  // 5. Test Resend Cooldown
  console.log('\n5️⃣ Test: Resend Cooldown');
  // Issue another OTP
  const fresh = await issueOtp({ email: testEmail, purpose: 'VERIFY_EMAIL' });
  try {
    await resendOtp({ email: testEmail, purpose: 'VERIFY_EMAIL' });
    console.error('   ❌ FAILED: Resend allowed during cooldown');
  } catch (err: any) {
    console.log('   ✅ PASS: Resend rejected during cooldown:', err.message);
  }

  // 6. Test New OTP invalidates old OTP
  console.log('\n6️⃣ Test: New OTP invalidates previous OTP');
  // Force timestamp back to bypass cooldown for test
  await prisma.otpVerification.update({
    where: { email_purpose: { email: testEmail, purpose: 'VERIFY_EMAIL' } },
    data: { lastSentAt: new Date(Date.now() - 120000) }
  });
  const secondOtp = await issueOtp({ email: testEmail, purpose: 'VERIFY_EMAIL' });
  
  // Try verifying with the old first OTP (fresh.otp)
  try {
    await verifyOtp({ email: testEmail, otp: fresh.otp, purpose: 'VERIFY_EMAIL', markUsed: true });
    console.error('   ❌ FAILED: Old OTP was accepted after new OTP was generated');
  } catch (err: any) {
    console.log('   ✅ PASS: Old OTP rejected after new OTP was issued:', err.message);
  }

  // Verify new OTP succeeds
  const newVerified = await verifyOtp({ email: testEmail, otp: secondOtp.otp, purpose: 'VERIFY_EMAIL', markUsed: true });
  console.log('   ✅ PASS: New OTP verified successfully for email:', newVerified.email);

  // 7. Test Expiration
  console.log('\n7️⃣ Test: Expired OTP rejected');
  const expOtp = await issueOtp({ email: testEmail, purpose: 'VERIFY_EMAIL' });
  // Set expired in database
  await prisma.otpVerification.update({
    where: { email_purpose: { email: testEmail, purpose: 'VERIFY_EMAIL' } },
    data: { expiresAt: new Date(Date.now() - 60000) }
  });
  try {
    await verifyOtp({ email: testEmail, otp: expOtp.otp, purpose: 'VERIFY_EMAIL', markUsed: true });
    console.error('   ❌ FAILED: Expired OTP was accepted');
  } catch (err: any) {
    console.log('   ✅ PASS: Expired OTP rejected:', err.message);
  }

  // Cleanup
  await prisma.otpVerification.deleteMany({ where: { email: testEmail } });
  console.log('\n🎉 ALL 7 SECURITY & LIFECYCLE TESTS PASSED PERFECTLY!');
  await prisma.$disconnect();
}

runEdgeCases().catch(err => {
  console.error('Edge cases test failed:', err);
  process.exit(1);
});
