import assert from 'node:assert';

const BACKEND_URL = 'http://localhost:5000/api';
const VITE_PROXY_URL = 'http://localhost:5173/api';

const ACCOUNTS = [
  { email: 'ahmed.ali@civicflow.gov', password: 'demo123456', role: 'مدير النظام', roleKey: 'SUPER_ADMIN' },
  { email: 'm.hassan@civicflow.gov', password: 'demo123456', role: 'مشرف', roleKey: 'SUPERVISOR' },
  { email: 'sara.m@civicflow.gov', password: 'demo123456', role: 'موظف متابعة', roleKey: 'FOLLOW_UP' },
  { email: 'khaled.i@civicflow.gov', password: 'demo123456', role: 'موظف استقبال', roleKey: 'RECEPTIONIST' }
];

async function runTests() {
  console.log('🚀 Running Complete Frontend & Backend Authentication Integration Verification...\n');
  let passed = 0;
  let failed = 0;

  async function test(title: string, fn: () => Promise<void>) {
    try {
      process.stdout.write(`🧪 ${title}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err: any) {
      console.log('❌ FAILED');
      console.error('   Error:', err?.message || err);
      failed++;
    }
  }

  // 1. Health checks
  await test('1. Direct Backend Health Check (http://localhost:5000/api/health)', async () => {
    const res = await fetch(`${BACKEND_URL}/health`);
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message, 'API is running');
  });

  await test('2. Vite Proxy Health Check (http://localhost:5173/api/health)', async () => {
    const res = await fetch(`${VITE_PROXY_URL}/health`);
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message, 'API is running');
  });

  // 2. Test All 4 Development Accounts Login
  for (const acc of ACCOUNTS) {
    await test(`3. Login with ${acc.email} (${acc.role})`, async () => {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.password })
      });
      const data: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(data.data.accessToken);
      assert.strictEqual(data.data.user.email, acc.email);
      assert.ok(Array.isArray(data.data.permissions));
      assert.ok(data.data.permissions.length > 0);

      // Check cookie header
      const cookie = res.headers.get('set-cookie');
      assert.ok(cookie?.includes('refreshToken'), 'Response must include refreshToken cookie');

      // Check /api/auth/me
      const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${data.data.accessToken}` }
      });
      const meData: any = await meRes.json();
      assert.strictEqual(meRes.status, 200);
      assert.strictEqual(meData.success, true);
      assert.strictEqual(meData.data.user.email, acc.email);
    });
  }

  // 3. Test Vite Proxy Login
  let adminAccessToken = '';
  let refreshTokenCookie = '';
  await test('4. Vite Proxy Login (http://localhost:5173/api/auth/login)', async () => {
    const res = await fetch(`${VITE_PROXY_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ahmed.ali@civicflow.gov', password: 'demo123456' })
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.accessToken);
    adminAccessToken = data.data.accessToken;
    refreshTokenCookie = res.headers.get('set-cookie') || '';
  });

  // 4. Session Refresh using Cookie
  await test('5. Refresh Session via Cookie (/api/auth/refresh)', async () => {
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: refreshTokenCookie
      }
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.accessToken);
    assert.strictEqual(data.data.user.email, 'ahmed.ali@civicflow.gov');
  });

  // 5. Logout & Revocation
  await test('6. Logout (/api/auth/logout)', async () => {
    const res = await fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: refreshTokenCookie
      }
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);

    // Verify refresh fails after logout
    const refreshAfterLogout = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: refreshTokenCookie
      }
    });
    assert.strictEqual(refreshAfterLogout.status, 401);
  });

  // 6. Protected Routes Security
  await test('7. Protected Endpoint Rejects Unauthorized Access', async () => {
    const res = await fetch(`${BACKEND_URL}/requests`);
    assert.strictEqual(res.status, 401);
  });

  console.log('\n========================================');
  console.log(`🎉 Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests.`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
