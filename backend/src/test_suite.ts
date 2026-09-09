import { PrismaClient } from '@prisma/client';
import { app } from './app.js';
import fs from 'fs';
import path from 'path';
import type { Server } from 'http';

const TEST_PORT = 5055;
const API_URL = `http://localhost:${TEST_PORT}/api`;
const prisma = new PrismaClient();

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(suite: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({
      suite,
      name,
      passed: true,
      durationMs: Date.now() - start
    });
    console.log(`  ✅ [PASS] ${suite} -> ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({
      suite,
      name,
      passed: false,
      durationMs: Date.now() - start,
      error: err.message || String(err)
    });
    console.error(`  ❌ [FAIL] ${suite} -> ${name}: ${err.message || String(err)}`);
    if (err.details) {
      console.error(`     Details:`, JSON.stringify(err.details));
    }
  }
}

async function apiRequest(
  endpoint: string,
  method = 'GET',
  body?: any,
  token?: string,
  customHeaders: Record<string, string> = {}
) {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...customHeaders
  };

  if (!(body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    data
  };
}

export async function runAllTests() {
  console.log('====================================================');
  console.log('🧪 CivicFlow Product Upgrade Comprehensive Test Suite');
  console.log('====================================================\n');

  await prisma.$connect();
  let server: Server | null = null;
  await new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`  🚀 In-memory test server listening on http://localhost:${TEST_PORT}\n`);
      resolve();
    });
  });

  let adminToken = '';
  let receptionistToken = '';

  // 1. Health check
  await runTest('Phase 0: Health', 'API Health endpoint returns 200', async () => {
    const res = await apiRequest('/public/form-data');
    if (res.status !== 200) {
      throw new Error(`Expected 200 from public endpoint, got ${res.status}`);
    }
  });

  // 2. Authentication
  await runTest('Phase 1: Auth', 'Login as Admin User', async () => {
    const res = await apiRequest('/auth/login', 'POST', {
      email: 'ahmed.ali@civicflow.gov',
      password: 'demo123456'
    });
    if (res.status !== 200 || !res.data?.data?.accessToken) {
      throw new Error(`Admin login failed with status ${res.status}: ${JSON.stringify(res.data)}`);
    }
    adminToken = res.data.data.accessToken;
  });

  await runTest('Phase 1: Auth', 'Login as Receptionist User', async () => {
    const res = await apiRequest('/auth/login', 'POST', {
      email: 'khaled.i@civicflow.gov',
      password: 'demo123456'
    });
    if (res.status !== 200 || !res.data?.data?.accessToken) {
      throw new Error(`Receptionist login failed with status ${res.status}`);
    }
    receptionistToken = res.data.data.accessToken;
  });

  // 3. Dynamic Cities API
  let testCityId = '';
  await runTest('Phase 2: Cities', 'Fetch active cities (public/dropdown)', async () => {
    const res = await apiRequest('/cities/active');
    if (res.status !== 200 || !Array.isArray(res.data?.data) || res.data.data.length === 0) {
      throw new Error(`Expected active cities array, got ${JSON.stringify(res.data)}`);
    }
    testCityId = res.data.data[0].id;
  });

  await runTest('Phase 2: Cities', 'Admin creates a new city', async () => {
    const uniqueSuffix = Date.now().toString().slice(-4);
    const res = await apiRequest(
      '/cities',
      'POST',
      { name: `مدينة الخرج التجريبية ${uniqueSuffix}`, code: `KHJ_${uniqueSuffix}`, isActive: true },
      adminToken
    );
    if (res.status !== 201 || !res.data?.data?.id) {
      throw new Error(`Failed to create city: ${JSON.stringify(res.data)}`);
    }
  });

  // 4. Dynamic Request Types API
  let testTypeId = '';
  await runTest('Phase 3: RequestTypes', 'Fetch active request types (public/dropdown)', async () => {
    const res = await apiRequest('/request-types/active');
    if (res.status !== 200 || !Array.isArray(res.data?.data) || res.data.data.length === 0) {
      throw new Error(`Expected active request types array, got ${JSON.stringify(res.data)}`);
    }
    testTypeId = res.data.data[0].id;
  });

  await runTest('Phase 3: RequestTypes', 'Admin creates a new request type', async () => {
    const uniqueSuffix = Date.now().toString().slice(-4);
    const res = await apiRequest(
      '/request-types',
      'POST',
      { name: `طلب ترخيص تجاري خاص ${uniqueSuffix}`, code: `LIC_${uniqueSuffix}`, description: 'ترخيص المنشآت', isActive: true },
      adminToken
    );
    if (res.status !== 201 || !res.data?.data?.id) {
      throw new Error(`Failed to create request type: ${JSON.stringify(res.data)}`);
    }
  });

  // 5. Public Form Data & Public Submission
  let submittedReqNumber = '';
  let submittedTrackingToken = '';
  await runTest('Phase 4: Public Submission', 'Public form data returns ministries, cities, requestTypes', async () => {
    const res = await apiRequest('/public/form-data');
    if (res.status !== 200 || !res.data?.data?.ministries || !res.data?.data?.cities || !res.data?.data?.requestTypes) {
      throw new Error(`Invalid public form data response: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('Phase 4: Public Submission', 'Citizen submits public request with customer auto-creation', async () => {
    const ministry = await prisma.ministry.findFirst();
    if (!ministry) throw new Error('No ministry in database');

    const formData = new FormData();
    formData.append('name', 'عبدالله سلطان القحطاني');
    formData.append('phone', '0555123456');
    formData.append('nationalId', '1098765432');
    formData.append('cityId', testCityId);
    formData.append('address', 'حي الملقا، شارع أنس بن مالك');
    formData.append('ministryId', ministry.id);
    formData.append('requestTypeId', testTypeId);
    formData.append('title', 'طلب إفادة مطابقة اشتراطات');
    formData.append('details', 'نرجو التكرم بالموافقة على إصدار إفادة المطابقة للاشتراطات الفنية');

    const res = await apiRequest('/public/submit-request', 'POST', formData);
    if (res.status !== 201 || !res.data?.data?.requestNumber || !res.data?.data?.trackingToken) {
      throw new Error(`Public submission failed: ${JSON.stringify(res.data)}`);
    }
    submittedReqNumber = res.data.data.requestNumber;
    submittedTrackingToken = res.data.data.trackingToken;
  });

  // 6. Public Tracking & Privacy
  await runTest('Phase 5: Public Tracking', 'Citizen tracks request by requestNumber', async () => {
    const res = await apiRequest(`/public/track/${submittedReqNumber}`);
    if (res.status !== 200 || res.data?.data?.requestNumber !== submittedReqNumber) {
      throw new Error(`Tracking failed: ${JSON.stringify(res.data)}`);
    }
    // Verify privacy: internalNotes and employee info must NOT exist in public response
    if (res.data.data.internalNotes || res.data.data.assignedEmployeeId) {
      throw new Error('Privacy breach: internalNotes or employee ID exposed in public tracking!');
    }
  });

  // 7. Request Status Enforcements & Rules
  let targetRequestId = '';
  await runTest('Phase 6: Status Rules', 'Locate created request in admin requests list', async () => {
    const res = await apiRequest(`/requests?search=${submittedReqNumber}`, 'GET', undefined, adminToken);
    if (res.status !== 200 || !res.data?.data?.requests || res.data.data.requests.length === 0) {
      throw new Error(`Could not find request ${submittedReqNumber} in admin list`);
    }
    targetRequestId = res.data.data.requests[0].id;
  });

  await runTest('Phase 6: Status Rules', 'Block transition to "تم إرسال الطلب للجهة" without sending document (Must fail 400)', async () => {
    const res = await apiRequest(
      `/requests/${targetRequestId}/status`,
      'PATCH',
      { newStatus: 'تم إرسال الطلب للجهة', note: 'تجربة إرسال بدون مرفق' },
      adminToken
    );
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 validation error, got status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('Phase 6: Status Rules', 'Block transition to "موافقة" without approval document (Must fail 400)', async () => {
    const res = await apiRequest(
      `/requests/${targetRequestId}/status`,
      'PATCH',
      { newStatus: 'موافقة', note: 'تجربة موافقة بدون مستند' },
      adminToken
    );
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 validation error, got status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('Phase 6: Status Rules', 'Block transition to "مرفوض" without rejection reason (Must fail 400)', async () => {
    const res = await apiRequest(
      `/requests/${targetRequestId}/status`,
      'PATCH',
      { newStatus: 'مرفوض', rejectionReason: '' },
      adminToken
    );
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 validation error, got status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('Phase 6: Status Rules', 'Succeed transition to "مرفوض" with valid rejection reason (Must 200)', async () => {
    const res = await apiRequest(
      `/requests/${targetRequestId}/status`,
      'PATCH',
      { newStatus: 'مرفوض', rejectionReason: 'عدم تطابق المرفقات مع المعايير الفنية المعتمدة' },
      adminToken
    );
    if (res.status !== 200 || res.data?.data?.status !== 'مرفوض') {
      throw new Error(`Failed to transition to rejected: ${JSON.stringify(res.data)}`);
    }
  });

  // 8. Customizable Excel & Vector PDF Exports
  await runTest('Phase 7: Custom Exports', 'Export requests to Excel with custom selected columns', async () => {
    const res = await apiRequest(
      '/reports/requests/export',
      'POST',
      { columns: ['requestNumber', 'customerName', 'customerPhone', 'cityName', 'status'] },
      adminToken
    );
    if (res.status !== 200) {
      throw new Error(`Excel export failed with status ${res.status}`);
    }
  });

  await runTest('Phase 7: Custom Exports', 'Export requests to Arabic RTL PDF with custom columns', async () => {
    const res = await apiRequest(
      '/reports/requests/export/pdf',
      'POST',
      { columns: ['requestNumber', 'customerName', 'cityName', 'ministryName', 'status', 'receiveDate'] },
      adminToken
    );
    if (res.status !== 200) {
      throw new Error(`PDF export failed with status ${res.status}`);
    }
  });

  // 9. Audit Logs & Diff Inspection
  let testAuditLogId = '';
  await runTest('Phase 8: Audit Logs', 'Fetch audit logs list', async () => {
    const res = await apiRequest('/audit-logs', 'GET', undefined, adminToken);
    if (res.status !== 200 || !res.data?.data?.auditLogs || res.data.data.auditLogs.length === 0) {
      throw new Error(`Failed to fetch audit logs: ${JSON.stringify(res.data)}`);
    }
    testAuditLogId = res.data.data.auditLogs[0].id;
  });

  await runTest('Phase 8: Audit Logs', 'Inspect single audit log operation with before/after diffs', async () => {
    const res = await apiRequest(`/audit-logs/${testAuditLogId}`, 'GET', undefined, adminToken);
    if (res.status !== 200 || !res.data?.data?.id) {
      throw new Error(`Failed to fetch audit log detail: ${JSON.stringify(res.data)}`);
    }
  });

  await runTest('Phase 8: Audit Logs', 'Export Audit Logs to PDF', async () => {
    const res = await apiRequest('/audit-logs/export/pdf', 'GET', undefined, adminToken);
    if (res.status !== 200) {
      throw new Error(`Audit logs PDF export failed with status ${res.status}`);
    }
  });

  console.log('\n====================================================');
  console.log('📊 Test Suite Execution Summary:');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`  Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  if (failedCount > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - [${r.suite}] ${r.name}: ${r.error}`);
    });
  }
  console.log('====================================================\n');

  if (server) {
    (server as any).close();
  }
  await prisma.$disconnect();

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((e) => {
  console.error('Fatal test suite error:', e);
  process.exit(1);
});
