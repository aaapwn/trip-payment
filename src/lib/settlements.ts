import { IExpense, IGroup, IMember, IPaidShare } from '@/models/Group';

/** Sub-satang tolerance used for every money comparison. */
export const MONEY_EPSILON = 0.005;

const DELETED_MEMBER_COLOR = '#9CA3AF';

type GroupLike = Pick<
  IGroup,
  'members' | 'expenses' | 'paidShares' | 'paidSettlements' | 'paidSettlementKeys'
>;

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

/**
 * Identity of an expense for paid marks. `key` is written by the client and
 * backfilled on save; the fallbacks keep older rows usable until then.
 */
export function expenseKeyOf(expense: IExpense, index: number): string {
  if (expense.key) return expense.key;
  if (expense._id) return String(expense._id);

  return `idx:${index}`;
}

export function pairKey(fromMemberId: string, toMemberId: string) {
  return `${fromMemberId}->${toMemberId}`;
}

const shareKey = (expenseKey: string, fromMemberId: string, toMemberId: string) =>
  `${expenseKey}|${fromMemberId}->${toMemberId}`;

export interface ShareLine {
  expenseKey: string;
  expenseIndex: number;
  description: string;
  date: Date;
  amount: number;
  totalAmount: number;
  isPaid: boolean;
}

/** One direction of debt: `from` owes `to`. */
export interface DebtPair {
  from: IMember;
  to: IMember;
  total: number;
  paidAmount: number;
  outstanding: number;
  paidCount: number;
  isSettled: boolean;
  isPartiallyPaid: boolean;
  items: ShareLine[];
}

interface RawPair {
  from: IMember;
  to: IMember;
  items: Omit<ShareLine, 'isPaid'>[];
}

/**
 * Every directed debt implied by the expense list, gross per pair (each
 * expense is repaid to whoever fronted it — debts in opposite directions are
 * deliberately not netted off against each other).
 */
function buildRawPairs(group: Pick<IGroup, 'members' | 'expenses'>): RawPair[] {
  const pairs = new Map<string, RawPair>();

  group.expenses.forEach((expense, expenseIndex) => {
    if (expense.splitWith.length === 0) return;

    const shareAmount = expense.amount / expense.splitWith.length;
    const isRefund = shareAmount < 0;
    const payer = resolveMember(group.members, expense.paidBy);
    const others = expense.splitWith.filter((memberId) => memberId !== expense.paidBy);

    // A refund flips the direction: whoever collected it owes everyone a share.
    const debts = others.map((memberId) => {
      const other = resolveMember(group.members, memberId);

      return isRefund ? { from: payer, to: other } : { from: other, to: payer };
    });

    for (const { from, to } of debts) {
      const line = {
        expenseKey: expenseKeyOf(expense, expenseIndex),
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
      } else {
        pairs.set(key, { from, to, items: [line] });
      }
    }
  });

  return Array.from(pairs.values());
}

/**
 * Paid marks, migrating the two older shapes on read so nothing anyone ticked
 * is lost:
 *   - `paidSettlements`: a transferred amount per pair
 *   - `paidSettlementKeys`: legacy `from->to:cents` strings
 * Both only knew a total, so the amount is spent across that pair's shares
 * oldest first — the shares that existed when the money moved.
 */
export function readPaidShares(group: GroupLike): IPaidShare[] {
  if (group.paidShares && group.paidShares.length > 0) {
    return group.paidShares.map((record) => ({
      expenseKey: record.expenseKey,
      from: record.from,
      to: record.to,
      paidAt: record.paidAt,
    }));
  }

  const legacyAmounts = new Map<string, number>();

  for (const record of group.paidSettlements ?? []) {
    legacyAmounts.set(pairKey(record.from, record.to), record.amount);
  }

  for (const legacyKey of group.paidSettlementKeys ?? []) {
    const match = /^(.+)->(.+):(\d+)$/.exec(legacyKey);
    if (!match) continue;

    const [, from, to, cents] = match;
    const key = pairKey(from, to);
    if (!legacyAmounts.has(key)) legacyAmounts.set(key, Number(cents) / 100);
  }

  if (legacyAmounts.size === 0) return [];

  const migrated: IPaidShare[] = [];

  for (const pair of buildRawPairs(group)) {
    let remaining = legacyAmounts.get(pairKey(pair.from.id, pair.to.id)) ?? 0;
    if (remaining <= MONEY_EPSILON) continue;

    const oldestFirst = [...pair.items].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const item of oldestFirst) {
      if (item.amount > remaining + MONEY_EPSILON) continue;

      remaining -= item.amount;
      migrated.push({
        expenseKey: item.expenseKey,
        from: pair.from.id,
        to: pair.to.id,
        paidAt: new Date(0),
      });
    }
  }

  return migrated;
}

export function isSharePaid(
  paidShares: IPaidShare[],
  expenseKey: string,
  fromMemberId: string,
  toMemberId: string
) {
  return paidShares.some(
    (record) =>
      record.expenseKey === expenseKey &&
      record.from === fromMemberId &&
      record.to === toMemberId
  );
}

/** Marks one share paid, or clears it when it already is. */
export function togglePaidShare(
  paidShares: IPaidShare[],
  expenseKey: string,
  fromMemberId: string,
  toMemberId: string
): IPaidShare[] {
  if (isSharePaid(paidShares, expenseKey, fromMemberId, toMemberId)) {
    return paidShares.filter(
      (record) =>
        !(
          record.expenseKey === expenseKey &&
          record.from === fromMemberId &&
          record.to === toMemberId
        )
    );
  }

  return [
    ...paidShares,
    { expenseKey, from: fromMemberId, to: toMemberId, paidAt: new Date() },
  ];
}

/** Marks every share of one pair paid, or clears them all. */
export function setPairPaid(
  paidShares: IPaidShare[],
  pair: DebtPair,
  paid: boolean
): IPaidShare[] {
  const pairShareKeys = new Set(
    pair.items.map((item) => shareKey(item.expenseKey, pair.from.id, pair.to.id))
  );
  const others = paidShares.filter(
    (record) => !pairShareKeys.has(shareKey(record.expenseKey, record.from, record.to))
  );

  if (!paid) return others;

  return [
    ...others,
    ...pair.items.map((item) => ({
      expenseKey: item.expenseKey,
      from: pair.from.id,
      to: pair.to.id,
      paidAt: new Date(),
    })),
  ];
}

export function buildDebtPairs(group: GroupLike): DebtPair[] {
  const paidShares = readPaidShares(group);

  return buildRawPairs(group).map((pair) => {
    const items: ShareLine[] = pair.items
      .map((item) => ({
        ...item,
        isPaid: isSharePaid(paidShares, item.expenseKey, pair.from.id, pair.to.id),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = items.reduce((sum, item) => sum + item.amount, 0);
    const paidAmount = items
      .filter((item) => item.isPaid)
      .reduce((sum, item) => sum + item.amount, 0);
    const paidCount = items.filter((item) => item.isPaid).length;

    return {
      from: pair.from,
      to: pair.to,
      items,
      total,
      paidAmount,
      outstanding: Math.max(total - paidAmount, 0),
      paidCount,
      isSettled: items.length > 0 && paidCount === items.length,
      isPartiallyPaid: paidCount > 0 && paidCount < items.length,
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
  paidCount: number;
  settledPairCount: number;
}

function summarize(member: IMember, pairs: DebtPair[]): MemberDebtSummary {
  const sorted = [...pairs].sort((a, b) => b.outstanding - a.outstanding || b.total - a.total);
  const items = sorted.flatMap((pair) => pair.items);

  return {
    member,
    pairs: sorted,
    items,
    total: sorted.reduce((sum, pair) => sum + pair.total, 0),
    paidTotal: sorted.reduce((sum, pair) => sum + pair.paidAmount, 0),
    outstandingTotal: sorted.reduce((sum, pair) => sum + pair.outstanding, 0),
    paidCount: items.filter((item) => item.isPaid).length,
    settledPairCount: sorted.filter((pair) => pair.isSettled).length,
  };
}

/** Per member: what they have to pay out, grouped by payee. */
export function buildPayableSummaries(group: GroupLike): MemberDebtSummary[] {
  const pairs = buildDebtPairs(group);

  return group.members.map((member) =>
    summarize(
      member,
      pairs.filter((pair) => pair.from.id === member.id)
    )
  );
}

/** Per member: what they are owed, grouped by debtor. */
export function buildReceivableSummaries(group: GroupLike): MemberDebtSummary[] {
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

export interface MemberBalance {
  member: IMember;
  /** Total this member fronted for the group. */
  paid: number;
  /** Their own share of every expense they took part in. */
  share: number;
  /** Money already transferred out to / received from other members. */
  transferredOut: number;
  transferredIn: number;
  /** What is still owed to them (positive) or by them (negative). */
  net: number;
}

/**
 * Per-member position, net of transfers that already happened. Shared by the
 * home summary and the stats page so the two can never disagree.
 */
export function buildMemberBalances(group: GroupLike): MemberBalance[] {
  const pairs = buildDebtPairs(group);

  return group.members.map((member) => {
    let paid = 0;
    let share = 0;

    for (const expense of group.expenses) {
      if (expense.paidBy === member.id) paid += expense.amount;

      if (expense.splitWith.length > 0 && expense.splitWith.includes(member.id)) {
        share += expense.amount / expense.splitWith.length;
      }
    }

    const transferredOut = pairs
      .filter((pair) => pair.from.id === member.id)
      .reduce((sum, pair) => sum + pair.paidAmount, 0);
    const transferredIn = pairs
      .filter((pair) => pair.to.id === member.id)
      .reduce((sum, pair) => sum + pair.paidAmount, 0);

    return {
      member,
      paid,
      share,
      transferredOut,
      transferredIn,
      net: paid - share + transferredOut - transferredIn,
    };
  });
}

/**
 * Drops paid marks whose share no longer exists, so deleting an expense cannot
 * leave a mark behind that would resurface on a new one.
 */
export function prunePaidShares(group: GroupLike): IPaidShare[] {
  const live = new Set(
    buildRawPairs(group).flatMap((pair) =>
      pair.items.map((item) => shareKey(item.expenseKey, pair.from.id, pair.to.id))
    )
  );

  const seen = new Set<string>();

  return readPaidShares(group).filter((record) => {
    const key = shareKey(record.expenseKey, record.from, record.to);
    if (!live.has(key) || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}
