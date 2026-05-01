import { IExpense, IMember, ISettlement } from '@/models/Group';

export interface Balance {
  [memberId: string]: number;
}

export function calculateBalances(expenses: IExpense[], members: IMember[]): Balance {
  const balances: Balance = {};
  
  members.forEach(member => {
    balances[member.id] = 0;
  });

  expenses.forEach(expense => {
    const splitAmount = expense.amount / expense.splitWith.length;
    
    balances[expense.paidBy] += expense.amount;
    
    expense.splitWith.forEach(memberId => {
      balances[memberId] -= splitAmount;
    });
  });

  return balances;
}

export function calculateSettlements(balances: Balance): ISettlement[] {
  const settlements: ISettlement[] = [];
  
  const creditors = Object.entries(balances)
    .filter(([, amount]) => amount > 0.01)
    .sort(([, a], [, b]) => b - a);
  
  const debtors = Object.entries(balances)
    .filter(([, amount]) => amount < -0.01)
    .sort(([, a], [, b]) => a - b);

  const creditorsMap = new Map(creditors);
  const debtorsMap = new Map(debtors);

  for (const [debtor, debtAmount] of debtorsMap) {
    let remainingDebt = Math.abs(debtAmount);
    
    for (const [creditor, creditAmount] of creditorsMap) {
      if (remainingDebt < 0.01 || creditAmount < 0.01) continue;
      
      const settlementAmount = Math.min(remainingDebt, creditAmount);
      
      if (settlementAmount > 0.01) {
        settlements.push({
          from: debtor,
          to: creditor,
          amount: Math.round(settlementAmount * 100) / 100,
        });
        
        creditorsMap.set(creditor, creditAmount - settlementAmount);
        remainingDebt -= settlementAmount;
      }
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
    
    if (expense.splitWith.includes(memberId)) {
      totalOwed += expense.amount / expense.splitWith.length;
    }
  });

  return {
    totalPaid,
    totalOwed,
    netBalance: totalPaid - totalOwed,
  };
}
