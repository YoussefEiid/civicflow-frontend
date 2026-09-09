import { prisma } from '../config/database.js';
import { PriorityLevel } from '@prisma/client';

export interface SlaCalculationResult {
  expectedCompletionDate: Date;
  daysRemainingOrOverdue: number;
  deadlineStatus: 'ضمن المدة' | 'اقترب الموعد' | 'متأخر';
}

export const calculateRequestSLA = async (
  ministryId: string,
  priority: PriorityLevel,
  receiveDate: Date = new Date(),
  completedDate?: Date | null
): Promise<SlaCalculationResult> => {
  const slaSetting = await prisma.sLASetting.findUnique({
    where: { ministryId }
  });

  const ministry = !slaSetting
    ? await prisma.ministry.findUnique({ where: { id: ministryId } })
    : null;

  let days = 7;
  let autoAlertBeforeDays = 2;

  if (slaSetting) {
    autoAlertBeforeDays = slaSetting.autoAlertBeforeDays || 2;
    if (priority === PriorityLevel.URGENT) {
      days = slaSetting.urgentDays;
    } else if (priority === PriorityLevel.IMPORTANT) {
      days = slaSetting.importantDays;
    } else {
      days = slaSetting.defaultDays;
    }
  } else if (ministry) {
    days = ministry.slaDays || 7;
    if (priority === PriorityLevel.URGENT) {
      days = Math.max(2, Math.floor(days / 2));
    } else if (priority === PriorityLevel.IMPORTANT) {
      days = Math.max(3, Math.floor(days * 0.75));
    }
  }

  const expectedDate = new Date(receiveDate);
  expectedDate.setDate(expectedDate.getDate() + days);

  const referenceDate = completedDate || new Date();
  const diffTime = expectedDate.getTime() - referenceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let deadlineStatus: 'ضمن المدة' | 'اقترب الموعد' | 'متأخر' = 'ضمن المدة';

  if (!completedDate) {
    if (diffDays < 0) {
      deadlineStatus = 'متأخر';
    } else if (diffDays <= autoAlertBeforeDays) {
      deadlineStatus = 'اقترب الموعد';
    } else {
      deadlineStatus = 'ضمن المدة';
    }
  }

  return {
    expectedCompletionDate: expectedDate,
    daysRemainingOrOverdue: diffDays,
    deadlineStatus
  };
};