import { describe, expect, test } from 'bun:test';
import { findIntegrityErrors, groupPatchSchema } from './validation';
import { IExpense, IMember } from '@/models/Group';

const members: IMember[] = [
  { id: 'a', name: 'กอล์ฟ', color: '#5B7FE8' },
  { id: 'b', name: 'มิ้นต์', color: '#6BCF9E' },
];

const expense = (overrides: Partial<IExpense> = {}): IExpense => ({
  description: 'ค่าอาหาร',
  amount: 900,
  paidBy: 'a',
  splitWith: ['a', 'b'],
  date: new Date('2026-04-28'),
  ...overrides,
});

describe('groupPatchSchema', () => {
  test('accepts a members-only update', () => {
    expect(groupPatchSchema.safeParse({ members }).success).toBe(true);
  });

  test('rejects MongoDB update operators smuggled in as keys', () => {
    expect(groupPatchSchema.safeParse({ $unset: { expenses: 1 } }).success).toBe(false);
    expect(
      groupPatchSchema.safeParse({ members, $set: { members: [] } }).success
    ).toBe(false);
  });

  test('rejects unknown fields', () => {
    expect(groupPatchSchema.safeParse({ members, isAdmin: true }).success).toBe(false);
  });

  test('rejects an empty update', () => {
    expect(groupPatchSchema.safeParse({}).success).toBe(false);
  });

  test('rejects a malformed expense', () => {
    expect(
      groupPatchSchema.safeParse({ expenses: [{ ...expense(), amount: 'a lot' }] }).success
    ).toBe(false);
    expect(
      groupPatchSchema.safeParse({ expenses: [{ ...expense(), splitWith: [] }] }).success
    ).toBe(false);
    expect(
      groupPatchSchema.safeParse({ expenses: [{ ...expense(), description: '  ' }] }).success
    ).toBe(false);
  });

  test('rejects a NaN amount', () => {
    expect(groupPatchSchema.safeParse({ expenses: [{ ...expense(), amount: NaN }] }).success)
      .toBe(false);
  });

  test('rejects a colour that is not a hex code', () => {
    expect(
      groupPatchSchema.safeParse({ members: [{ id: 'a', name: 'กอล์ฟ', color: 'red' }] }).success
    ).toBe(false);
  });

  test('parses dates that arrived as JSON strings', () => {
    const result = groupPatchSchema.safeParse({
      expenses: [{ ...expense(), date: '2026-04-28T00:00:00.000Z' }],
      expectedUpdatedAt: '2026-04-28T10:00:00.000Z',
    });

    expect(result.success).toBe(true);
    expect(result.data?.expenses?.[0].date).toBeInstanceOf(Date);
    expect(result.data?.expectedUpdatedAt).toBeInstanceOf(Date);
  });

  test('accepts a negative amount as a refund', () => {
    expect(groupPatchSchema.safeParse({ expenses: [expense({ amount: -200 })] }).success)
      .toBe(true);
  });
});

describe('findIntegrityErrors', () => {
  test('accepts consistent data', () => {
    expect(findIntegrityErrors(members, [expense()])).toEqual([]);
  });

  test('rejects removing a member who still has expenses', () => {
    const errors = findIntegrityErrors([members[0]], [expense()]);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('ลบหรือแก้รายการ');
  });

  test('rejects an expense paid by someone outside the group', () => {
    expect(findIntegrityErrors(members, [expense({ paidBy: 'ghost' })])).toHaveLength(1);
  });

  test('rejects duplicate member ids', () => {
    const errors = findIntegrityErrors([members[0], members[0]], []);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('id ซ้ำกัน');
  });

  test('rejects the same person listed twice in one split', () => {
    expect(
      findIntegrityErrors(members, [expense({ splitWith: ['a', 'b', 'b'] })])
    ).toHaveLength(1);
  });
});
