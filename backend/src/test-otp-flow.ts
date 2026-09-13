/**
 * 🔐 Email OTP Verification — End-to-End Automated Test Suite
 * ============================================================
 *
 * Covers the five core security requirements:
 *   T1 Happy path       -> request OTP, submit correct code, get JWT
 *   T2 Expiration       -> correct code submitted after expiry is rejected
 *   T3 Single-use       -> a consumed OTP cannot be reused
 *   T4 Brute-force lock -> 5 wrong attempts temporarily lock verification
 *   T5 Resend cooldown  -> resending before 60s is blocked, works after
 *
 * PREREQUISITES
 *   1. Backend running against a dev database:
 *        cd backend
 *        set OTP_EXPOSE_IN_RESPONSE=true   # Windows PowerShell
 *        npm run dev
 *      (or: OTP_EXPOSE_IN_RESPONSE=true npm run dev  in bash/zsh)
 *      The flag lets the script read the generated code from the API
 *      response instead of an inbox. NEVER enable it in production.
 *
 *   2. Database seeded so the admin account exists:
 *        npm run prisma:seed
 *
 * RUN
 *     npm run dev            (terminal 1 — with the flag above)
 *     npx tsx src/test-otp-flow.ts   (terminal 2)
 *
 * The script creates a disposable test user and deletes it at the end.
 */
import assert from 'node:assert';
import bcrypt from 'bcrypt';
import { prisma } from './config/database.js';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

const TEST_EMAIL = `otp.e2e.${Date.now()}@civicflow.gov`;

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    process.stdout.write(`🧪 ${name}... `);
    await fn();
    console.log('✅ PASSED');
    passed++;
  } catch (err: any) {
    console.log('❌ FAILED');
    console.error('   Error:', err?.message || err);
    if (err?.responseBody) console.error('   Response:', JSON.stringify(err.responseBody));
    failed++;
  }
}

const api = {
  async post(path: string, body: any, token?: string) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) {
      const err: any = new Error(`[${res.status}] ${json.error?.code}: ${json.message}`);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    return { res, json };
  }
};

const devOtpOf = (json: any): string => {
  if (!json.data?.devOtp) {
    throw new Error(
      'devOtp missing from send-otp response. Ensure the dev server runs with OTP_EXPOSE_IN_RESPONSE=true (never in production).'
    );
  }
  return json.data.devOtp;
};

describeAll();

async function describeAll() {
  console.log('🚀 Running Email OTP Verification E2E Suite...\n');

  // ------------------------------------------------------------------
  // Column 0 — Setup
  // ------------------------------------------------------------------
  await test('0.1 API health check', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const json: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
  });

  await test(`0.2 Create disposable account (${TEST_EMAIL}) directly in DB`, async () => {
    // In a real registration app this row would be created by POST /api/auth/register
    // or by an admin via POST /api/users. The OTP flow only requires the user row;
    // using Prisma here keeps the suite hermetic (no dependency on admin credentials).
    const role = await prisma.role.findFirst();
    assert.ok(role, 'no role exists in the database — run the seed first');

    const passwordHash = await bcrypt.hash('otp-test-not-for-login', 10);
    const user = await prisma.user.create({
      data: {
        name: 'حساب اختبار OTP',
        email: TEST_EMAIL.toLowerCase(),
        phone: '0500000000',
        passwordHash,
        roleId: role!.id,
        department: 'إدارة المتابعة',
        status: 'ACTIVE',
        emailVerified: false
      }
    });
    assert.ok(user.id);
    assert.strictEqual(user.emailVerified, false, 'new account must start unverified');
  });

  // ------------------------------------------------------------------
  // T1 — Happy path: send -> correct code -> verified account + JWT
  // ------------------------------------------------------------------
  await test('1. Happy path: correct OTP within TTL verifies account and issues JWT', async () => {
    const sent = await api.post('/auth/send-otp', { email: TEST_EMAIL });
    assert.strictEqual(sent.json.success, true);
    assert.strictEqual(sent.json.data.email, TEST_EMAIL.toLowerCase());
    assert.ok(sent.json.data.expiresInMinutes > 0, 'response must report the TTL');
    const otp = devOtpOf(sent.json);

    const { res, json } = await api.post('/auth/verify-otp', { email: TEST_EMAIL, otp });
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.emailVerified, true, 'account must be flagged verified');
    assert.strictEqual(json.data.user.email, TEST_EMAIL.toLowerCase(), 'user returned');
    assert.ok(json.data.accessToken, 'JWT session token must be issued');
    assert.ok(Array.isArray(json.data.permissions));
    assert.ok(
      String(res.headers.get('set-cookie') || '').includes('refreshToken'),
      'refresh token must be set as an HTTP-only cookie'
    );

    // Confirm the account was flagged as verified in the database, not just in-memory.
    const dbUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL.toLowerCase() } });
    assert.strictEqual(dbUser?.emailVerified, true, 'users.emailVerified must be true in DB');
  });

  // ------------------------------------------------------------------
  // T2 — Expiration: correct code after >10 minutes must fail
  // ------------------------------------------------------------------
  await test('2. Expiration: correct OTP submitted after expiry is rejected', async () => {
    const sent = await api.post('/auth/send-otp', { email: TEST_EMAIL });
    const otp = devOtpOf(sent.json);

    // Travel forwards in time: backdate expiresAt ~1 minute into the past.
    const updated = await prisma.otpVerification.updateMany({
      where: { email: TEST_EMAIL.toLowerCase(), purpose: 'VERIFY_EMAIL' },
      data: { expiresAt: new Date(Date.now() - 60_000) }
    });
    assert.strictEqual(updated.count, 1, 'expected exactly one OTP record to backdate');

    let thrown: any;
    try {
      await api.post('/auth/verify-otp', { email: TEST_EMAIL, otp });
    } catch (err: any) {
      thrown = err;
    }
    assert.ok(thrown, 'verify must fail after expiry');
    assert.strictEqual(thrown.status, 400);
    assert.strictEqual(thrown.body?.error?.code, 'OTP_EXPIRED');
  });

  // ------------------------------------------------------------------
  // T3 — Single-use: a consumed OTP cannot be verified again
  // ------------------------------------------------------------------
  await test('3. Single-use: reusing an already-verified OTP is rejected', async () => {
    const sent = await api.post('/auth/send-otp', { email: TEST_EMAIL });
    const otp = devOtpOf(sent.json);

    const first = await api.post('/auth/verify-otp', { email: TEST_EMAIL, otp });
    assert.strictEqual(first.json.success, true, 'first use must succeed');

    let thrown: any;
    try {
      await api.post('/auth/verify-otp', { email: TEST_EMAIL, otp });
    } catch (err: any) {
      thrown = err;
    }
    assert.ok(thrown, 'second use must fail');
    assert.strictEqual(thrown.status, 400);
    assert.strictEqual(thrown.body?.error?.code, 'INVALID_OTP');
  });

  // ------------------------------------------------------------------
  // T4 — Brute-force lock: 5 wrong attempts block further verification
  // ------------------------------------------------------------------
  await test('4. Rate-limit: 5 wrong attempts lock out verification temporarily', async () => {
    await api.post('/auth/send-otp', { email: TEST_EMAIL }); // fresh record (attempts reset)

    const expectations = [
      401, // attempt 1 -> INVALID_OTP, 4 remaining
      401, // attempt 2 -> INVALID_OTP, 3 remaining
      401, // attempt 3 -> INVALID_OTP, 2 remaining
      401, // attempt 4 -> INVALID_OTP, 1 remaining
      429  // attempt 5 -> OTP_LOCKED (threshold reached)
    ];

    for (let i = 0; i < expectations.length; i++) {
      let thrown: any;
      try {
        await api.post('/auth/verify-otp', { email: TEST_EMAIL, otp: '000000' });
      } catch (err: any) {
        thrown = err;
      }
      assert.ok(thrown, `attempt ${i + 1} must fail`);
      assert.strictEqual(
        thrown.status,
        expectations[i],
        `attempt ${i + 1}: expected HTTP ${expectations[i]}, got ${thrown.status} (${thrown.body?.error?.code})`
      );

      if (i === 3) {
        assert.strictEqual(thrown.body?.error?.details?.attemptsRemaining, 1);
      }
      if (i === 4) {
        assert.strictEqual(thrown.body?.error?.code, 'OTP_LOCKED');
        assert.ok(thrown.body?.error?.details?.retryAfterSeconds > 0, 'lock must report retryAfterSeconds');
      }
    }

    // 6th attempt — even a correct code would be rejected while locked
    let stillLocked: any;
    try {
      await api.post('/auth/verify-otp', { email: TEST_EMAIL, otp: '111111' });
    } catch (err: any) {
      stillLocked = err;
    }
    assert.ok(stillLocked, 'verification must remain locked');
    assert.strictEqual(stillLocked.status, 429);
    assert.strictEqual(stillLocked.body?.error?.code, 'OTP_LOCKED');
  });

  // ------------------------------------------------------------------
  // T5 — Resend cooldown: blocked before 60s, allowed after 60s
  // ------------------------------------------------------------------
  await test('5. Resend cooldown: blocked within 60s, succeeds afterwards', async () => {
    const sent = await api.post('/auth/send-otp', { email: TEST_EMAIL });
    const firstOtp = devOtpOf(sent.json);

    let blocked: any;
    try {
      await api.post('/auth/resend-otp', { email: TEST_EMAIL });
    } catch (err: any) {
      blocked = err;
    }
    assert.ok(blocked, 'immediate resend must be blocked by cooldown');
    assert.strictEqual(blocked.status, 429);
    assert.strictEqual(blocked.body?.error?.code, 'OTP_COOLDOWN');
    assert.ok(
      blocked.body?.error?.details?.retryAfterSeconds > 0 && blocked.body?.error?.details?.retryAfterSeconds <= 60
    );

    // Travel forwards in time: pretend the last send was >60s ago.
    const updated = await prisma.otpVerification.updateMany({
      where: { email: TEST_EMAIL.toLowerCase(), purpose: 'VERIFY_EMAIL' },
      data: { lastSentAt: new Date(Date.now() - 61_000) }
    });
    assert.strictEqual(updated.count, 1);

    const resent = await api.post('/auth/resend-otp', { email: TEST_EMAIL });
    assert.strictEqual(resent.json.success, true, 'resend must succeed after cooldown');
    const secondOtp = devOtpOf(resent.json);
    assert.notStrictEqual(secondOtp, firstOtp, 'a fresh code must be generated on resend');
  });

  // ------------------------------------------------------------------
  // Column — Cleanup
  // ------------------------------------------------------------------
  await test('6. Cleanup: delete the disposable test user', async () => {
    const deleted = await prisma.user.deleteMany({
      where: { email: TEST_EMAIL.toLowerCase() }
    });
    assert.ok(deleted.count >= 1);
  });

  console.log('\n========================================');
  console.log(`🎉 Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests.`);
  console.log('========================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}