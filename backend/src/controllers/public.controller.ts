import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { PriorityLevel, DocumentType, CustomerStatus } from '@prisma/client';
import { calculateRequestSLA } from '../services/sla.service.js';
import { generateNextRequestNumber } from '../services/requestNumber.service.js';
import { generateNextCustomerNumber } from '../services/customerNumber.service.js';
import { env } from '../config/env.js';

const publicRequestSchema = z.object({
  name: z.string().min(2, 'الاسم الكامل مطلوب (حرفين على الأقل)'),
  phone: z.string().min(8, 'رقم الهاتف غير صالح'),
  nationalId: z.string().min(6, 'رقم الهوية الوطنية أو الإقامة مطلوب'),
  cityId: z.string().min(1, 'يرجى اختيار المدينة'),
  address: z.string().min(2, 'العنوان الوطني أو السكن مطلوب'),
  ministryId: z.string().min(1, 'يرجى اختيار الجهة أو الوزارة المعنية'),
  requestTypeId: z.string().optional().nullable(),
  requestType: z.string().optional(),
  title: z.string().min(3, 'عنوان المعاملة مطلوب'),
  details: z.string().min(5, 'تفاصيل وشرح الطلب مطلوبة'),
  identityDocName: z.string().optional().nullable(),
  requestDocName: z.string().optional().nullable()
});

export const getPublicFormData = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [ministries, cities, requestTypes] = await Promise.all([
      prisma.ministry.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, code: true, slaDays: true }
      }),
      prisma.city.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
      }),
      prisma.requestType.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
      })
    ]);

    return sendSuccess(res, {
      ministries,
      cities,
      requestTypes
    });
  } catch (error) {
    next(error);
  }
};

export const submitPublicRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = publicRequestSchema.parse(req.body);

    const ministry = await prisma.ministry.findUnique({
      where: { id: data.ministryId, status: 'ACTIVE' }
    });
    if (!ministry) {
      throw new AppError('الجهة الحكومية المحددة غير موجودة أو غير نشطة', 404, 'MINISTRY_NOT_FOUND');
    }

    const city = await prisma.city.findUnique({
      where: { id: data.cityId, status: 'ACTIVE' }
    });
    if (!city) {
      throw new AppError('المدينة المحددة غير صالحة', 404, 'CITY_NOT_FOUND');
    }

    let requestTypeName = data.requestType || 'طلب عام';
    if (data.requestTypeId) {
      const rt = await prisma.requestType.findUnique({
        where: { id: data.requestTypeId, status: 'ACTIVE' }
      });
      if (rt) requestTypeName = rt.name;
    }

    // Handle uploaded files if multipart
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const identityFile = files?.['identityDocument']?.[0] || files?.['identity']?.[0];
    const requestFile = files?.['requestDocument']?.[0] || files?.['document']?.[0] || req.file;

    const receiveDate = new Date();
    const slaResult = await calculateRequestSLA(ministry.id, PriorityLevel.NORMAL, receiveDate);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create Customer
      let customer = await tx.customer.findFirst({
        where: {
          OR: [
            { nationalId: data.nationalId },
            { phone: data.phone }
          ]
        }
      });

      if (!customer) {
        const customerNumber = await generateNextCustomerNumber(tx);
        customer = await tx.customer.create({
          data: {
            customerNumber,
            name: data.name,
            phone: data.phone,
            nationalId: data.nationalId,
            cityId: city.id,
            address: data.address,
            status: CustomerStatus.ACTIVE
          }
        });
      } else {
        // Update customer details if missing
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            name: data.name,
            cityId: customer.cityId || city.id,
            address: customer.address || data.address
          }
        });
      }

      // 2. Generate Request Number
      const requestNumber = await generateNextRequestNumber(tx);

      // 3. Create Request
      const newRequest = await tx.request.create({
        data: {
          requestNumber,
          customerId: customer.id,
          ministryId: ministry.id,
          cityId: city.id,
          requestTypeId: data.requestTypeId || null,
          title: data.title,
          details: data.details,
          requestType: requestTypeName,
          status: 'استلام الطلب',
          priority: PriorityLevel.NORMAL,
          receiveDate,
          expectedCompletionDate: slaResult.expectedCompletionDate,
          deadlineStatus: slaResult.deadlineStatus,
          daysRemainingOrOverdue: slaResult.daysRemainingOrOverdue,
          statusHistory: {
            create: {
              newStatus: 'استلام الطلب',
              employeeName: 'بوابة المراجع الإلكترونية',
              note: 'تم تقديم المعاملة بنجاح من خلال البوابة العامة للمراجعين.'
            }
          }
        }
      });

      // 4. Save Identity Document (Classified IDENTITY, isPublic: false, isIdentity: true)
      if (identityFile || data.identityDocName) {
        const idName = identityFile ? identityFile.originalname : (data.identityDocName || 'صورة_الهوية_الوطنية.jpg');
        const idPath = identityFile ? identityFile.filename : 'demo_national_id.jpg';
        const idSize = identityFile ? `${(identityFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB';
        const idMime = identityFile ? identityFile.mimetype : 'image/jpeg';

        await tx.requestAttachment.create({
          data: {
            requestId: newRequest.id,
            customerId: customer.id,
            name: idName,
            filePath: idPath,
            fileSize: idSize,
            fileType: idMime.includes('pdf') ? 'PDF' : 'Image',
            mimeType: idMime,
            documentType: DocumentType.IDENTITY,
            isPublic: false,
            isIdentity: true,
            uploadedBy: data.name
          }
        });
      }

      // 5. Save Request Document (Classified REQUEST_DOCUMENT, isPublic: false)
      if (requestFile || data.requestDocName) {
        const reqDocName = requestFile ? requestFile.originalname : (data.requestDocName || 'مستند_الطلب_المرفق.pdf');
        const reqDocPath = requestFile ? requestFile.filename : 'demo_request_doc.pdf';
        const reqDocSize = requestFile ? `${(requestFile.size / (1024 * 1024)).toFixed(1)} MB` : '2.1 MB';
        const reqDocMime = requestFile ? requestFile.mimetype : 'application/pdf';

        await tx.requestAttachment.create({
          data: {
            requestId: newRequest.id,
            customerId: customer.id,
            name: reqDocName,
            filePath: reqDocPath,
            fileSize: reqDocSize,
            fileType: reqDocMime.includes('pdf') ? 'PDF' : 'Image',
            mimeType: reqDocMime,
            documentType: DocumentType.REQUEST_DOCUMENT,
            isPublic: false,
            isIdentity: false,
            uploadedBy: data.name
          }
        });
      }

      // 6. Create Audit Log
      await tx.auditLog.create({
        data: {
          userName: data.name,
          userRole: 'مراجع عام',
          action: 'تقديم طلب مراجع عام',
          requestNumber,
          entity: 'Request',
          entityId: newRequest.id,
          details: `تقديم طلب جديد إلكترونياً عبر البوابة العامة برقم ${requestNumber} للجهة (${ministry.name})`,
          afterValue: {
            requestNumber,
            customerName: data.name,
            nationalId: data.nationalId,
            ministry: ministry.name,
            city: city.name
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      return newRequest;
    });

    return sendSuccess(
      res,
      {
        requestNumber: result.requestNumber,
        trackingToken: result.publicTrackingToken,
        publicTrackingToken: result.publicTrackingToken,
        status: result.status,
        expectedCompletionDate: result.expectedCompletionDate.toISOString().split('T')[0],
        trackingUrl: `/track/${result.requestNumber}`
      },
      'تم استلام طلبك بنجاح وتسجيل المعاملة في المنظومة',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const trackPublicRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tokenOrNumber } = req.params;
    const cleanQuery = (tokenOrNumber || '').trim();

    const request = await prisma.request.findFirst({
      where: {
        OR: [
          { requestNumber: { equals: cleanQuery, mode: 'insensitive' } },
          { requestNumber: { equals: `REQ-${cleanQuery}`, mode: 'insensitive' } },
          { publicTrackingToken: cleanQuery }
        ]
      },
      include: {
        ministry: { select: { name: true } },
        city: { select: { name: true } },
        attachments: {
          where: { isPublic: true, isIdentity: false }
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            newStatus: true,
            createdAt: true,
            note: true,
            documentName: true,
            documentPath: true,
            isPublicDoc: true
          }
        },
        finalResponse: {
          select: {
            id: true,
            decision: true,
            summary: true,
            documentNumber: true,
            issuedAt: true,
            attachmentName: true,
            deliveredToCustomer: true,
            deliveryDate: true
          }
        }
      }
    });

    if (!request) {
      throw new AppError('المعاملة غير موجودة في النظام أو رقم الطلب غير صحيح', 404, 'REQUEST_NOT_FOUND');
    }

    const timeline = request.statusHistory.map((h) => {
      const d = new Date(h.createdAt);
      return {
        id: h.id,
        status: h.newStatus,
        date: d.toISOString().split('T')[0],
        time: d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        employeeName: 'فريق خدمة المعاملات',
        note: `تم تحديث حالة المعاملة إلى: ${h.newStatus}`,
        documentName: h.isPublicDoc ? h.documentName : undefined,
        isPublicDoc: h.isPublicDoc,
        completed: true
      };
    });

    // Public visible documents only (e.g. Sent letter to entity, final approved response)
    const publicDocuments = request.attachments.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.fileType,
      size: a.fileSize,
      documentType: a.documentType,
      uploadedAt: a.uploadedAt.toISOString().split('T')[0],
      downloadUrl: `/api/public/attachments/${a.id}/download`
    }));

    const publicData = {
      requestNumber: request.requestNumber,
      title: request.title,
      details: request.details,
      requestType: request.requestType,
      ministryName: request.ministry.name,
      cityName: request.city?.name || 'المدينة المعتمدة',
      status: request.status,
      receiveDate: request.receiveDate.toISOString().split('T')[0],
      expectedCompletionDate: request.expectedCompletionDate.toISOString().split('T')[0],
      completedDate: request.completedDate ? request.completedDate.toISOString().split('T')[0] : undefined,
      deadlineStatus: request.deadlineStatus,
      daysRemainingOrOverdue: request.daysRemainingOrOverdue,
      timeline,
      publicDocuments,
      finalResponse: request.finalResponse
        ? {
            id: request.finalResponse.id,
            decision: request.finalResponse.decision,
            summary: request.finalResponse.summary,
            documentNumber: request.finalResponse.documentNumber || undefined,
            issuedAt: request.finalResponse.issuedAt.toISOString().replace('T', ' ').substring(0, 16),
            attachmentName: request.finalResponse.attachmentName || undefined,
            deliveredToCustomer: request.finalResponse.deliveredToCustomer,
            deliveryDate: request.finalResponse.deliveryDate ? request.finalResponse.deliveryDate.toISOString().split('T')[0] : undefined
          }
        : undefined
    };

    return sendSuccess(res, publicData);
  } catch (error) {
    next(error);
  }
};

export const downloadPublicAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.requestAttachment.findUnique({
      where: { id }
    });

    if (!attachment) {
      throw new AppError('المستند غير موجود', 404, 'ATTACHMENT_NOT_FOUND');
    }

    // STRICT PRIVACY ENFORCEMENT
    if (!attachment.isPublic || attachment.isIdentity || attachment.documentType === DocumentType.IDENTITY) {
      throw new AppError('عذراً، هذا المستند خاص وسري ولا يمكن تحميله عبر البوابة العامة للمراجعين.', 403, 'SENSITIVE_DOCUMENT_FORBIDDEN');
    }

    const safeFileName = path.basename(attachment.filePath);
    const fullPath = path.resolve(process.cwd(), env.UPLOAD_DIR, safeFileName);

    if (!fs.existsSync(fullPath)) {
      const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(fullPath, `CivicFlow Public Document: ${attachment.name}\nType: ${attachment.documentType}\nUploaded At: ${attachment.uploadedAt.toISOString()}`);
    }

    return res.download(fullPath, attachment.name);
  } catch (error) {
    next(error);
  }
};