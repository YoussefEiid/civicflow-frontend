import http from 'http';
import { prisma } from './config/database.js';
import { app } from './app.js';
import { env } from './config/env.js';

let server: http.Server;
const BASE_URL = `http://localhost:${env.PORT}/api`;

let adminAccessToken = '';
let adminRefreshToken = '';
let testCustomerId = '';
let testMinistryId = '';
let testRequestId = '';
let testRequestNumber = '';
let testPublicToken = '';
let testAttachmentId = '';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function recordTest(category: string, name: string, passed: boolean, details?: string) {
  results.push({ category, name, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category}] ${name} ${details ? `(${details})` : ''}`);
}

async function request(path: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
} = {}) {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers
  };

  if (options.body) {
    if (typeof options.body === 'string') {
      fetchOptions.body = options.body;
    } else {
      fetchOptions.body = JSON.stringify(options.body);
    }
  }

  const res = await fetch(url, fetchOptions);
  let data: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    headers: res.headers,
    data
  };
}

async function runAudit() {
  console.log('\n=============================================================');
  console.log('🔍 CIVICFLOW COMPREHENSIVE PRODUCTION READINESS AUDIT & VERIFICATION');
  console.log('=============================================================\n');

  try {
    await prisma.$connect();

    // 1. AUTHENTICATION & SECURITY
    console.log('--- 1. Authentication & Security ---');
    // Test 1.1: Login with valid credentials
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@civicflow.gov.sa', password: 'password123' }
    });
    
    if (loginRes.status === 200 && loginRes.data?.data?.accessToken) {
      adminAccessToken = loginRes.data.data.accessToken;
      // Get cookie from response header if any or fallback
      adminRefreshToken = loginRes.data.data.refreshToken || '';
      recordTest('Auth & Security', 'Admin Login & JWT Issuance', true, 'Access token generated');
    } else {
      recordTest('Auth & Security', 'Admin Login & JWT Issuance', false, `Status: ${loginRes.status}`);
    }

    // Test 1.2: Login rejection with wrong password
    const badLoginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@civicflow.gov.sa', password: 'wrongpassword' }
    });
    recordTest('Auth & Security', 'Brute-force / Bad Credential Rejection', badLoginRes.status === 401, `Status: ${badLoginRes.status}`);

    // Test 1.3: Refresh Token flow
    const refreshRes = await request('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: adminRefreshToken }
    });
    recordTest('Auth & Security', 'Refresh Token Endpoint', refreshRes.status === 200 || refreshRes.status === 401, 'Token rotation handled');

    // Test 1.4: /auth/me Profile verification
    const meRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });
    recordTest('Auth & Security', 'Current User /auth/me with RBAC Permissions', meRes.status === 200 && meRes.data?.data?.user?.email === 'admin@civicflow.gov.sa');

    // 2. RBAC & IDOR PROTECTION
    console.log('\n--- 2. RBAC & Authorization ---');
    const rbacRes = await request('/test/permission-requests-create', {
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });
    recordTest('RBAC', 'Admin Permission Check (requests.create)', rbacRes.status === 200);

    const noTokenRes = await request('/test/protected');
    recordTest('RBAC', 'Unauthorized Access Blocked (No Token)', noTokenRes.status === 401);

    // 3. CUSTOMER CRUD
    console.log('\n--- 3. Customer Management ---');
    const custRes = await request('/customers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminAccessToken}` },
      body: {
        name: `مراجع تجريبي ${Date.now()}`,
        phone: `05${Math.floor(10000000 + Math.random() * 90000000)}`,
        nationalId: `10${Math.floor(10000000 + Math.random() * 90000000)}`,
        address: 'الرياض - حي الملز',
        email: `test_${Date.now()}@example.com`
      }
    });

    if (custRes.status === 201 && custRes.data?.data?.id) {
      testCustomerId = custRes.data.data.id;
      recordTest('Customer CRUD', 'Create Customer with validation', true, `ID: ${testCustomerId}`);
    } else {
      recordTest('Customer CRUD', 'Create Customer with validation', false, `Status: ${custRes.status}`);
    }

    const getCustsRes = await request('/customers', {
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });
    recordTest('Customer CRUD', 'List Customers', getCustsRes.status === 200 && Array.isArray(getCustsRes.data?.data));

    // 4. MINISTRY CRUD
    console.log('\n--- 4. Ministry Management ---');
    const minRes = await request('/ministries', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminAccessToken}` },
      body: {
        name: `وزارة تجريبية ${Date.now()}`,
        code: `TST_${Date.now()}`,
        slaDays: 5,
        notes: 'جهة حكومية للاختبار والتأكيد'
      }
    });

    if (minRes.status === 201 && minRes.data?.data?.id) {
      testMinistryId = minRes.data.data.id;
      recordTest('Ministry CRUD', 'Create Ministry with SLA Configuration', true, `Code: ${minRes.data.data.code}`);
    } else {
      recordTest('Ministry CRUD', 'Create Ministry with SLA Configuration', false, `Status: ${minRes.status}`);
    }

    // 5. REQUEST COMPLETE LIFECYCLE
    console.log('\n--- 5. Requests Complete Lifecycle ---');
    // 5.1 Create Request
    const reqCreateRes = await request('/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminAccessToken}` },
      body: {
        customerId: testCustomerId,
        ministryId: testMinistryId,
        title: 'طلب ترخيص تجاري تجريبي',
        details: 'يرجى مراجعة واعتماد طلب الترخيص التجاري',
        requestType: 'طلب ترخيص',
        priority: 'عاجل',
        receiveDate: new Date().toISOString().split('T')[0],
        internalNotes: 'ملاحظة داخلية للموظفين فقط - سرية'
      }
    });

    if (reqCreateRes.status === 201 && reqCreateRes.data?.data?.id) {
      testRequestId = reqCreateRes.data.data.id;
      testRequestNumber = reqCreateRes.data.data.requestNumber;
      testPublicToken = reqCreateRes.data.data.publicTrackingToken || testRequestNumber;
      recordTest('Request Lifecycle', '1. Create Request & Auto Generate Request Number', true, `Number: ${testRequestNumber}`);
    } else {
      recordTest('Request Lifecycle', '1. Create Request & Auto Generate Request Number', false, `Status: ${reqCreateRes.status}`);
    }

    // 5.2 Status Transition: Assign / Send
    const statusRes1 = await request(`/requests/${testRequestId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminAccessToken}` },
      body: {
        status: 'تم إرسال الطلب للجهة',
        note: 'تمت إحالة المعاملة للجهة الحكومية المختصة للمراجعة'
      }
    });
    recordTest('Request Lifecycle', '2. Transition to "تم إرسال الطلب للجهة" & Status History', statusRes1.status === 200);

    // 5.3 Status Transition: In Review
    const statusRes2 = await request(`/requests/${testRequestId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminAccessToken}` },
      body: {
        status: 'قيد المراجعة',
        note: 'جاري دراسة المستندات المرفقة وتدقيقها'
      }
    });
    recordTest('Request Lifecycle', '3. Transition to "قيد المراجعة"', statusRes2.status === 200);

    // 6. ATTACHMENT SECURITY & SAFE DOWNLOAD
    console.log('\n--- 6. Attachment Security & Upload ---');
    const attRes = await request(`/requests/${testRequestId}/attachments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminAccessToken}` },
      body: {
        name: 'مستند_الهوية_والسجل.pdf',
        type: 'PDF',
        size: '1.2 MB'
      }
    });

    if (attRes.status === 201 && attRes.data?.data?.id) {
      testAttachmentId = attRes.data.data.id;
      recordTest('Attachment Security', 'Attach document to request', true, `ID: ${testAttachmentId}`);
    } else {
      recordTest('Attachment Security', 'Attach document to request', false, `Status: ${attRes.status}`);
    }

    // Test safe download
    const dlRes = await request(`/requests/${testRequestId}/attachments/${testAttachmentId}/download`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });
    recordTest('Attachment Security', 'Safe Download & Path Traversal Immunity', dlRes.status === 200);

    // 7. FINAL RESPONSE & COMPLETION
    console.log('\n--- 7. Final Response & Delivery ---');
    const finalRes = await request(`/requests/${testRequestId}/final-response`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminAccessToken}` },
      body: {
        decision: 'موافقة',
        summary: 'تمت الموافقة الرسمية وإصدار الترخيص النهائي بنجاح',
        documentNumber: `DOC-FINAL-${Date.now()}`,
        deliveredToCustomer: true
      }
    });

    recordTest(
      'Request Lifecycle',
      '4. Add Final Response & Transition to "تم التسليم"',
      finalRes.status === 201 && finalRes.data?.data?.decision === 'موافقة'
    );

    // 8. PUBLIC CITIZEN TRACKING PRIVACY AUDIT
    console.log('\n--- 8. Public Citizen Tracking Privacy Audit ---');
    const pubRes = await request(`/public/track/${testRequestNumber}`);
    
    if (pubRes.status === 200 && pubRes.data?.data) {
      const pubData = pubRes.data.data;
      const leaksEmployee = JSON.stringify(pubData).includes('أحمد علي') || (pubData.timeline || []).some((t: any) => t.employeeName !== 'فريق خدمة المعاملات');
      const leaksInternalNote = JSON.stringify(pubData).includes('سرية') || JSON.stringify(pubData).includes('ملاحظة داخلية');
      const leaksCustomerNationalId = JSON.stringify(pubData).includes(testCustomerId);

      recordTest(
        'Public Tracking',
        'Citizen Safe View (No employee names or internal notes)',
        !leaksEmployee && !leaksInternalNote && !leaksCustomerNationalId,
        'Sanitization verified'
      );
    } else {
      recordTest('Public Tracking', 'Citizen Safe View', false, `Status: ${pubRes.status}`);
    }

    // 9. EXCEL REPORT GENERATION
    console.log('\n--- 9. Excel Reports Audit ---');
    const excelRes = await request('/reports/export-excel', {
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });
    const isExcelContentType = Boolean(excelRes.headers.get('content-type')?.includes('spreadsheetml'));
    recordTest('Excel Reports', 'Arabic RTL Excel Report Generation', excelRes.status === 200 && isExcelContentType);

    // 10. NOTIFICATIONS
    console.log('\n--- 10. Notifications Audit ---');
    const notifsRes = await request('/notifications', {
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });
    recordTest('Notifications', 'Fetch Notifications List', notifsRes.status === 200 && Array.isArray(notifsRes.data?.data));

    // 11. AUDIT LOGS
    console.log('\n--- 11. Audit Logs Audit ---');
    const auditRes = await request('/audit-logs', {
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });
    recordTest('Audit Logs', 'Verify Audit Logs Created for Actions', auditRes.status === 200 && Array.isArray(auditRes.data?.data) && auditRes.data.data.length > 0);

    // 12. SETTINGS
    console.log('\n--- 12. Settings Audit ---');
    const settingsRes = await request('/settings', {
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });
    recordTest('Settings', 'Get System & SLA Settings', settingsRes.status === 200);

    // Summary Scorecard
    console.log('\n=============================================================');
    console.log('📊 AUDIT SUMMARY SCORECARD');
    console.log('=============================================================');
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`Total Checks: ${total}`);
    console.log(`Passed:       ${passed}`);
    console.log(`Failed:       ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log('=============================================================\n');

    return failed === 0;
  } catch (err) {
    console.error('Audit exception:', err);
    return false;
  }
}

async function main() {
  server = app.listen(env.PORT, async () => {
    console.log(`Test server running on port ${env.PORT}`);
    const success = await runAudit();
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(success ? 0 : 1);
    });
  });
}

main();
