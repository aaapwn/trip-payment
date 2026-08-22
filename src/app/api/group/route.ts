import { NextResponse } from 'next/server';
import { connectDB, isDatabaseConfigured } from '@/lib/mongodb';
import { Group, IExpense, IMember, IPaidSettlement } from '@/models/Group';
import { prunePaidSettlements, readPaidSettlements } from '@/lib/settlements';
import { findIntegrityErrors, groupPatchSchema } from '@/lib/validation';

interface GroupData {
  _id: string;
  members: IMember[];
  expenses: IExpense[];
  paidSettlements: IPaidSettlement[];
  paidSettlementKeys?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fallback store used when MONGODB_URI is not configured, so the app is
 * runnable without a database. Module-level state: it is per server process
 * and resets on restart.
 */
const mockGroup: GroupData = {
  _id: 'mock-group',
  members: [
    { id: '1', name: 'กอล์ฟ', color: '#5B7FE8' },
    { id: '2', name: 'มิ้นต์', color: '#6BCF9E' },
    { id: '3', name: 'เบียร์', color: '#F59E42' },
  ],
  expenses: [
    {
      _id: 'exp-1',
      description: 'ค่าที่พัก',
      amount: 3000,
      paidBy: '1',
      splitWith: ['1', '2', '3'],
      date: new Date('2026-04-28'),
    },
    {
      _id: 'exp-2',
      description: 'ค่าอาหาร',
      amount: 900,
      paidBy: '2',
      splitWith: ['1', '2', '3'],
      date: new Date('2026-04-28'),
    },
  ],
  paidSettlements: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const conflictResponse = (group: unknown) =>
  NextResponse.json(
    {
      error: 'ข้อมูลถูกแก้ไขจากที่อื่นระหว่างที่คุณกำลังแก้ไข กรุณาโหลดใหม่แล้วลองอีกครั้ง',
      code: 'conflict',
      group,
    },
    { status: 409 }
  );

export async function GET() {
  if (!isDatabaseConfigured()) {
    console.warn('⚠️  Using mock data - MongoDB not configured');
    return NextResponse.json(mockGroup);
  }

  try {
    await connectDB();
    const group =
      (await Group.findOne()) ??
      (await Group.create({ members: [], expenses: [], paidSettlements: [] }));

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง (invalid JSON)' }, { status: 400 });
  }

  const parsed = groupPatchSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'ข้อมูลที่ส่งมาไม่ถูกต้อง',
        code: 'validation',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const { expectedUpdatedAt, ...updates } = parsed.data;

  if (!isDatabaseConfigured()) {
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== mockGroup.updatedAt.getTime()) {
      return conflictResponse(mockGroup);
    }

    const members = updates.members ?? mockGroup.members;
    const expenses = (updates.expenses ?? mockGroup.expenses) as IExpense[];
    const integrityErrors = findIntegrityErrors(members, expenses);

    if (integrityErrors.length > 0) {
      return NextResponse.json(
        { error: integrityErrors[0], code: 'integrity', issues: integrityErrors },
        { status: 400 }
      );
    }

    mockGroup.members = members;
    mockGroup.expenses = expenses;
    mockGroup.paidSettlements = prunePaidSettlements({
      members,
      expenses,
      paidSettlements: (updates.paidSettlements ?? mockGroup.paidSettlements).map((record) => ({
        ...record,
        paidAt: record.paidAt ?? new Date(),
      })),
    });
    mockGroup.updatedAt = new Date();

    return NextResponse.json(mockGroup);
  }

  try {
    await connectDB();
    const current =
      (await Group.findOne()) ??
      (await Group.create({ members: [], expenses: [], paidSettlements: [] }));

    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== current.updatedAt.getTime()) {
      return conflictResponse(current);
    }

    const members = updates.members ?? current.members;
    const expenses = (updates.expenses ?? current.expenses) as IExpense[];
    const integrityErrors = findIntegrityErrors(members, expenses);

    if (integrityErrors.length > 0) {
      return NextResponse.json(
        { error: integrityErrors[0], code: 'integrity', issues: integrityErrors },
        { status: 400 }
      );
    }

    const paidSettlements = prunePaidSettlements({
      members,
      expenses,
      paidSettlements: (
        updates.paidSettlements ?? readPaidSettlements(current)
      ).map((record) => ({ ...record, paidAt: record.paidAt ?? new Date() })),
    });

    // Compare-and-set on updatedAt: a concurrent write between the read above
    // and this update loses instead of silently overwriting the other change.
    const updated = await Group.findOneAndUpdate(
      { _id: current._id, updatedAt: current.updatedAt },
      {
        $set: { members, expenses, paidSettlements },
        $unset: { paidSettlementKeys: '' },
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return conflictResponse(await Group.findOne());
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}
