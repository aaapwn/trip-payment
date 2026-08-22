import { describe, expect, test } from 'bun:test';
import {
  buildDebtPairs,
  buildPayableSummaries,
  buildReceivableSummaries,
  prunePaidShares,
  readPaidShares,
  setPairPaid,
  togglePaidShare,
} from './settlements';
import { calculateBalances, calculateSettlements } from './calculations';
import { IExpense, IMember, IPaidShare } from '@/models/Group';

const members: IMember[] = [
  { id: 'a', name: 'กอล์ฟ', color: '#5B7FE8' },
  { id: 'b', name: 'มิ้นต์', color: '#6BCF9E' },
];

const expense = (overrides: Partial<IExpense> & { key: string }): IExpense => ({
  description: 'ค่าอาหาร',
  amount: 1000,
  paidBy: 'a',
  splitWith: ['a', 'b'],
  date: new Date('2026-04-28'),
  ...overrides,
});

const group = (
  expenses: IExpense[],
  paidShares: IPaidShare[] = [],
  groupMembers: IMember[] = members
) => ({ members: groupMembers, expenses, paidShares });

const findPair = (pairs: ReturnType<typeof buildDebtPairs>, from: string, to: string) =>
  pairs.find((pair) => pair.from.id === from && pair.to.id === to);

describe('buildDebtPairs', () => {
  test('splits an expense among everyone except the payer', () => {
    const pairs = buildDebtPairs(group([expense({ key: 'e1', amount: 900 })]));

    expect(pairs).toHaveLength(1);
    expect(findPair(pairs, 'b', 'a')?.total).toBe(450);
  });

  test('keeps opposite debts separate instead of netting them off', () => {
    const pairs = buildDebtPairs(
      group([
        expense({ key: 'e1', amount: 1000, paidBy: 'a' }),
        expense({ key: 'e2', amount: 600, paidBy: 'b' }),
      ])
    );

    expect(findPair(pairs, 'b', 'a')?.total).toBe(500);
    expect(findPair(pairs, 'a', 'b')?.total).toBe(300);
  });

  test('a refund is owed by whoever collected it', () => {
    const pairs = buildDebtPairs(
      group([expense({ key: 'e1', description: 'เงินคืน', amount: -200, paidBy: 'a' })])
    );

    expect(findPair(pairs, 'a', 'b')?.total).toBe(100);
    expect(findPair(pairs, 'b', 'a')).toBeUndefined();
  });

  test('an expense whose member was removed is still counted, under a placeholder', () => {
    const pairs = buildDebtPairs(
      group([expense({ key: 'e1', amount: 900, paidBy: 'gone', splitWith: ['gone', 'a', 'b'] })])
    );

    expect(pairs).toHaveLength(2);
    expect(findPair(pairs, 'a', 'gone')?.total).toBe(300);
    expect(findPair(pairs, 'a', 'gone')?.to.name).toBe('สมาชิกที่ถูกลบ');
  });

  test('ignores an expense with nobody to split with instead of dividing by zero', () => {
    expect(buildDebtPairs(group([expense({ key: 'e1', splitWith: [] })]))).toHaveLength(0);
  });

  test('identifies shares by key, not by array position', () => {
    const paid = togglePaidShare([], 'e2', 'b', 'a');
    const before = findPair(
      buildDebtPairs(
        group([expense({ key: 'e1', amount: 600 }), expense({ key: 'e2', amount: 400 })], paid)
      ),
      'b',
      'a'
    );
    // Drop the first expense: the mark must stay on e2, not slide to another row.
    const after = findPair(
      buildDebtPairs(group([expense({ key: 'e2', amount: 400 })], paid)),
      'b',
      'a'
    );

    expect(before?.items.find((item) => item.expenseKey === 'e2')?.isPaid).toBe(true);
    expect(after?.items.find((item) => item.expenseKey === 'e2')?.isPaid).toBe(true);
    expect(after?.outstanding).toBe(0);
  });
});

describe('paid shares', () => {
  test('marking one share paid leaves the rest outstanding', () => {
    const paid = togglePaidShare([], 'e1', 'b', 'a');
    const pair = findPair(
      buildDebtPairs(
        group([expense({ key: 'e1', amount: 1000 }), expense({ key: 'e2', amount: 300 })], paid)
      ),
      'b',
      'a'
    );

    expect(pair?.total).toBe(650);
    expect(pair?.paidAmount).toBe(500);
    expect(pair?.outstanding).toBe(150);
    expect(pair?.paidCount).toBe(1);
    expect(pair?.isSettled).toBe(false);
    expect(pair?.isPartiallyPaid).toBe(true);
  });

  test('an expense added afterwards does not disturb what was already ticked', () => {
    const paid = togglePaidShare([], 'e1', 'b', 'a');
    const later = group(
      [
        expense({ key: 'e1', amount: 1000 }),
        expense({ key: 'e2', amount: 300, date: new Date('2026-05-01') }),
      ],
      paid
    );
    const pair = findPair(buildDebtPairs(later), 'b', 'a');

    expect(pair?.items.find((item) => item.expenseKey === 'e1')?.isPaid).toBe(true);
    expect(pair?.items.find((item) => item.expenseKey === 'e2')?.isPaid).toBe(false);
  });

  test('toggling the same share again clears it', () => {
    const paid = togglePaidShare(togglePaidShare([], 'e1', 'b', 'a'), 'e1', 'b', 'a');

    expect(paid).toHaveLength(0);
  });

  test('a pair is settled only once every share is ticked', () => {
    const data = group([expense({ key: 'e1', amount: 1000 }), expense({ key: 'e2', amount: 300 })]);
    const pair = findPair(buildDebtPairs(data), 'b', 'a')!;
    const allPaid = setPairPaid([], pair, true);
    const settled = findPair(buildDebtPairs({ ...data, paidShares: allPaid }), 'b', 'a');

    expect(allPaid).toHaveLength(2);
    expect(settled?.isSettled).toBe(true);
    expect(settled?.outstanding).toBe(0);

    const cleared = setPairPaid(allPaid, pair, false);
    expect(cleared).toHaveLength(0);
  });

  test('clearing one pair leaves another pair alone', () => {
    const data = group([
      expense({ key: 'e1', amount: 1000, paidBy: 'a' }),
      expense({ key: 'e2', amount: 600, paidBy: 'b' }),
    ]);
    const pairs = buildDebtPairs(data);
    const bOwesA = findPair(pairs, 'b', 'a')!;
    const aOwesB = findPair(pairs, 'a', 'b')!;

    const both = setPairPaid(setPairPaid([], bOwesA, true), aOwesB, true);
    expect(both).toHaveLength(2);

    const onlyAOwesB = setPairPaid(both, bOwesA, false);
    expect(onlyAOwesB).toHaveLength(1);
    expect(onlyAOwesB[0]).toMatchObject({ expenseKey: 'e2', from: 'a', to: 'b' });
  });

  test('pruning drops marks whose share no longer exists', () => {
    const pruned = prunePaidShares(
      group([expense({ key: 'e1', amount: 1000 })], [
        { expenseKey: 'e1', from: 'b', to: 'a', paidAt: new Date(0) },
        { expenseKey: 'gone', from: 'b', to: 'a', paidAt: new Date(0) },
      ])
    );

    expect(pruned).toHaveLength(1);
    expect(pruned[0].expenseKey).toBe('e1');
  });
});

describe('migrating older paid data', () => {
  test('spends a per-pair amount across that pair’s shares, oldest first', () => {
    const shares = readPaidShares({
      members,
      expenses: [
        expense({ key: 'e1', amount: 1000, date: new Date('2026-04-28') }),
        expense({ key: 'e2', amount: 300, date: new Date('2026-05-01') }),
      ],
      paidSettlements: [{ from: 'b', to: 'a', amount: 500, paidAt: new Date(0) }],
    });

    expect(shares).toHaveLength(1);
    expect(shares[0]).toMatchObject({ expenseKey: 'e1', from: 'b', to: 'a' });
  });

  test('migrates legacy `from->to:cents` keys the same way', () => {
    const shares = readPaidShares({
      members,
      expenses: [expense({ key: 'e1', amount: 1000 })],
      paidSettlementKeys: ['b->a:50000'],
    });

    expect(shares).toHaveLength(1);
    expect(shares[0].expenseKey).toBe('e1');
  });

  test('an amount too small for any share migrates to nothing', () => {
    const shares = readPaidShares({
      members,
      expenses: [expense({ key: 'e1', amount: 1000 })],
      paidSettlements: [{ from: 'b', to: 'a', amount: 100, paidAt: new Date(0) }],
    });

    expect(shares).toEqual([]);
  });

  test('stored shares win over the older fields', () => {
    const shares = readPaidShares({
      members,
      expenses: [expense({ key: 'e1', amount: 1000 })],
      paidShares: [{ expenseKey: 'e1', from: 'a', to: 'b', paidAt: new Date(0) }],
      paidSettlements: [{ from: 'b', to: 'a', amount: 500, paidAt: new Date(0) }],
    });

    expect(shares).toHaveLength(1);
    expect(shares[0]).toMatchObject({ from: 'a', to: 'b' });
  });
});

describe('member summaries', () => {
  test('payables and receivables mirror each other', () => {
    const data = group([expense({ key: 'e1', amount: 900 })]);
    const payable = buildPayableSummaries(data).find((item) => item.member.id === 'b');
    const receivable = buildReceivableSummaries(data).find((item) => item.member.id === 'a');

    expect(payable?.outstandingTotal).toBe(450);
    expect(receivable?.outstandingTotal).toBe(450);
  });

  test('a ticked share counts as paid on both sides', () => {
    const data = group([expense({ key: 'e1', amount: 900 })], [
      { expenseKey: 'e1', from: 'b', to: 'a', paidAt: new Date(0) },
    ]);
    const payable = buildPayableSummaries(data).find((item) => item.member.id === 'b');
    const receivable = buildReceivableSummaries(data).find((item) => item.member.id === 'a');

    expect(payable?.outstandingTotal).toBe(0);
    expect(payable?.paidTotal).toBe(450);
    expect(payable?.paidCount).toBe(1);
    expect(receivable?.settledPairCount).toBe(1);
  });
});

describe('netting helpers', () => {
  test('balances stay numeric when an expense references a removed member', () => {
    const balances = calculateBalances(
      [expense({ key: 'e1', amount: 900, paidBy: 'gone', splitWith: ['gone', 'a', 'b'] })],
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
