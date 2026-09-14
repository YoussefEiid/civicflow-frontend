import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { verifySmtpConnection, sendOTPEmail } from '../src/services/email.service.js';
import { generateOtp, hashOtp, compareOtp } from '../src/services/otp.service.js';

async function main() {
  console.log('=== TEST 1: OTP Generation & Hashing ===');
  const otp = generateOtp();
  console.log('Generated OTP:', otp, 'Length:', otp.length, 'Valid 6 digits:', /^\d{6}$/.test(otp));
  const hash = await hashOtp(otp);
  console.log('Bcrypt Hash:', hash.substring(0, 20) + '...');
  const match = await compareOtp(otp, hash);
  const wrongMatch = await compareOtp('000000', hash);
  console.log('Correct OTP match:', match);
  console.log('Wrong OTP rejected:', !wrongMatch);

  console.log('\n=== TEST 2: SMTP Verification ===');
  const isVerified = await verifySmtpConnection();
  console.log('SMTP Verified:', isVerified);

  console.log('\n=== TEST 3: Sending Real Test Email ===');
  const targetEmail = process.env.SMTP_USER || 'baszmat3@gmail.com';
  console.log('Dispatching test OTP email to:', targetEmail);
  const res = await sendOTPEmail({
    email: targetEmail,
    otp,
    purpose: 'verify_email',
    userName: 'المشرف العام',
    expiresInMinutes: 5
  });
  console.log('Email dispatch result:', res);
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
