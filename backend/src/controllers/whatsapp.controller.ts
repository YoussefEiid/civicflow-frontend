import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { whatsAppProvider } from '../services/whatsapp/index.js';
import { AppError } from '../middlewares/error.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

const templateSchema = z.object({
  key: z.string().min(2, 'مفتاح القالب مطلوب'),
  title: z.string().min(2, 'عنوان القالب مطلوب'),
  content: z.string().min(5, 'نص القالب مطلوب'),
  variables: z.array(z.string()).default([])
});

const sendManualSchema = z.object({
  phoneNumber: z.string().min(8, 'رقم الهاتف مطلوب'),
  message: z.string().min(2, 'نص الرسالة مطلوب'),
  templateKey: z.string().optional(),
  requestId: z.string().optional()
});

export const getTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.whatsAppTemplate.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const formatted = templates.map((t) => ({
      id: t.id,
      key: t.key,
      title: t.title,
      content: t.content,
      variables: Array.isArray(t.variables) ? (t.variables as string[]) : [],
      lastUpdated: t.updatedAt.toISOString().split('T')[0]
    }));

    return sendSuccess(res, formatted);
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = templateSchema.parse(req.body);

    const created = await prisma.whatsAppTemplate.create({
      data: {
        key: data.key,
        title: data.title,
        content: data.content,
        variables: data.variables
      }
    });

    return sendSuccess(res, created, 'تم إنشاء قالب الرسالة بنجاح', 201);
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = templateSchema.partial().parse(req.body);

    const updated = await prisma.whatsAppTemplate.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.variables && { variables: data.variables })
      }
    });

    return sendSuccess(res, updated, 'تم تحديث قالب الرسالة بنجاح');
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.whatsAppTemplate.delete({ where: { id } });
    return sendSuccess(res, null, 'تم حذف قالب الرسالة بنجاح');
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.whatsAppMessageLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return sendSuccess(res, logs);
  } catch (error) {
    next(error);
  }
};

export const sendManualWhatsApp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = sendManualSchema.parse(req.body);

    const result = await whatsAppProvider.sendMessage({
      to: data.phoneNumber,
      message: data.message,
      templateKey: data.templateKey,
      requestId: data.requestId
    });

    return sendSuccess(res, result, 'تم إرسال رسالة الـ WhatsApp بنجاح');
  } catch (error) {
    next(error);
  }
};