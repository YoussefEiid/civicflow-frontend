import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

export async function generateNextCustomerNumber(tx?: Prisma.TransactionClient): Promise<string> {
  const client = tx || prisma;
  const count = await client.customer.count();
  const nextSeq = count + 1001;

  let candidate = `CUST-${nextSeq}`;
  let exists = await client.customer.findUnique({ where: { customerNumber: candidate } });

  let counter = 1;
  while (exists) {
    candidate = `CUST-${nextSeq + counter}`;
    exists = await client.customer.findUnique({ where: { customerNumber: candidate } });
    counter++;
  }

  return candidate;
}
