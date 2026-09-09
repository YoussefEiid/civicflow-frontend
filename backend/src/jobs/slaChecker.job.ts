import cron from 'node-cron';
import { prisma } from '../config/database.js';

export const checkAndUpdateRequestSLAs = async () => {
  try {
    const terminalStatuses = ['تم التسليم', 'مغلق', 'الإجابة جاهزة'];

    const pendingRequests = await prisma.request.findMany({
      where: {
        status: { notIn: terminalStatuses }
      },
      include: {
        ministry: {
          include: {
            slaSetting: true
          }
        },
        assignedEmployee: true
      }
    });

    const now = new Date();
    let updatedCount = 0;
    let alertsCreated = 0;

    for (const req of pendingRequests) {
      const expected = new Date(req.expectedCompletionDate);
      const diffTime = expected.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const autoAlertBeforeDays = req.ministry?.slaSetting?.autoAlertBeforeDays || 2;

      let newDeadlineStatus = 'ضمن المدة';
      if (diffDays < 0) {
        newDeadlineStatus = 'متأخر';
      } else if (diffDays <= autoAlertBeforeDays) {
        newDeadlineStatus = 'اقترب الموعد';
      }

      const statusChanged = req.deadlineStatus !== newDeadlineStatus || req.daysRemainingOrOverdue !== diffDays;

      if (statusChanged) {
        await prisma.request.update({
          where: { id: req.id },
          data: {
            deadlineStatus: newDeadlineStatus,
            daysRemainingOrOverdue: diffDays
          }
        });
        updatedCount++;

        // If status transitioned to OVERDUE or WARNING, generate alert notification
        if (newDeadlineStatus === 'متأخر' && req.deadlineStatus !== 'متأخر') {
          const targetUserId = req.assignedEmployeeId || undefined;
          await prisma.notification.create({
            data: {
              userId: targetUserId,
              title: `تنبيه: تأخر المعاملة #${req.requestNumber}`,
              message: `تجاوزت المعاملة #${req.requestNumber} (${req.title}) المدة المحددة للإنجاز لدى ${req.ministry.name}`,
              requestId: req.id,
              requestNumber: req.requestNumber,
              type: 'overdue',
              link: `/requests/${req.id}`
            }
          });
          alertsCreated++;
        } else if (newDeadlineStatus === 'اقترب الموعد' && req.deadlineStatus === 'ضمن المدة') {
          const targetUserId = req.assignedEmployeeId || undefined;
          await prisma.notification.create({
            data: {
              userId: targetUserId,
              title: `تنبيه: اقتراب موعد إنجاز المعاملة #${req.requestNumber}`,
              message: `المعاملة #${req.requestNumber} متبقي عليها ${diffDays} يوم/أيام فقط للإنجاز`,
              requestId: req.id,
              requestNumber: req.requestNumber,
              type: 'overdue',
              link: `/requests/${req.id}`
            }
          });
          alertsCreated++;
        }
      }
    }

    if (updatedCount > 0) {
      console.log(`⏱️ SLA Background Job: Evaluated ${pendingRequests.length} requests, updated ${updatedCount}, created ${alertsCreated} alerts.`);
    }
  } catch (error) {
    console.error('❌ Error executing SLA Background Job:', error);
  }
};

export const startSlaBackgroundJob = () => {
  // Run every hour
  cron.schedule('0 * * * *', () => {
    checkAndUpdateRequestSLAs();
  });

  // Run once immediately on startup
  setTimeout(() => {
    checkAndUpdateRequestSLAs();
  }, 3000);

  console.log('⏰ SLA Background Cron Job scheduled (hourly check).');
};