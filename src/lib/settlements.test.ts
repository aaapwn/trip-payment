import { describe, expect, test } from 'bun:test';
import {
  buildDebtPairs,
  buildPayableSummaries,
  buildReceivableSummaries,
  prunePaidSettlements,
  readPaidSettlements,
  togglePaidSettlement,
} from './settlements';
import { calculateBalances, calculateSettlements } from './calculations';
import { IExpense, IMember, IPaidSettlement } from '@/models/Group';

const members: IMember[] = [
  { id: 'a', name: 'กอล์ฟ', color: '#5B7FE8' },
  { id: 'b', name: 'มิ้นต์', color: '#6BCF9E' },
];

const expense = (overrides: Partial<IExpense>): IExpense => ({
  description: 'ค่าอาหาร',
  amount: 1000,
  paidBy: 'a',
  splitWith: ['a', 'b'],
  date: new Date('2026-04-28'),
  ...overrides,
});

const group = (
  expenses: IExpense[],
  paidSettlements: IPaidSettlement[] = [],
  groupMembers: IMember[] = members
) => ({ members: groupMembers, expenses, paidSettlements });

const findPair = (pairs: ReturnType<typeof buildDebtPairs>, from: string, to: string) =>
  pairs.find((pair) => pair.from.id === from && pair.to.id === to);

describe('buildDebtPairs', () => {
  test('splits an expense among everyone except the payer', () => {
    const pairs = buildDebtPairs(group([expense({ amount: 900, splitWith: ['a', 'b'] })]));

    expect(pairs).toHaveLength(1);
    expect(findPair(pairs, 'b', 'a')?.total).toBe(450);
  });

  test('keeps opposite debts separate instead of netting them off', () => {
    const pairs = buildDebtPairs(
      group([
        expense({ amount: 1000, paidBy: 'a' }),
        expense({ amount: 600, paidBy: 'b' }),
      ])
    );

    expect(findPair(pairs, 'b', 'a')?.total).toBe(500);
    expect(findPair(pairs, 'a', 'b')?.total).toBe(300);
  });

  test('a refund is owed by whoever collected it', () => {
    const pairs = buildDebtPairs(
      group([expense({ description: 'เงินคืนที่พัก', amount: -200, paidBy: 'a' })])
    );

    expect(findPair(pairs, 'a', 'b')?.total).toBe(100);
    expect(findPair(pairs, 'b', 'a')).toBeUndefined();
  });

  test('an expense whose member was removed is still counted, under a placeholder', () => {
    const pairs = buildDebtPairs(
      group([expense({ amount: 900, paidBy: 'gone', splitWith: ['gone', 'a', 'b'] })])
    );

    expect(pairs).toHaveLength(2);
    expect(findPair(pairs, 'a', 'gone')?.total).toBe(300);
    expect(findPair(pairs, 'a', 'gone')?.to.name).toBe('สมาชิกที่ถูกลบ');
  });

  test('ignores an expense with nobody to split with instead of dividing by zero', () => {
    expect(buildDebtPairs(group([expense({ splitWith: [] })]))).toHaveLength(0);
  });
});

describe('paid settlements', () => {
  test('marking as paid records the transferred amount', () => {
    const paid = togglePaidSettlement([], 'b', 'a', 500);

    expect(paid).toHaveLength(1);
    expect(paid[0]).toMatchObject({ from: 'b', to: 'a', amount: 500 });
  });

  test('toggling a settled debt again clears it', () => {
    const paid = togglePaidSettlement(
      [{ from: 'b', to: 'a', amount: 500, paidAt: new Date() }],
      'b',
      'a',
      500
    );

    expect(paid).toHaveLength(0);
  });

  test('a later expense leaves the payment in place and only raises the outstanding amount', () => {
    const paid = togglePaidSettlement([], 'b', 'a', 500);
    const pairs = buildDebtPairs(
      group([expense({ amount: 1000 }), expense({ amount: 300 })], paid)
    );
    const pair = findPair(pairs, 'b', 'a');

    expect(pair?.total).toBe(650);
    expect(pair?.paidAmount).toBe(500);
    expect(pair?.outstanding).toBe(150);
    expect(pair?.isSettled).toBe(false);
    expect(pair?.isPartiallyPaid).toBe(true);
  });

  test('migrates legacy `from->to:cents` keys', () => {
    const records = readPaidSettlements({ paidSettlementKeys: ['b->a:50000'] });

    expect(records).toEqual([
      { from: 'b', to: 'a', amount: 500, paidAt: new Date(0) },
    ]);
  });

  test('a stored record never overrides the migrated legacy key for the same pair', () => {
    const records = readPaidSettlements({
      paidSettlements: [{ from: 'b', to: 'a', amount: 120, paidAt: new Date(0) }],
      paidSettlementKeys: ['b->a:50000'],
    });

    expect(records).toHaveLength(1);
    expect(records[0].amount).toBe(120);
  });

  test('pruning drops records for debts that no longer exist and clamps the rest', () => {
    const pruned = prunePaidSettlements(
      group([expense({ amount: 200 })], [
        { from: 'b', to: 'a', amount: 500, paidAt: new Date(0) },
        { from: 'a', to: 'b', amount: 40, paidAt: new Date(0) },
      ])
    );

    expect(pruned).toHaveLength(1);
    expect(pruned[0]).toMatchObject({ from: 'b', to: 'a', amount: 100 });
  });
});

describe('member summaries', () => {
  test('payables and receivables mirror each other', () => {
    const data = group([expense({ amount: 900 })]);
    const payable = buildPayableSummaries(data).find((item) => item.member.id === 'b');
    const receivable = buildReceivableSummaries(data).find((item) => item.member.id === 'a');

    expect(payable?.outstandingTotal).toBe(450);
    expect(receivable?.outstandingTotal).toBe(450);
  });

  test('a settled debt counts as paid on both sides', () => {
    const data = group([expense({ amount: 900 })], [
      { from: 'b', to: 'a', amount: 450, paidAt: new Date(0) },
    ]);
    const payable = buildPayableSummaries(data).find((item) => item.member.id === 'b');
    const receivable = buildReceivableSummaries(data).find((item) => item.member.id === 'a');

    expect(payable?.outstandingTotal).toBe(0);
    expect(payable?.paidTotal).toBe(450);
    expect(receivable?.settledPairCount).toBe(1);
  });
});

describe('netting helpers', () => {
  test('balances stay numeric when an expense references a removed member', () => {
    const balances = calculateBalances(
      [expense({ amount: 900, paidBy: 'gone', splitWith: ['gone', 'a', 'b'] })],
      members
    );

    expect(Object.values(balances).every(Number.isFinite)).toBe(true);
    expect(balances.gone).toBeCloseTo(600, 10);
  });

  test('settlement transfers add up to the balances they came from', () => {
    const settlements = calculateSettlements({ a: 666.67, b: -333.34, c: -333.33 });
    const total = settlements.reduce((sum, item) => sum + item.amount, 0);

    expect(total).toBeCloseTo(666.67, 10);
  });
});
