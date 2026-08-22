import { IExpense, IGroup, IMember, IPaidSettlement } from '@/models/Group';

/** Sub-satang tolerance used for every money comparison. */
export const MONEY_EPSILON = 0.005;

const DELETED_MEMBER_COLOR = '#9CA3AF';

export const formatCurrency = (amount: number) =>
  `฿${amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * Members referenced by an expense may no longer exist (removed while their
 * expenses were kept). Render them as an explicit placeholder instead of
 * dropping the row, so the summaries still add up to the group total.
 */
export function resolveMember(members: IMember[], memberId: string): IMember {
  return (
    members.find((member) => member.id === memberId) ?? {
      id: memberId,
      name: 'สมาชิกที่ถูกลบ',
      color: DELETED_MEMBER_COLOR,
    }
  );
}

export function isMemberReferenced(expenses: IExpense[], memberId: string) {
  return expenses.some(
    (expense) => expense.paidBy === memberId || expense.splitWith.includes(memberId)
  );
}

export interface ShareLine {
  expenseIndex: number;
  description: string;
  date: Date;
  amount: number;
  totalAmount: number;
}

/** One direction of debt: `from` owes `to`. */
export interface DebtPair {
  from: IMember;
  to: IMember;
  total: number;
  paidAmount: number;
  outstanding: number;
  isSettled: boolean;
  isPartiallyPaid: boolean;
  items: ShareLine[];
}

/**
 * Legacy `from->to:cents` keys are migrated on read so that ticking "paid"
 * before this change is not lost.
 */
export function readPaidSettlements(
  group: Pick<IGroup, 'paidSettlements' | 'paidSettlementKeys'>
): IPaidSettlement[] {
  const records = (group.paidSettlements ?? []).map((record) => ({
    from: record.from,
    to: record.to,
    amount: record.amount,
    paidAt: record.paidAt,
  }));
  const seen = new Set(records.map((record) => pairKey(record.from, record.to)));

  for (const legacyKey of group.paidSettlementKeys ?? []) {
    const match = /^(.+)->(.+):(\d+)$/.exec(legacyKey);
    if (!match) continue;

    const [, from, to, cents] = match;
    if (seen.has(pairKey(from, to))) continue;

    seen.add(pairKey(from, to));
    records.push({ from, to, amount: Number(cents) / 100, paidAt: new Date(0) });
  }

  return records;
}

export function pairKey(fromMemberId: string, toMemberId: string) {
  return `${fromMemberId}->${toMemberId}`;
}

export function getPaidAmount(
  paidSettlements: IPaidSettlement[],
  fromMemberId: string,
  toMemberId: string
) {
  return (
    paidSettlements.find(
      (record) => record.from === fromMemberId && record.to === toMemberId
    )?.amount ?? 0
  );
}

/**
 * Marks the debt as fully settled, or clears it when it already is.
 * The recorded amount is what has actually been transferred, so a later
 * expense increases the outstanding balance instead of resetting the tick.
 */
export function togglePaidSettlement(
  paidSettlements: IPaidSettlement[],
  fromMemberId: string,
  toMemberId: string,
  total: number
): IPaidSettlement[] {
  const others = paidSettlements.filter(
    (record) => !(record.from === fromMemberId && record.to === toMemberId)
  );
  const paidAmount = getPaidAmount(paidSettlements, fromMemberId, toMemberId);

  if (paidAmount >= total - MONEY_EPSILON) {
    return others;
  }

  return [
    ...others,
    { from: fromMemberId, to: toMemberId, amount: total, paidAt: new Date() },
  ];
}

/**
 * Every directed debt implied by the expense list, gross per pair (each
 * expense is repaid to whoever fronted it — debts in opposite directions are
 * deliberately not netted off against each other).
 */
export function buildDebtPairs(
  group: Pick<IGroup, 'members' | 'expenses' | 'paidSettlements' | 'paidSettlementKeys'>
): DebtPair[] {
  const paidSettlements = readPaidSettlements(group);
  const pairs = new Map<string, DebtPair>();

  group.expenses.forEach((expense, expenseIndex) => {
    if (expense.splitWith.length === 0) return;

    const shareAmount = expense.amount / expense.splitWith.length;
    const isRefund = shareAmount < 0;
    const payer = resolveMember(group.members, expense.paidBy);

    // A refund flips the direction: whoever collected it owes everyone a share.
    const debts = isRefund
      ? expense.splitWith
          .filter((memberId) => memberId !== expense.paidBy)
          .map((memberId) => ({ from: payer, to: resolveMember(group.members, memberId) }))
      : expense.splitWith
          .filter((memberId) => memberId !== expense.paidBy)
          .map((memberId) => ({ from: resolveMember(group.members, memberId), to: payer }));

    for (const { from, to } of debts) {
      const line: ShareLine = {
        expenseIndex,
        description: expense.description,
        date: expense.date,
        amount: Math.abs(shareAmount),
        totalAmount: expense.amount,
      };

      const key = pairKey(from.id, to.id);
      const existing = pairs.get(key);

      if (existing) {
        existing.items.push(line);
        existing.total += line.amount;
      } else {
        pairs.set(key, {
          from,
          to,
          total: line.amount,
          paidAmount: 0,
          outstanding: 0,
          isSettled: false,
          isPartiallyPaid: false,
          items: [line],
        });
      }
    }
  });

  return Array.from(pairs.values()).map((pair) => {
    const paidAmount = Math.min(
      getPaidAmount(paidSettlements, pair.from.id, pair.to.id),
      pair.total
    );

    return {
      ...pair,
      paidAmount,
      outstanding: Math.max(pair.total - paidAmount, 0),
      isSettled: paidAmount >= pair.total - MONEY_EPSILON,
      isPartiallyPaid: paidAmount > MONEY_EPSILON && paidAmount < pair.total - MONEY_EPSILON,
      items: [...pair.items].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    };
  });
}

export interface MemberDebtSummary {
  member: IMember;
  pairs: DebtPair[];
  items: ShareLine[];
  total: number;
  paidTotal: number;
  outstandingTotal: number;
  settledPairCount: number;
}

function summarize(member: IMember, pairs: DebtPair[]): MemberDebtSummary {
  const sorted = [...pairs].sort((a, b) => b.outstanding - a.outstanding || b.total - a.total);

  return {
    member,
    pairs: sorted,
    items: sorted.flatMap((pair) => pair.items),
    total: sorted.reduce((sum, pair) => sum + pair.total, 0),
    paidTotal: sorted.reduce((sum, pair) => sum + pair.paidAmount, 0),
    outstandingTotal: sorted.reduce((sum, pair) => sum + pair.outstanding, 0),
    settledPairCount: sorted.filter((pair) => pair.isSettled).length,
  };
}

/** Per member: what they have to pay out, grouped by payee. */
export function buildPayableSummaries(
  group: Pick<IGroup, 'members' | 'expenses' | 'paidSettlements' | 'paidSettlementKeys'>
): MemberDebtSummary[] {
  const pairs = buildDebtPairs(group);

  return group.members.map((member) =>
    summarize(
      member,
      pairs.filter((pair) => pair.from.id === member.id)
    )
  );
}

/** Per member: what they are owed, grouped by debtor. */
export function buildReceivableSummaries(
  group: Pick<IGroup, 'members' | 'expenses' | 'paidSettlements' | 'paidSettlementKeys'>
): MemberDebtSummary[] {
  const pairs = buildDebtPairs(group);

  return group.members
    .map((member) =>
      summarize(
        member,
        pairs.filter((pair) => pair.to.id === member.id)
      )
    )
    .filter((summary) => summary.pairs.length > 0);
}

/**
 * Drops paid records for pairs that no longer owe anything and clamps the rest
 * to the current debt, so a deleted expense cannot leave a mark behind that
 * would resurface on a brand new debt between the same two people.
 */
export function prunePaidSettlements(
  group: Pick<IGroup, 'members' | 'expenses' | 'paidSettlements' | 'paidSettlementKeys'>
): IPaidSettlement[] {
  const totals = new Map(
    buildDebtPairs(group).map((pair) => [pairKey(pair.from.id, pair.to.id), pair.total])
  );

  return readPaidSettlements(group).flatMap((record) => {
    const total = totals.get(pairKey(record.from, record.to)) ?? 0;
    if (total <= MONEY_EPSILON) return [];

    return [{ ...record, amount: Math.min(record.amount, total) }];
  });
}
