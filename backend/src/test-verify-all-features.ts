import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

async function runAllTests() {
  console.log('🚀 Starting Comprehensive CivicFlow Verification Test Suite...\n');
  let testsPassed = 0;
  let testsFailed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      process.stdout.write(`🧪 Testing: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      testsPassed++;
    } catch (err: any) {
      console.log('❌ FAILED');
      console.error('   Error:', err?.message || err);
      testsFailed++;
    }
  }

  let adminToken = '';
  let employeeToken = '';
  let createdCustomerId = '';
  let createdRequestId = '';
  let createdRequestNumber = '';
  let createdTrackingToken = '';
  let uploadedAttachmentId = '';
  let sampleTemplateId = '';

  // 1. PUBLIC & HEALTH
  await test('1. Public Endpoint & API Root Status', async () => {
    const res = await fetch(`${BASE_URL}/test/public`);
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.access, 'public');
  });

  // 2. AUTHENTICATION & RBAC
  await test('2.1 Login with Admin Credentials', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ahmed.ali@civicflow.gov',
        password: 'demo123456'
      })
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.accessToken);
    adminToken = data.data.accessToken;
    assert.ok(data.data.user.role === 'مدير النظام' || data.data.user.role === 'SUPER_ADMIN');
  });

  await test('2.2 Login with Supervisor Credentials & Verify Role', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'm.hassan@civicflow.gov',
        password: 'demo123456'
      })
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.user.role === 'مشرف' || data.data.user.role === 'SUPERVISOR');
    employeeToken = data.data.accessToken;
  });

  await test('2.3 Verify /auth/me with Admin Token', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.user.email, 'ahmed.ali@civicflow.gov');
    assert.ok(Array.isArray(data.data.user.permissions));
  });

  await test('2.4 Invalid Password Rejection', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ahmed.ali@civicflow.gov',
        password: 'wrongpassword'
      })
    });
    assert.strictEqual(res.status, 401);
  });

  // 3. CUSTOMERS MODULE
  await test('3.1 Create New Customer', async () => {
    const nationalId = `1${Date.now().toString().slice(-9)}`;
    const res = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'عمر طارق المهندس',
        phone: '0509998877',
        nationalId: nationalId,
        email: 'omar.engineer@test.gov',
        address: 'الرياض - حي النرجس'
      })
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.name, 'عمر طارق المهندس');
    createdCustomerId = data.data.id;
  });

  await test('3.2 List & Search Customers with Pagination', async () => {
    const res = await fetch(`${BASE_URL}/customers?search=عمر&page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data.customers));
    assert.ok(data.data.customers.length > 0);
    assert.ok(data.data.total >= 1);
  });

  // 4. MINISTRIES MODULE
  await test('4.1 List Ministries & SLAs', async () => {
    const res = await fetch(`${BASE_URL}/ministries`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.length >= 6);
  });

  // 5. REQUESTS MODULE & SLA
  await test('5.1 Create Request with Auto-Number & SLA Calculation', async () => {
    const minRes = await fetch(`${BASE_URL}/ministries`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const ministries: any[] = ((await minRes.json()) as any).data;
    const healthMin = ministries.find((m: any) => m.code === 'MOH') || ministries[0];

    const res = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        customerId: createdCustomerId,
        ministryId: healthMin.id,
        requestType: 'طلب تصريح صحي',
        priority: 'عاجل',
        title: 'طلب صيانة عاجل للمركز الصحي',
        details: 'يوجد عطل في أجهزة التكييف والإنارة في مركز الرعاية الصحية الأولية بحي النرجس',
        internalNotes: 'معاملة ذات أولوية قصوى'
      })
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.requestNumber.startsWith('REQ-2026-'));
    assert.ok(data.data.publicTrackingToken);
    assert.ok(data.data.expectedCompletionDate);
    assert.strictEqual(data.data.status, 'استلام الطلب');

    createdRequestId = data.data.id;
    createdRequestNumber = data.data.requestNumber;
    createdTrackingToken = data.data.publicTrackingToken;
  });

  await test('5.2 Change Request Status with History Logging', async () => {
    const res = await fetch(`${BASE_URL}/requests/${createdRequestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        newStatus: 'قيد المعالجة',
        note: 'تم إحالة الطلب إلى الفريق الفني للمعاينة الميدانية'
      })
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.status, 'قيد المعالجة');
  });

  // 6. ATTACHMENTS MODULE
  await test('6.1 Upload File Attachment (Multipart)', async () => {
    const boundary = '----WebKitFormBoundaryCivicFlowTest';
    const fileContent = 'Dummy inspection report content for automated testing.';
    const body =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="inspection-report.txt"\r\n` +
      `Content-Type: text/plain\r\n\r\n` +
      `${fileContent}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="name"\r\n\r\n` +
      `تقرير المعاينة الفنية.txt\r\n` +
      `--${boundary}--\r\n`;

    const res = await fetch(`${BASE_URL}/requests/${createdRequestId}/attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${adminToken}`
      },
      body: body
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.id);
    assert.strictEqual(data.data.name, 'تقرير المعاينة الفنية.txt');
    uploadedAttachmentId = data.data.id;
  });

  await test('6.2 Download Attachment', async () => {
    const res = await fetch(
      `${BASE_URL}/requests/${createdRequestId}/attachments/${uploadedAttachmentId}/download`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Dummy inspection report content'));
  });

  // 7. FINAL RESPONSE MODULE
  await test('7.1 Add Final Response & Auto-Transition Status', async () => {
    const boundary = '----WebKitFormBoundaryCivicFlowResponse';
    const fileContent = 'Official resolution statement approved by Ministry of Health.';
    const body =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="official-resolution.pdf"\r\n` +
      `Content-Type: application/pdf\r\n\r\n` +
      `${fileContent}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="decision"\r\n\r\n` +
      `موافقة\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="summary"\r\n\r\n` +
      `تم إتمام أعمال الصيانة واستبدال كافة وحدات التكييف والإنارة بنجاح وتم فحص المركز.\r\n` +
      `--${boundary}--\r\n`;

    const res = await fetch(`${BASE_URL}/requests/${createdRequestId}/final-response`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${adminToken}`
      },
      body: body
    });
    const data: any = await res.json();
    assert.ok(res.status === 200 || res.status === 201);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.summary.includes('تم إتمام أعمال الصيانة'));

    // Check request status updated to 'الإجابة جاهزة'
    const reqRes = await fetch(`${BASE_URL}/requests/${createdRequestId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const reqData: any = await reqRes.json();
    assert.strictEqual(reqData.data.status, 'الإجابة جاهزة');
  });

  // 8. PUBLIC TRACKING MODULE (CITIZEN-SAFE)
  await test('8.1 Track by Request Number (Public)', async () => {
    const res = await fetch(`${BASE_URL}/public/track/${createdRequestNumber}`);
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.requestNumber, createdRequestNumber);
    assert.strictEqual(data.data.status, 'الإجابة جاهزة');
    assert.ok(data.data.finalResponse);
    // Security check: no private internals leaked
    assert.strictEqual(data.data.customerId, undefined);
    assert.strictEqual(data.data.assignedEmployeeId, undefined);
  });

  await test('8.2 Track by Public Tracking Token', async () => {
    const res = await fetch(`${BASE_URL}/public/track/${createdTrackingToken}`);
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.requestNumber, createdRequestNumber);
  });

  // 9. NOTIFICATIONS MODULE
  await test('9.1 List Notifications & Mark All Read', async () => {
    const res = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data.notifications));

    // Mark all read
    const readRes = await fetch(`${BASE_URL}/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const readData: any = await readRes.json();
    assert.strictEqual(readRes.status, 200);
    assert.strictEqual(readData.success, true);
  });

  // 10. WHATSAPP MODULE
  await test('10.1 WhatsApp Templates List & Template Creation', async () => {
    const listRes = await fetch(`${BASE_URL}/whatsapp/templates`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listData: any = await listRes.json();
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listData.success, true);

    const createRes = await fetch(`${BASE_URL}/whatsapp/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        key: `UPDATE_TEST_${Date.now()}`,
        title: 'تحديث حالة المعاملة للمستفيد',
        content: 'مرحباً {{1}}، تم تحديث حالة معاملتكم رقم {{2}} إلى {{3}}.',
        variables: ['اسم المستفيد', 'رقم المعاملة', 'الحالة']
      })
    });
    const createData: any = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createData.success, true);
    sampleTemplateId = createData.data.id;
  });

  await test('10.2 Dispatch Simulated WhatsApp Message & Verify Log', async () => {
    const sendRes = await fetch(`${BASE_URL}/whatsapp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        phoneNumber: '0509998877',
        message: `مرحباً عمر، تم تحديث حالة معاملتكم رقم ${createdRequestNumber} إلى الإجابة جاهزة.`,
        requestId: createdRequestId
      })
    });
    const sendData: any = await sendRes.json();
    assert.strictEqual(sendRes.status, 200);
    assert.strictEqual(sendData.success, true);
    assert.ok(sendData.data.status === 'SENT' || sendData.data.status === 'MOCK_DISPATCHED');

    // Verify logs
    const logsRes = await fetch(`${BASE_URL}/whatsapp/logs?requestId=${createdRequestId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const logsData: any = await logsRes.json();
    assert.strictEqual(logsRes.status, 200);
    assert.ok(Array.isArray(logsData.data));
    assert.ok(logsData.data.length >= 1);
  });

  // 11. REPORTS & EXCEL EXPORT (EXCELJS)
  await test('11.1 Analytics & Statistics Summary', async () => {
    const res = await fetch(`${BASE_URL}/reports/requests`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.total >= 1);
    assert.ok(data.data.priorityCounts);
  });

  await test('11.2 Excel (.xlsx) Export Stream & Binary Signature Verification', async () => {
    const res = await fetch(`${BASE_URL}/reports/requests/export`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType?.includes('spreadsheetml.sheet'));

    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    assert.ok(bytes.length > 500, 'Excel file length should be > 500 bytes');

    // Check PK\x03\x04 signature (0x50, 0x4B, 0x03, 0x04) of standard Zip/XLSX
    assert.strictEqual(bytes[0], 0x50);
    assert.strictEqual(bytes[1], 0x4B);
    assert.strictEqual(bytes[2], 0x03);
    assert.strictEqual(bytes[3], 0x04);
  });

  // 12. SYSTEM SETTINGS
  await test('12.1 Get & Update System Settings', async () => {
    const getRes = await fetch(`${BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const getData: any = await getRes.json();
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getData.success, true);

    const updateRes = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        general: {
          systemNameArabic: 'نظام سيفيك فلو الموحد لإدارة الطلبات والشكاوى',
          defaultSlaDays: 5
        }
      })
    });
    const updateData: any = await updateRes.json();
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateData.success, true);
  });

  // 13. AUDIT LOGS
  await test('13.1 Audit Logs Tracking Verification', async () => {
    const res = await fetch(`${BASE_URL}/audit-logs?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data: any = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data.auditLogs));
    assert.ok(data.data.auditLogs.length >= 1);
    const actions = data.data.auditLogs.map((i: any) => i.action);
    console.log(`\n      Recent Audit Actions: [${actions.slice(0, 5).join(', ')}]`);
  });

  console.log('\n========================================');
  console.log(`🎉 Summary: ${testsPassed} passed, ${testsFailed} failed out of ${testsPassed + testsFailed} tests.`);
  console.log('========================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
