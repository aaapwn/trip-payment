import { IExpense, IMember, ISettlement } from '@/models/Group';
import { MONEY_EPSILON } from '@/lib/settlements';

export interface Balance {
  [memberId: string]: number;
}

const round2 = (amount: number) => Math.round(amount * 100) / 100;

export function calculateBalances(expenses: IExpense[], members: IMember[]): Balance {
  const balances: Balance = {};

  members.forEach(member => {
    balances[member.id] = 0;
  });

  expenses.forEach(expense => {
    if (expense.splitWith.length === 0) return;

    const splitAmount = expense.amount / expense.splitWith.length;

    // Ids that are not in `members` still have to be accounted for, otherwise
    // every balance in the group turns into NaN.
    balances[expense.paidBy] = (balances[expense.paidBy] ?? 0) + expense.amount;

    expense.splitWith.forEach(memberId => {
      balances[memberId] = (balances[memberId] ?? 0) - splitAmount;
    });
  });

  return balances;
}

export function calculateSettlements(balances: Balance): ISettlement[] {
  const settlements: ISettlement[] = [];

  const creditors = Object.entries(balances)
    .filter(([, amount]) => amount > MONEY_EPSILON)
    .sort(([, a], [, b]) => b - a);

  const debtors = Object.entries(balances)
    .filter(([, amount]) => amount < -MONEY_EPSILON)
    .sort(([, a], [, b]) => a - b);

  const creditorsMap = new Map(creditors);

  for (const [debtor, debtAmount] of debtors) {
    let remainingDebt = Math.abs(debtAmount);

    for (const [creditor, creditAmount] of creditorsMap) {
      if (remainingDebt < MONEY_EPSILON) break;
      if (creditAmount < MONEY_EPSILON) continue;

      // Round first, then settle the rounded amount on both sides, so the
      // transfers always add up to the balances instead of drifting.
      const settlementAmount = round2(Math.min(remainingDebt, creditAmount));

      if (settlementAmount < MONEY_EPSILON) continue;

      settlements.push({ from: debtor, to: creditor, amount: settlementAmount });
      creditorsMap.set(creditor, creditAmount - settlementAmount);
      remainingDebt -= settlementAmount;
    }
  }

  return settlements;
}

export function getMemberStats(
  expenses: IExpense[],
  memberId: string
): {
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
} {
  let totalPaid = 0;
  let totalOwed = 0;

  expenses.forEach(expense => {
    if (expense.paidBy === memberId) {
      totalPaid += expense.amount;
    }

    if (expense.splitWith.length > 0 && expense.splitWith.includes(memberId)) {
      totalOwed += expense.amount / expense.splitWith.length;
    }
  });

  return {
    totalPaid,
    totalOwed,
    netBalance: totalPaid - totalOwed,
  };
}
