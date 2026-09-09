import { prisma } from '../config/database.js';

export const generateNextRequestNumber = async (tx?: any): Promise<string> => {
  const client = tx || prisma;
  const currentYear = new Date().getFullYear();
  const prefix = `REQ-${currentYear}-`;

  // Find latest request for the current year
  const latest = await client.request.findFirst({
    where: {
      requestNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      requestNumber: true
    }
  });

  let nextSequence = 1;

  if (latest && latest.requestNumber) {
    const parts = latest.requestNumber.split('-');
    if (parts.length >= 3) {
      const parsedSeq = parseInt(parts[2], 10);
      if (!isNaN(parsedSeq)) {
        nextSequence = parsedSeq + 1;
      }
    }
  } else {
    // If no year-based requests exist yet, check total count to seed smoothly
    const totalCount = await client.request.count();
    nextSequence = totalCount + 1;
  }

  const paddedSequence = String(nextSequence).padStart(6, '0');
  return `${prefix}${paddedSequence}`;
};