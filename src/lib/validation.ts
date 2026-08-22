import { z } from 'zod';
import { IExpense, IMember } from '@/models/Group';

const memberSchema = z.strictObject({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(60),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'สีต้องเป็นรหัส hex เช่น #5B7FE8'),
});

const expenseSchema = z.strictObject({
  _id: z.string().max(64).optional(),
  description: z.string().trim().min(1).max(200),
  amount: z
    .number()
    .refine(Number.isFinite, 'จำนวนเงินไม่ถูกต้อง')
    .refine((value) => Math.abs(value) <= 1_000_000_000, 'จำนวนเงินสูงเกินไป'),
  paidBy: z.string().min(1).max(64),
  splitWith: z.array(z.string().min(1).max(64)).min(1, 'ต้องเลือกคนที่ร่วมหารอย่างน้อย 1 คน'),
  date: z.coerce.date(),
});

const paidSettlementSchema = z.strictObject({
  from: z.string().min(1).max(64),
  to: z.string().min(1).max(64),
  amount: z.number().refine(Number.isFinite, 'ยอดที่จ่ายไม่ถูกต้อง').nonnegative(),
  paidAt: z.coerce.date().optional(),
});

/**
 * Strict on purpose: unknown keys are rejected, so a request body can never
 * smuggle MongoDB update operators (`$set`, `$unset`, …) into the update.
 */
export const groupPatchSchema = z
  .strictObject({
    members: z.array(memberSchema).max(200).optional(),
    expenses: z.array(expenseSchema).max(5000).optional(),
    paidSettlements: z.array(paidSettlementSchema).max(5000).optional(),
    /** Optimistic concurrency token: the `updatedAt` the client last read. */
    expectedUpdatedAt: z.coerce.date().optional(),
  })
  .refine(
    (body) =>
      body.members !== undefined ||
      body.expenses !== undefined ||
      body.paidSettlements !== undefined,
    'ต้องระบุ members, expenses หรือ paidSettlements อย่างน้อยหนึ่งอย่าง'
  );

export type GroupPatchBody = z.infer<typeof groupPatchSchema>;

/**
 * Referential integrity between members and expenses. Enforced on write so a
 * member cannot be removed while expenses still point at them, which used to
 * make those expenses vanish from every summary while still counting towards
 * the group total.
 */
export function findIntegrityErrors(members: IMember[], expenses: IExpense[]): string[] {
  const errors: string[] = [];
  const memberIds = new Set<string>();
  const duplicateIds = new Set<string>();

  for (const member of members) {
    if (memberIds.has(member.id)) duplicateIds.add(member.id);
    memberIds.add(member.id);
  }

  if (duplicateIds.size > 0) {
    errors.push(`สมาชิกมี id ซ้ำกัน: ${Array.from(duplicateIds).join(', ')}`);
  }

  const missingIds = new Set<string>();

  expenses.forEach((expense, index) => {
    if (!memberIds.has(expense.paidBy)) missingIds.add(expense.paidBy);

    for (const memberId of expense.splitWith) {
      if (!memberIds.has(memberId)) missingIds.add(memberId);
    }

    if (new Set(expense.splitWith).size !== expense.splitWith.length) {
      errors.push(`รายการ "${expense.description || index + 1}" มีคนร่วมหารซ้ำกัน`);
    }
  });

  if (missingIds.size > 0) {
    errors.push(
      'มีรายการค่าใช้จ่ายที่อ้างถึงสมาชิกที่ไม่อยู่ในกลุ่มแล้ว — ลบหรือแก้รายการเหล่านั้นก่อนลบสมาชิก'
    );
  }

  return errors;
}
