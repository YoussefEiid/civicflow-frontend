import {
  Customer,
  Ministry,
  Employee,
  Role,
  RequestItem,
  NotificationItem,
  AuditLog,
  SystemSettings
} from '../types';

export const initialMinistries: Ministry[] = [
  {
    id: 'min-1',
    name: 'وزارة الصحة',
    code: 'MOH',
    slaDays: 7,
    activeRequestsCount: 34,
    completedRequestsCount: 245,
    overdueRequestsCount: 3,
    status: 'نشط',
    notes: 'معاملات التراخيص الطبية، التقارير والشهادات الصحية، والعلاج على نفقة الدولة.',
    contactPerson: 'د. عبد العزيز الشمري',
    contactPhone: '+966 11 212 5555',
    contactEmail: 'contact@moh.gov.sa'
  },
  {
    id: 'min-2',
    name: 'وزارة الداخلية',
    code: 'MOI',
    slaDays: 5,
    activeRequestsCount: 42,
    completedRequestsCount: 380,
    overdueRequestsCount: 4,
    status: 'نشط',
    notes: 'معاملات الأحوال المدنية، تصاريح الإقامة، التأشيرات والوثائق الأمنية.',
    contactPerson: 'العقيد فيصل القحطاني',
    contactPhone: '+966 11 401 1111',
    contactEmail: 'support@moi.gov.sa'
  },
  {
    id: 'min-3',
    name: 'وزارة العدل',
    code: 'MOJ',
    slaDays: 10,
    activeRequestsCount: 28,
    completedRequestsCount: 190,
    overdueRequestsCount: 5,
    status: 'نشط',
    notes: 'حجج الاستحكام، الوكالات الشرعية، تصديق العقود وتوثيق المعاملات.',
    contactPerson: 'الشيخ إبراهيم الدوسري',
    contactPhone: '+966 11 405 7777',
    contactEmail: 'info@moj.gov.sa'
  },
  {
    id: 'min-4',
    name: 'وزارة الخارجية',
    code: 'MOFA',
    slaDays: 8,
    activeRequestsCount: 19,
    completedRequestsCount: 140,
    overdueRequestsCount: 1,
    status: 'نشط',
    notes: 'تصديق الوثائق الدولية، التأشيرات الدبلوماسية، ومعاملات الجاليات.',
    contactPerson: 'أ. طارق الماجد',
    contactPhone: '+966 11 406 7777',
    contactEmail: 'consular@mofa.gov.sa'
  },
  {
    id: 'min-5',
    name: 'وزارة التعليم',
    code: 'MOE',
    slaDays: 6,
    activeRequestsCount: 15,
    completedRequestsCount: 120,
    overdueRequestsCount: 1,
    status: 'نشط',
    notes: 'معادلة الشهادات الأكاديمية، تراخيص المدارس الأهلية، والابتعاث الخارجي.',
    contactPerson: 'د. منيرة العتيبي',
    contactPhone: '+966 11 475 3000',
    contactEmail: 'relations@moe.gov.sa'
  },
  {
    id: 'min-6',
    name: 'وزارة التضامن الاجتماعي',
    code: 'MOSD',
    slaDays: 12,
    activeRequestsCount: 4,
    completedRequestsCount: 95,
    overdueRequestsCount: 0,
    status: 'نشط',
    notes: 'الإعانات الاجتماعية، دعم الأسر المنتجة، وتراخيص الجمعيات الخيرية.',
    contactPerson: 'أ. سامي الجبير',
    contactPhone: '+966 11 477 8888',
    contactEmail: 'social@mosd.gov.sa'
  }
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'محمد أحمد علي',
    phone: '0501234567',
    altPhone: '0559876543',
    nationalId: '1092837465',
    email: 'mohammed.ali@example.com',
    address: 'الرياض - حي الملز - شارع الستين',
    notes: 'مراجع دائم لمعاملات وزارة الصحة والترخيص المهني الطبي.',
    requestsCount: 4,
    lastRequestDate: '2026-09-02',
    createdAt: '2026-01-15',
    status: 'نشط'
  },
  {
    id: 'cust-2',
    name: 'أحمد محمود حسن',
    phone: '0562345678',
    altPhone: '0114567890',
    nationalId: '1083746592',
    email: 'ahmed.m@example.com',
    address: 'جدة - حي الروضة - طريق الملك عبدالعزيز',
    notes: 'يرغب في استلام الإشعارات وتحديثات المعاملات عبر WhatsApp فقط.',
    requestsCount: 3,
    lastRequestDate: '2026-08-28',
    createdAt: '2026-02-10',
    status: 'نشط'
  },
  {
    id: 'cust-3',
    name: 'سارة محمد عبدالله',
    phone: '0543456789',
    nationalId: '1074658392',
    email: 'sara.abdullah@example.com',
    address: 'الدمام - حي الشاطئ - شارع الخليج',
    notes: 'معاملة تجديد رخصة وتصديق شهادات أكاديمية.',
    requestsCount: 2,
    lastRequestDate: '2026-09-01',
    createdAt: '2026-03-05',
    status: 'نشط'
  },
  {
    id: 'cust-4',
    name: 'خالد عبدالله',
    phone: '0534567890',
    altPhone: '0581122334',
    nationalId: '1065748392',
    email: 'khaled.ab@example.com',
    address: 'مكة المكرمة - حي العزيزية',
    notes: 'معاملة إفراغ عقاري وتوثيق وكالة في وزارة العدل.',
    requestsCount: 5,
    lastRequestDate: '2026-08-20',
    createdAt: '2025-11-20',
    status: 'نشط'
  },
  {
    id: 'cust-5',
    name: 'محمود السيد',
    phone: '0525678901',
    nationalId: '1056847392',
    email: 'mahmoud.sayed@example.com',
    address: 'المدينة المنورة - حي سلطانة',
    notes: 'طلب إعفاء وتظلم إداري بوزارة التضامن الاجتماعي.',
    requestsCount: 1,
    lastRequestDate: '2026-09-03',
    createdAt: '2026-04-12',
    status: 'نشط'
  },
  {
    id: 'cust-6',
    name: 'نور أحمد',
    phone: '0596789012',
    altPhone: '0509988776',
    nationalId: '1047958392',
    email: 'nour.ahmed@example.com',
    address: 'الخبر - حي العقربية - شارع 10',
    notes: 'معاملات تصديق قنصلي بوزارة الخارجية.',
    requestsCount: 2,
    lastRequestDate: '2026-08-30',
    createdAt: '2026-05-18',
    status: 'نشط'
  }
];

export const initialEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'أحمد علي',
    email: 'ahmed.ali@civicflow.gov',
    phone: '0500000001',
    roleId: 'role-1',
    role: 'مدير النظام',
    department: 'الإدارة العامة والمتابعة',
    assignedRequestsCount: 24,
    status: 'نشط',
    lastLogin: '2026-09-03 19:45',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'emp-2',
    name: 'محمد حسن',
    email: 'm.hassan@civicflow.gov',
    phone: '0500000002',
    roleId: 'role-2',
    role: 'مشرف',
    department: 'قسم الاتصال والتنسيق الحكومي',
    assignedRequestsCount: 38,
    status: 'نشط',
    lastLogin: '2026-09-03 18:20'
  },
  {
    id: 'emp-3',
    name: 'سارة محمود',
    email: 'sara.m@civicflow.gov',
    phone: '0500000003',
    roleId: 'role-3',
    role: 'موظف متابعة',
    department: 'إدارة متابعة المعاملات والسجلات',
    assignedRequestsCount: 52,
    status: 'نشط',
    lastLogin: '2026-09-03 16:15'
  },
  {
    id: 'emp-4',
    name: 'خالد إبراهيم',
    email: 'khaled.i@civicflow.gov',
    phone: '0500000004',
    roleId: 'role-4',
    role: 'موظف استقبال',
    department: 'مركز خدمة المراجعين والصادر والوارد',
    assignedRequestsCount: 28,
    status: 'نشط',
    lastLogin: '2026-09-03 17:50'
  }
];

export const initialRoles: Role[] = [
  {
    id: 'role-1',
    name: 'مدير النظام',
    description: 'صلاحيات كاملة وغير محدودة لإدارة كافة المعاملات والمستخدمين والإعدادات والتقارير.',
    usersCount: 1,
    permissions: [
      { module: 'الطلبات', view: true, create: true, edit: true, delete: true },
      { module: 'المراجعون', view: true, create: true, edit: true, delete: true },
      { module: 'الوزارات', view: true, create: true, edit: true, delete: true },
      { module: 'الموظفون', view: true, create: true, edit: true, delete: true },
      { module: 'التقارير', view: true, create: true, edit: true, delete: true },
      { module: 'الإشعارات', view: true, create: true, edit: true, delete: true },
      { module: 'الإعدادات', view: true, create: true, edit: true, delete: true },
      { module: 'سجل العمليات', view: true, create: true, edit: true, delete: true }
    ],
    extraPermissions: {
      changeStatus: true,
      uploadAttachments: true,
      exportExcel: true,
      sendNotifications: true,
      manageWhatsapp: true,
      viewAuditLogs: true
    }
  },
  {
    id: 'role-2',
    name: 'مشرف',
    description: 'متابعة سير العمل واعتماد الإجابات النهائية والتواصل مع ممثلي الوزارات والجهات.',
    usersCount: 2,
    permissions: [
      { module: 'الطلبات', view: true, create: true, edit: true, delete: false },
      { module: 'المراجعون', view: true, create: true, edit: true, delete: false },
      { module: 'الوزارات', view: true, create: true, edit: true, delete: false },
      { module: 'الموظفون', view: true, create: false, edit: false, delete: false },
      { module: 'التقارير', view: true, create: true, edit: true, delete: false },
      { module: 'الإشعارات', view: true, create: true, edit: true, delete: false },
      { module: 'الإعدادات', view: true, create: false, edit: false, delete: false },
      { module: 'سجل العمليات', view: true, create: false, edit: false, delete: false }
    ],
    extraPermissions: {
      changeStatus: true,
      uploadAttachments: true,
      exportExcel: true,
      sendNotifications: true,
      manageWhatsapp: false,
      viewAuditLogs: true
    }
  },
  {
    id: 'role-3',
    name: 'موظف متابعة',
    description: 'تحديث حالات الطلبات، وإرفاق الوثائق، ومتابعة مدد الإنجاز (SLA) والتنبيه بالمتأخرات.',
    usersCount: 5,
    permissions: [
      { module: 'الطلبات', view: true, create: true, edit: true, delete: false },
      { module: 'المراجعون', view: true, create: true, edit: true, delete: false },
      { module: 'الوزارات', view: true, create: false, edit: false, delete: false },
      { module: 'الموظفون', view: false, create: false, edit: false, delete: false },
      { module: 'التقارير', view: true, create: false, edit: false, delete: false },
      { module: 'الإشعارات', view: true, create: true, edit: false, delete: false },
      { module: 'الإعدادات', view: false, create: false, edit: false, delete: false },
      { module: 'سجل العمليات', view: false, create: false, edit: false, delete: false }
    ],
    extraPermissions: {
      changeStatus: true,
      uploadAttachments: true,
      exportExcel: true,
      sendNotifications: true,
      manageWhatsapp: false,
      viewAuditLogs: false
    }
  },
  {
    id: 'role-4',
    name: 'موظف استقبال',
    description: 'استلام المعاملات من المراجعين، وتسجيل بياناتهم، وفتح طلبات جديدة وإصدار إيصالات الاستلام.',
    usersCount: 4,
    permissions: [
      { module: 'الطلبات', view: true, create: true, edit: false, delete: false },
      { module: 'المراجعون', view: true, create: true, edit: true, delete: false },
      { module: 'الوزارات', view: true, create: false, edit: false, delete: false },
      { module: 'الموظفون', view: false, create: false, edit: false, delete: false },
      { module: 'التقارير', view: false, create: false, edit: false, delete: false },
      { module: 'الإشعارات', view: true, create: false, edit: false, delete: false },
      { module: 'الإعدادات', view: false, create: false, edit: false, delete: false },
      { module: 'سجل العمليات', view: false, create: false, edit: false, delete: false }
    ],
    extraPermissions: {
      changeStatus: false,
      uploadAttachments: true,
      exportExcel: false,
      sendNotifications: true,
      manageWhatsapp: false,
      viewAuditLogs: false
    }
  }
];

export const initialRequests: RequestItem[] = [
  {
    id: 'req-1025',
    requestNumber: 'REQ-1025',
    customerId: 'cust-1',
    customerName: 'محمد أحمد علي',
    customerPhone: '0501234567',
    customerAltPhone: '0559876543',
    customerAddress: 'الرياض - حي الملز',
    title: 'طلب ترخيص منشأة صحية خاصة وتجديد السجل الطبي',
    details: 'المعاملة تتضمن مراجعة المخططات الهندسية للمركز الطبي واعتماد الكادر التمريضي والأجهزة المعتمدة طبقاً للاشتراطات التنظيمية.',
    requestType: 'إصدار تصريح',
    ministryId: 'min-1',
    ministryName: 'وزارة الصحة',
    status: 'قيد المعالجة',
    priority: 'عاجل',
    assignedEmployeeId: 'emp-3',
    assignedEmployeeName: 'سارة محمود',
    receiveDate: '2026-08-28',
    expectedCompletionDate: '2026-09-04',
    deadlineStatus: 'اقترب الموعد',
    daysRemainingOrOverdue: 1,
    attachments: [
      {
        id: 'att-1',
        name: 'السجل_التجاري_المعتمد.pdf',
        size: '2.4 MB',
        type: 'PDF',
        uploadedAt: '2026-08-28 10:15',
        uploadedBy: 'خالد إبراهيم'
      },
      {
        id: 'att-2',
        name: 'المخطط_الهندسي_للمنشأة.pdf',
        size: '8.1 MB',
        type: 'PDF',
        uploadedAt: '2026-08-28 10:16',
        uploadedBy: 'خالد إبراهيم'
      },
      {
        id: 'att-3',
        name: 'كشف_الأجهزة_الطبية.xlsx',
        size: '540 KB',
        type: 'Excel',
        uploadedAt: '2026-08-30 14:20',
        uploadedBy: 'سارة محمود'
      }
    ],
    timeline: [
      {
        id: 'tl-1',
        status: 'استلام الطلب',
        date: '2026-08-28',
        time: '10:15 ص',
        employeeName: 'خالد إبراهيم',
        note: 'تم استقبال المراجع وتسجيل الطلب وإرفاق المستندات الأولية.',
        completed: true
      },
      {
        id: 'tl-2',
        status: 'قيد المراجعة',
        date: '2026-08-28',
        time: '11:30 ص',
        employeeName: 'محمد حسن',
        note: 'تم فحص المرفقات والتأكد من مطابقة شروط التقديم المبدئية.',
        completed: true
      },
      {
        id: 'tl-3',
        status: 'تم إرسال الطلب للجهة',
        date: '2026-08-29',
        time: '09:00 ص',
        employeeName: 'سارة محمود',
        note: 'تم تصدير المعاملة رسمياً إلى الإدارة العامة للتراخيص بوزارة الصحة برقم صادر 440912.',
        completed: true
      },
      {
        id: 'tl-4',
        status: 'قيد المعالجة',
        date: '2026-08-30',
        time: '01:45 م',
        employeeName: 'سارة محمود',
        note: 'المعاملة قيد الدراسة لدى اللجنة الفنية بوزارة الصحة.',
        completed: true
      }
    ],
    internalNotes: 'المراجع استفسر هاتفياً اليوم وتم إبلاغه أن المعاملة قيد الاعتماد النهائي وستصدر خلال 24 ساعة.',
    createdAt: '2026-08-28 10:15:00',
    updatedAt: '2026-08-30 14:20:00'
  },
  {
    id: 'req-1042',
    requestNumber: 'REQ-1042',
    customerId: 'cust-2',
    customerName: 'أحمد محمود حسن',
    customerPhone: '0562345678',
    customerAddress: 'جدة - حي الروضة',
    title: 'تجديد تصريح إقامة استثنائية ونقل كفالة مهنية',
    details: 'طلب نقل خدمات وتجديد الإقامة مع تقديم استثناء لظروف العمل والتنقل.',
    requestType: 'تجديد رخصة',
    ministryId: 'min-2',
    ministryName: 'وزارة الداخلية',
    status: 'قيد المعالجة',
    priority: 'عاجل',
    assignedEmployeeId: 'emp-2',
    assignedEmployeeName: 'محمد حسن',
    receiveDate: '2026-08-22',
    expectedCompletionDate: '2026-08-27',
    deadlineStatus: 'متأخر',
    daysRemainingOrOverdue: -7,
    attachments: [
      {
        id: 'att-4',
        name: 'صورة_الجواز_والإقامة_الحالية.pdf',
        size: '1.8 MB',
        type: 'PDF',
        uploadedAt: '2026-08-22 09:30',
        uploadedBy: 'خالد إبراهيم'
      },
      {
        id: 'att-5',
        name: 'خطاب_الشركة_الموجه_للداخلية.pdf',
        size: '620 KB',
        type: 'PDF',
        uploadedAt: '2026-08-22 09:35',
        uploadedBy: 'خالد إبراهيم'
      }
    ],
    timeline: [
      {
        id: 'tl-10',
        status: 'استلام الطلب',
        date: '2026-08-22',
        time: '09:30 ص',
        employeeName: 'خالد إبراهيم',
        note: 'استلام الطلب وإحالته للمشرف.',
        completed: true
      },
      {
        id: 'tl-11',
        status: 'تم إرسال الطلب للجهة',
        date: '2026-08-23',
        time: '10:00 ص',
        employeeName: 'محمد حسن',
        note: 'إرسال الطلب لشعبة الجوازات بوزارة الداخلية برقم وارد 88319.',
        completed: true
      },
      {
        id: 'tl-12',
        status: 'قيد المعالجة',
        date: '2026-08-25',
        time: '12:00 م',
        employeeName: 'محمد حسن',
        note: 'في انتظار رد الإدارة العامة للجوازات، تم إرسال تذكير عاجل.',
        completed: true
      }
    ],
    internalNotes: 'تأخرت المعاملة من قبل النظام الآلي للجوازات. تم رفع تذكرة تسريع رقم #TK-9921.',
    createdAt: '2026-08-22 09:30:00',
    updatedAt: '2026-08-31 11:10:00'
  },
  {
    id: 'req-1008',
    requestNumber: 'REQ-1008',
    customerId: 'cust-4',
    customerName: 'خالد عبدالله',
    customerPhone: '0534567890',
    customerAddress: 'مكة المكرمة - العزيزية',
    title: 'توثيق صك حجة استحكام وفرز أرض سكنية',
    details: 'معاملة فرز صك إلكتروني وتوثيق الملكية في كتابة العدل الأولى.',
    requestType: 'معاملة توثيق',
    ministryId: 'min-3',
    ministryName: 'وزارة العدل',
    status: 'الإجابة جاهزة',
    priority: 'مهم',
    assignedEmployeeId: 'emp-3',
    assignedEmployeeName: 'سارة محمود',
    receiveDate: '2026-08-15',
    expectedCompletionDate: '2026-08-25',
    completedDate: '2026-08-24',
    deadlineStatus: 'ضمن المدة',
    daysRemainingOrOverdue: 1,
    attachments: [
      {
        id: 'att-6',
        name: 'صك_الملكية_السابق.pdf',
        size: '3.1 MB',
        type: 'PDF',
        uploadedAt: '2026-08-15 11:00',
        uploadedBy: 'خالد إبراهيم'
      },
      {
        id: 'att-7',
        name: 'محضر_الفرز_المساحي.pdf',
        size: '4.5 MB',
        type: 'PDF',
        uploadedAt: '2026-08-16 09:15',
        uploadedBy: 'سارة محمود'
      }
    ],
    timeline: [
      {
        id: 'tl-20',
        status: 'استلام الطلب',
        date: '2026-08-15',
        time: '11:00 ص',
        employeeName: 'خالد إبراهيم',
        note: 'استلام الطلب والوثائق.',
        completed: true
      },
      {
        id: 'tl-21',
        status: 'تم إرسال الطلب للجهة',
        date: '2026-08-16',
        time: '10:30 ص',
        employeeName: 'سارة محمود',
        note: 'إرسال الصك لكتابة العدل بمكة المكرمة.',
        completed: true
      },
      {
        id: 'tl-22',
        status: 'موافقة',
        date: '2026-08-23',
        time: '02:15 م',
        employeeName: 'سارة محمود',
        note: 'تمت موافقة الدائرة القضائية واعتماد محضر الفرز.',
        completed: true
      },
      {
        id: 'tl-23',
        status: 'الإجابة جاهزة',
        date: '2026-08-24',
        time: '11:00 ص',
        employeeName: 'سارة محمود',
        note: 'صدر الصك الإلكتروني الجديد برقم #44019283.',
        completed: true
      }
    ],
    finalResponse: {
      id: 'fr-1',
      decision: 'موافقة',
      summary: 'تم توثيق الصك الإلكتروني واعتماد فرز العقار بنجاح. يمكن للمراجع استلام النسخة الأصلية أو تحميل الصك الرقمي الموثق.',
      documentNumber: 'MOJ-DEED-2026-8812',
      issuedAt: '2026-08-24 11:00',
      issuedBy: 'سارة محمود',
      attachmentName: 'الصك_الإلكتروني_الموثق.pdf',
      deliveredToCustomer: false
    },
    internalNotes: 'تم تجهيز إشعار WhatsApp للمراجع لإعلامه بجاهزية الصك للاستلام.',
    createdAt: '2026-08-15 11:00:00',
    updatedAt: '2026-08-24 11:00:00'
  },
  {
    id: 'req-1011',
    requestNumber: 'REQ-1011',
    customerId: 'cust-3',
    customerName: 'سارة محمد عبدالله',
    customerPhone: '0543456789',
    customerAddress: 'الدمام - حي الشاطئ',
    title: 'معادلة شهادة الماجستير الصادرة من جامعة مانشستر',
    details: 'طلب معادلة الدرجة العلمية في تخصص علوم الحاسب والذكاء الاصطناعي لدى الإدارة العامة لمعادلة الشهادات.',
    requestType: 'طلب شهادة رسمية',
    ministryId: 'min-5',
    ministryName: 'وزارة التعليم',
    status: 'مطلوب مستندات',
    priority: 'مهم',
    assignedEmployeeId: 'emp-3',
    assignedEmployeeName: 'سارة محمود',
    receiveDate: '2026-08-30',
    expectedCompletionDate: '2026-09-05',
    deadlineStatus: 'ضمن المدة',
    daysRemainingOrOverdue: 2,
    attachments: [
      {
        id: 'att-8',
        name: 'شهادة_الماجستير_المترجمة.pdf',
        size: '1.2 MB',
        type: 'PDF',
        uploadedAt: '2026-08-30 12:00',
        uploadedBy: 'خالد إبراهيم'
      }
    ],
    timeline: [
      {
        id: 'tl-30',
        status: 'استلام الطلب',
        date: '2026-08-30',
        time: '12:00 م',
        employeeName: 'خالد إبراهيم',
        note: 'استلام المعاملة ورفع الشهادة.',
        completed: true
      },
      {
        id: 'tl-31',
        status: 'مطلوب مستندات',
        date: '2026-09-01',
        time: '03:10 م',
        employeeName: 'سارة محمود',
        note: 'مطلوب إرفاق السجل الأكاديمي التفصيلي وختم الملحقية الثقافية بلندن.',
        completed: true
      }
    ],
    internalNotes: 'تم التواصل مع المراجعة هاتفياً وطلب تزويدنا بالسجل الأكاديمي المختوم.',
    createdAt: '2026-08-30 12:00:00',
    updatedAt: '2026-09-01 15:10:00'
  },
  {
    id: 'req-1001',
    requestNumber: 'REQ-1001',
    customerId: 'cust-6',
    customerName: 'نور أحمد',
    customerPhone: '0596789012',
    customerAddress: 'الخبر - العقربية',
    title: 'تصديق وكالة تجارية قنصلية دولية وتوثيق عقود خارجية',
    details: 'تصديق وثائق معتمدة من السفارة الإيطالية لاستخدامها في تأسيس شركة فرع محلي.',
    requestType: 'معاملة توثيق',
    ministryId: 'min-4',
    ministryName: 'وزارة الخارجية',
    status: 'تم التسليم',
    priority: 'عادي',
    assignedEmployeeId: 'emp-1',
    assignedEmployeeName: 'أحمد علي',
    receiveDate: '2026-08-10',
    expectedCompletionDate: '2026-08-18',
    completedDate: '2026-08-17',
    deadlineStatus: 'ضمن المدة',
    daysRemainingOrOverdue: 1,
    attachments: [
      {
        id: 'att-9',
        name: 'الوكالة_التجارية_الأصلية.pdf',
        size: '1.9 MB',
        type: 'PDF',
        uploadedAt: '2026-08-10 09:00',
        uploadedBy: 'خالد إبراهيم'
      },
      {
        id: 'att-10',
        name: 'ختم_التصديق_الرقمي.pdf',
        size: '850 KB',
        type: 'PDF',
        uploadedAt: '2026-08-17 14:00',
        uploadedBy: 'أحمد علي'
      }
    ],
    timeline: [
      {
        id: 'tl-40',
        status: 'استلام الطلب',
        date: '2026-08-10',
        time: '09:00 ص',
        employeeName: 'خالد إبراهيم',
        note: 'استلام الوثائق الأجنبية.',
        completed: true
      },
      {
        id: 'tl-41',
        status: 'تم إرسال الطلب للجهة',
        date: '2026-08-11',
        time: '10:00 ص',
        employeeName: 'أحمد علي',
        note: 'إرسال للفرع الإقليمي لوزارة الخارجية.',
        completed: true
      },
      {
        id: 'tl-42',
        status: 'موافقة',
        date: '2026-08-16',
        time: '01:00 م',
        employeeName: 'أحمد علي',
        note: 'التصديق معتمد وصحيح نظاماً.',
        completed: true
      },
      {
        id: 'tl-43',
        status: 'تم التسليم',
        date: '2026-08-18',
        time: '10:30 ص',
        employeeName: 'خالد إبراهيم',
        note: 'حضر المراجع واستلم الوثيقة الأصلية المصدقة ووقع على إشعار الاستلام.',
        completed: true
      },
      {
        id: 'tl-44',
        status: 'مغلق',
        date: '2026-08-18',
        time: '10:35 ص',
        employeeName: 'أحمد علي',
        note: 'تم إغلاق المعاملة بنجاح وأرشفة الملف.',
        completed: true
      }
    ],
    finalResponse: {
      id: 'fr-2',
      decision: 'موافقة',
      summary: 'تم تصديق الوكالة التجارية بموجب الرقم المرجعي MOFA-ATT-9941 وتفعيلها رسمياً لدى الدوائر المختصة.',
      documentNumber: 'MOFA-ATT-9941',
      issuedAt: '2026-08-17 14:00',
      issuedBy: 'أحمد علي',
      attachmentName: 'ختم_التصديق_الرقمي.pdf',
      deliveredToCustomer: true,
      deliveryDate: '2026-08-18 10:30'
    },
    internalNotes: 'معاملة منجزة بالكامل ومسلمة للمراجع.',
    createdAt: '2026-08-10 09:00:00',
    updatedAt: '2026-08-18 10:35:00'
  },
  {
    id: 'req-1002',
    requestNumber: 'REQ-1002',
    customerId: 'cust-5',
    customerName: 'محمود السيد',
    customerPhone: '0525678901',
    customerAddress: 'المدينة المنورة',
    title: 'طلب تظلم وإعادة النظر في دعم برنامج الأسر المنتجة',
    details: 'طلب إعادة تقييم الاستحقاق لبرنامج الدعم المالي والتمكين الاقتصادي.',
    requestType: 'شكوى وتظلم',
    ministryId: 'min-6',
    ministryName: 'وزارة التضامن الاجتماعي',
    status: 'استلام الطلب',
    priority: 'عادي',
    assignedEmployeeId: 'emp-4',
    assignedEmployeeName: 'خالد إبراهيم',
    receiveDate: '2026-09-03',
    expectedCompletionDate: '2026-09-15',
    deadlineStatus: 'ضمن المدة',
    daysRemainingOrOverdue: 12,
    attachments: [
      {
        id: 'att-11',
        name: 'بيان_الدخل_والتظلم.pdf',
        size: '1.1 MB',
        type: 'PDF',
        uploadedAt: '2026-09-03 14:00',
        uploadedBy: 'خالد إبراهيم'
      }
    ],
    timeline: [
      {
        id: 'tl-50',
        status: 'استلام الطلب',
        date: '2026-09-03',
        time: '02:00 م',
        employeeName: 'خالد إبراهيم',
        note: 'تم تسجيل الطلب واستلام بيان التظلم.',
        completed: true
      }
    ],
    internalNotes: 'طلب جديد مسجل اليوم، بحاجة لإحالة للمشرف للمراجعة.',
    createdAt: '2026-09-03 14:00:00',
    updatedAt: '2026-09-03 14:00:00'
  },
  {
    id: 'req-1003',
    requestNumber: 'REQ-1003',
    customerId: 'cust-1',
    customerName: 'محمد أحمد علي',
    customerPhone: '0501234567',
    customerAddress: 'الرياض - حي الملز',
    title: 'استعلام عن تجديد شهادة التصنيف المهني الصحي',
    details: 'متابعة إصدار شهادة تجديد التصنيف المهني الصحي الصادرة من الهيئة العامة للتخصصات الصحية.',
    requestType: 'استعلام إداري',
    ministryId: 'min-1',
    ministryName: 'وزارة الصحة',
    status: 'تم إرسال الطلب للجهة',
    priority: 'عادي',
    assignedEmployeeId: 'emp-3',
    assignedEmployeeName: 'سارة محمود',
    receiveDate: '2026-09-01',
    expectedCompletionDate: '2026-09-08',
    deadlineStatus: 'ضمن المدة',
    daysRemainingOrOverdue: 5,
    attachments: [],
    timeline: [
      {
        id: 'tl-60',
        status: 'استلام الطلب',
        date: '2026-09-01',
        time: '09:00 ص',
        employeeName: 'خالد إبراهيم',
        note: 'تسجيل طلب الاستعلام.',
        completed: true
      },
      {
        id: 'tl-61',
        status: 'تم إرسال الطلب للجهة',
        date: '2026-09-02',
        time: '10:00 ص',
        employeeName: 'سارة محمود',
        note: 'إرسال الاستعلام للشؤون الصحية.',
        completed: true
      }
    ],
    internalNotes: '',
    createdAt: '2026-09-01 09:00:00',
    updatedAt: '2026-09-02 10:00:00'
  },
  {
    id: 'req-1004',
    requestNumber: 'REQ-1004',
    customerId: 'cust-4',
    customerName: 'خالد عبدالله',
    customerPhone: '0534567890',
    customerAddress: 'مكة المكرمة',
    title: 'طلب تصريح بناء مجمع تجاري في المنطقة المركزية',
    details: 'استكمال إجراءات الموافقة الأمنية والدفاع المدني لمشروع مجمع تجاري.',
    requestType: 'إصدار تصريح',
    ministryId: 'min-2',
    ministryName: 'وزارة الداخلية',
    status: 'مرفوض',
    priority: 'مهم',
    assignedEmployeeId: 'emp-2',
    assignedEmployeeName: 'محمد حسن',
    receiveDate: '2026-08-12',
    expectedCompletionDate: '2026-08-17',
    completedDate: '2026-08-16',
    deadlineStatus: 'ضمن المدة',
    daysRemainingOrOverdue: 1,
    attachments: [
      {
        id: 'att-12',
        name: 'مخطط_السلامة_المبدئي.pdf',
        size: '5.6 MB',
        type: 'PDF',
        uploadedAt: '2026-08-12 11:30',
        uploadedBy: 'خالد إبراهيم'
      }
    ],
    timeline: [
      {
        id: 'tl-70',
        status: 'استلام الطلب',
        date: '2026-08-12',
        time: '11:30 ص',
        employeeName: 'خالد إبراهيم',
        note: 'استلام المخططات.',
        completed: true
      },
      {
        id: 'tl-71',
        status: 'تم إرسال الطلب للجهة',
        date: '2026-08-13',
        time: '08:30 ص',
        employeeName: 'محمد حسن',
        note: 'إرسال للدفاع المدني والسلامة.',
        completed: true
      },
      {
        id: 'tl-72',
        status: 'مرفوض',
        date: '2026-08-16',
        time: '02:00 م',
        employeeName: 'محمد حسن',
        note: 'تم رفض المخطط لعدم توفر مخارج طوارئ مطابقة للكود السعودي 2026.',
        completed: true
      }
    ],
    finalResponse: {
      id: 'fr-3',
      decision: 'رفض',
      summary: 'تم الرفض لعدم مطابقة مخارج الطوارئ ومسارات الإخلاء للاشتراطات الفنية المعتمدة. يمكن للمراجع التقديم بمخطط معدل جديد.',
      documentNumber: 'MOI-CD-REJ-4412',
      issuedAt: '2026-08-16 14:00',
      issuedBy: 'محمد حسن',
      deliveredToCustomer: true,
      deliveryDate: '2026-08-16 15:30'
    },
    internalNotes: 'تم إبلاغ المراجع بأسباب الرفض وتقديم التوجيهات الفنية لتعديل المخطط.',
    createdAt: '2026-08-12 11:30:00',
    updatedAt: '2026-08-16 15:30:00'
  },
  {
    id: 'req-1032',
    requestNumber: 'REQ-1032',
    customerId: 'cust-3',
    customerName: 'سارة محمد عبدالله',
    customerPhone: '0543456789',
    customerAddress: 'الدمام - حي الشاطئ',
    title: 'طلب إعفاء وتأجيل سداد رسوم تدريبية لبرنامج الابتعاث',
    details: 'طلب تقسيط رسوم إدارية وبرنامج التدريب قبل الابتعاث لظروف استثنائية.',
    requestType: 'طلب إعفاء',
    ministryId: 'min-5',
    ministryName: 'وزارة التعليم',
    status: 'تم إشعار المراجع',
    priority: 'عادي',
    assignedEmployeeId: 'emp-3',
    assignedEmployeeName: 'سارة محمود',
    receiveDate: '2026-08-20',
    expectedCompletionDate: '2026-08-26',
    completedDate: '2026-08-25',
    deadlineStatus: 'ضمن المدة',
    daysRemainingOrOverdue: 1,
    attachments: [],
    timeline: [
      {
        id: 'tl-80',
        status: 'استلام الطلب',
        date: '2026-08-20',
        time: '10:00 ص',
        employeeName: 'خالد إبراهيم',
        note: 'تسجيل طلب الإعفاء.',
        completed: true
      },
      {
        id: 'tl-81',
        status: 'موافقة',
        date: '2026-08-25',
        time: '11:00 ص',
        employeeName: 'سارة محمود',
        note: 'تمت الموافقة على جدول التقسيط المقترح.',
        completed: true
      },
      {
        id: 'tl-82',
        status: 'الإجابة جاهزة',
        date: '2026-08-25',
        time: '11:30 ص',
        employeeName: 'سارة محمود',
        note: 'إعداد خطاب الموافقة والجدول الزمني.',
        completed: true
      },
      {
        id: 'tl-83',
        status: 'تم إشعار المراجع',
        date: '2026-08-25',
        time: '01:00 م',
        employeeName: 'سارة محمود',
        note: 'تم إرسال رسالة SMS وWhatsApp للمراجعة تفيد بجاهزية الخطاب.',
        completed: true
      }
    ],
    finalResponse: {
      id: 'fr-4',
      decision: 'موافقة',
      summary: 'تمت الموافقة على جدولة الرسوم وفق الخطة المرفقة.',
      documentNumber: 'MOE-EXM-9912',
      issuedAt: '2026-08-25 11:30',
      issuedBy: 'سارة محمود',
      deliveredToCustomer: false
    },
    internalNotes: 'المراجعة ستحضر غداً لاستلام القرار الإداري.',
    createdAt: '2026-08-20 10:00:00',
    updatedAt: '2026-08-25 13:00:00'
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'تحديث حالة المعاملة',
    message: 'تم تغيير حالة الطلب #REQ-1025 إلى (قيد المعالجة) - وزارة الصحة',
    requestId: 'req-1025',
    requestNumber: 'REQ-1025',
    type: 'status_change',
    read: false,
    createdAt: '2026-09-03 14:20',
    timeAgo: 'منذ ساعتين',
    link: '/requests/req-1025'
  },
  {
    id: 'notif-2',
    title: 'تنبيه تأخر معاملة (SLA Overdue)',
    message: 'الطلب #REQ-1042 تجاوز مدة الإنجاز المسموحة (متأخر 7 أيام) - وزارة الداخلية',
    requestId: 'req-1042',
    requestNumber: 'REQ-1042',
    type: 'overdue',
    read: false,
    createdAt: '2026-09-03 09:00',
    timeAgo: 'منذ 7 ساعات',
    link: '/requests/req-1042'
  },
  {
    id: 'notif-3',
    title: 'جاهزية الإجابة النهائية',
    message: 'تمت إضافة الإجابة النهائية للطلب #REQ-1008 وبانتظار التسليم - وزارة العدل',
    requestId: 'req-1008',
    requestNumber: 'REQ-1008',
    type: 'final_response',
    read: false,
    createdAt: '2026-09-02 11:30',
    timeAgo: 'منذ يوم',
    link: '/requests/req-1008'
  },
  {
    id: 'notif-4',
    title: 'مستندات إضافية مطلوبة',
    message: 'الطلب #REQ-1011 يحتاج إلى مستندات إضافية (السجل الأكاديمي المختوم) - وزارة التعليم',
    requestId: 'req-1011',
    requestNumber: 'REQ-1011',
    type: 'docs_required',
    read: true,
    createdAt: '2026-09-01 15:10',
    timeAgo: 'منذ يومين',
    link: '/requests/req-1011'
  },
  {
    id: 'notif-5',
    title: 'إغلاق وتسليم معاملة',
    message: 'تم تسليم المعاملة #REQ-1001 للمراجع وإغلاق الطلب بنجاح',
    requestId: 'req-1001',
    requestNumber: 'REQ-1001',
    type: 'status_change',
    read: true,
    createdAt: '2026-08-31 16:00',
    timeAgo: 'منذ 3 أيام',
    link: '/requests/req-1001'
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    userId: 'emp-3',
    userName: 'سارة محمود',
    userRole: 'موظف متابعة',
    action: 'تغيير حالة',
    requestNumber: 'REQ-1025',
    details: 'تغيير حالة المعاملة من (تم إرسال الطلب للجهة) إلى (قيد المعالجة) - وزارة الصحة',
    ipAddress: '192.168.1.45',
    date: '2026-09-03',
    time: '14:20:15'
  },
  {
    id: 'log-2',
    userId: 'emp-4',
    userName: 'خالد إبراهيم',
    userRole: 'موظف استقبال',
    action: 'إضافة طلب',
    requestNumber: 'REQ-1002',
    details: 'إنشاء طلب جديد للمراجع محمود السيد بعنوان: طلب تظلم برنامج الأسر المنتجة',
    ipAddress: '192.168.1.12',
    date: '2026-09-03',
    time: '14:00:02'
  },
  {
    id: 'log-3',
    userId: 'emp-3',
    userName: 'سارة محمود',
    userRole: 'موظف متابعة',
    action: 'إضافة إجابة نهائية',
    requestNumber: 'REQ-1008',
    details: 'إضافة قرار الموافقة للصك الإلكتروني الموثق رقم MOJ-DEED-2026-8812',
    ipAddress: '192.168.1.45',
    date: '2026-09-02',
    time: '11:30:40'
  },
  {
    id: 'log-4',
    userId: 'emp-1',
    userName: 'أحمد علي',
    userRole: 'مدير النظام',
    action: 'تعديل إعدادات',
    details: 'تحديث مدة الإنجاز الافتراضية لوزارة الصحة من 8 أيام إلى 7 أيام',
    ipAddress: '192.168.1.10',
    date: '2026-09-01',
    time: '09:15:22'
  },
  {
    id: 'log-5',
    userId: 'emp-4',
    userName: 'خالد إبراهيم',
    userRole: 'موظف استقبال',
    action: 'إضافة مراجع',
    details: 'تسجيل بيانات المراجع الجديد: محمود السيد ورقم الهوية 1056847392',
    ipAddress: '192.168.1.12',
    date: '2026-08-30',
    time: '16:05:10'
  },
  {
    id: 'log-6',
    userId: 'emp-2',
    userName: 'محمد حسن',
    userRole: 'مشرف',
    action: 'إرسال إشعار',
    requestNumber: 'REQ-1042',
    details: 'إرسال تنبيه عبر WhatsApp للمراجع أحمد محمود حسن بخصوص تأخر الرد من الجوازات',
    ipAddress: '192.168.1.22',
    date: '2026-08-29',
    time: '12:45:00'
  }
];

export const initialSystemSettings: SystemSettings = {
  general: {
    systemName: 'نظام إدارة الصادر والوارد والمعاملات',
    systemSubName: 'CivicFlow Administrative Platform',
    officePhone: '+966 11 800 4422',
    officeAddress: 'المملكة العربية السعودية - الرياض - طريق الملك فهد - البرج الإداري',
    officeEmail: 'admin@civicflow.gov.sa',
    taxNumber: '300192837400003',
    workingDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
    workingHours: '08:00 ص - 04:00 م',
    logoUrl: ''
  },
  statuses: [
    { id: 'st-1', name: 'استلام الطلب', color: 'slate', order: 1, isActive: true, isInitial: true },
    { id: 'st-2', name: 'قيد المراجعة', color: 'blue', order: 2, isActive: true },
    { id: 'st-3', name: 'تم إرسال الطلب للجهة', color: 'indigo', order: 3, isActive: true },
    { id: 'st-4', name: 'قيد المعالجة', color: 'amber', order: 4, isActive: true },
    { id: 'st-5', name: 'مطلوب مستندات', color: 'rose', order: 5, isActive: true, requiresNotes: true },
    { id: 'st-6', name: 'موافقة', color: 'emerald', order: 6, isActive: true },
    { id: 'st-7', name: 'مرفوض', color: 'red', order: 7, isActive: true, requiresNotes: true },
    { id: 'st-8', name: 'الإجابة جاهزة', color: 'cyan', order: 8, isActive: true },
    { id: 'st-9', name: 'تم إشعار المراجع', color: 'teal', order: 9, isActive: true },
    { id: 'st-10', name: 'تم التسليم', color: 'emerald', order: 10, isActive: true },
    { id: 'st-11', name: 'مغلق', color: 'zinc', order: 11, isActive: true, isTerminal: true }
  ],
  sla: [
    { id: 'sla-1', ministryId: 'min-1', ministryName: 'وزارة الصحة', defaultDays: 7, urgentDays: 3, importantDays: 5, autoAlertBeforeDays: 2 },
    { id: 'sla-2', ministryId: 'min-2', ministryName: 'وزارة الداخلية', defaultDays: 5, urgentDays: 2, importantDays: 4, autoAlertBeforeDays: 1 },
    { id: 'sla-3', ministryId: 'min-3', ministryName: 'وزارة العدل', defaultDays: 10, urgentDays: 4, importantDays: 7, autoAlertBeforeDays: 2 },
    { id: 'sla-4', ministryId: 'min-4', ministryName: 'وزارة الخارجية', defaultDays: 8, urgentDays: 3, importantDays: 6, autoAlertBeforeDays: 2 },
    { id: 'sla-5', ministryId: 'min-5', ministryName: 'وزارة التعليم', defaultDays: 6, urgentDays: 3, importantDays: 4, autoAlertBeforeDays: 1 },
    { id: 'sla-6', ministryId: 'min-6', ministryName: 'وزارة التضامن الاجتماعي', defaultDays: 12, urgentDays: 5, importantDays: 8, autoAlertBeforeDays: 3 }
  ],
  whatsapp: {
    isConnected: true,
    phoneNumber: '+966 50 123 9988',
    instanceName: 'CivicFlow-Gov-Gateway-01',
    lastSync: '2026-09-03 20:00',
    triggers: [
      { id: 'trg-1', event: 'on_created', title: 'عند استلام الطلب', enabled: true, templateId: 'tpl-1' },
      { id: 'trg-2', event: 'on_status_change', title: 'عند تغيير الحالة', enabled: true, templateId: 'tpl-2' },
      { id: 'trg-3', event: 'on_docs_needed', title: 'عند طلب مستندات إضافية', enabled: true, templateId: 'tpl-3' },
      { id: 'trg-4', event: 'on_approved', title: 'عند الموافقة', enabled: true, templateId: 'tpl-4' },
      { id: 'trg-5', event: 'on_rejected', title: 'عند الرفض', enabled: true, templateId: 'tpl-5' },
      { id: 'trg-6', event: 'on_ready', title: 'عند جاهزية الإجابة', enabled: true, templateId: 'tpl-6' },
      { id: 'trg-7', event: 'on_delivered', title: 'عند التسليم', enabled: true, templateId: 'tpl-7' },
      { id: 'trg-8', event: 'on_overdue', title: 'عند التأخر وتجاوز المدة', enabled: true, templateId: 'tpl-8' }
    ]
  },
  whatsappTemplates: [
    {
      id: 'tpl-1',
      key: 'receive_request',
      title: 'استلام الطلب',
      content: 'عزيزي المراجع {{customer_name}}، تم استلام طلبك رقم {{request_number}} بنجاح لدى {{ministry}}. الموعد المتوقع للإنجاز: {{expected_date}}. يمكنك متابعة الطلب عبر الرابط: {{tracking_link}}',
      variables: ['customer_name', 'request_number', 'ministry', 'expected_date', 'tracking_link'],
      lastUpdated: '2026-09-01'
    },
    {
      id: 'tpl-2',
      key: 'status_changed',
      title: 'تغيير الحالة',
      content: 'مرحباً {{customer_name}}، نود إحاطتك بأن حالة طلبك رقم {{request_number}} أصبحت الآن: ({{status}}) لدى {{ministry}}. الرابط: {{tracking_link}}',
      variables: ['customer_name', 'request_number', 'status', 'ministry', 'tracking_link'],
      lastUpdated: '2026-08-25'
    },
    {
      id: 'tpl-3',
      key: 'docs_required',
      title: 'طلب مستندات',
      content: 'عزيزي المراجع {{customer_name}}، يلزم استكمال بعض المستندات للطلب {{request_number}} لدى {{ministry}}. يرجى مراجعة المنصة أو زيارة الفرع في أقرب وقت. الرابط: {{tracking_link}}',
      variables: ['customer_name', 'request_number', 'ministry', 'tracking_link'],
      lastUpdated: '2026-08-20'
    },
    {
      id: 'tpl-4',
      key: 'approved',
      title: 'الموافقة',
      content: 'بشرى سارة {{customer_name}}، تمت الموافقة على طلبك رقم {{request_number}} من قبل {{ministry}}. جاري إعداد الوثائق النهائية. الرابط: {{tracking_link}}',
      variables: ['customer_name', 'request_number', 'ministry', 'tracking_link'],
      lastUpdated: '2026-08-15'
    },
    {
      id: 'tpl-5',
      key: 'rejected',
      title: 'الرفض',
      content: 'عزيزي المراجع {{customer_name}}، نأسف لإبلاغكم برفض الطلب رقم {{request_number}} لدى {{ministry}}. لمعرفة أسباب الرفض وتقديم تظلم: {{tracking_link}}',
      variables: ['customer_name', 'request_number', 'ministry', 'tracking_link'],
      lastUpdated: '2026-08-15'
    },
    {
      id: 'tpl-6',
      key: 'ready_for_pickup',
      title: 'الإجابة جاهزة',
      content: 'عزيزي المراجع {{customer_name}}، الإجابة والوثائق الرسمية للطلب رقم {{request_number}} جاهزة للاستلام. يمكنك مراجعتنا أو تحميلها مباشرة عبر: {{tracking_link}}',
      variables: ['customer_name', 'request_number', 'tracking_link'],
      lastUpdated: '2026-08-10'
    },
    {
      id: 'tpl-7',
      key: 'delivered',
      title: 'التسليم',
      content: 'شكراً لك {{customer_name}}، تم تسليم المعاملة رقم {{request_number}} بنجاح وإغلاق الطلب. يسعدنا تقييمكم لخدمتنا عبر: {{tracking_link}}',
      variables: ['customer_name', 'request_number', 'tracking_link'],
      lastUpdated: '2026-08-05'
    },
    {
      id: 'tpl-8',
      key: 'overdue_alert',
      title: 'التأخر',
      content: 'عزيزي المراجع {{customer_name}}، نعتذر عن التأخير الخارج عن إرادتنا في إنجاز الطلب رقم {{request_number}}. تم تصعيد المعاملة للمشرف ونعمل على إنهائها بأسرع وقت.',
      variables: ['customer_name', 'request_number', 'ministry'],
      lastUpdated: '2026-08-01'
    }
  ],
  notificationPreferences: {
    enableInApp: true,
    enableOverdueAlerts: true,
    enableStatusAlerts: true,
    enableWhatsApp: true,
    autoNotifyCustomerOnStatusChange: true
  }
};
