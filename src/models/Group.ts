import { Schema, model, models } from 'mongoose';

export interface IMember {
  id: string;
  name: string;
  color: string;
}

export interface IExpense {
  _id?: string;
  /**
   * Stable client-generated id. Array position cannot identify an expense —
   * deleting an earlier one shifts every index — and paid marks point at
   * individual expenses, so they need something that survives edits.
   */
  key?: string;
  description: string;
  amount: number;
  paidBy: string;
  splitWith: string[];
  date: Date;
}

export interface ISettlement {
  from: string;
  to: string;
  amount: number;
}

/**
 * One settled share: `from` has paid `to` back for their part of one expense.
 * Per expense rather than per person, so paying for what exists today is not
 * disturbed by an expense added tomorrow.
 */
export interface IPaidShare {
  expenseKey: string;
  from: string;
  to: string;
  paidAt: Date;
}

/**
 * @deprecated Per-pair transferred amount, superseded by `paidShares`.
 * Still read so existing marks survive; migrated on the next write.
 */
export interface IPaidSettlement {
  from: string;
  to: string;
  amount: number;
  paidAt: Date;
}

export interface IGroup {
  _id?: string;
  members: IMember[];
  expenses: IExpense[];
  paidShares?: IPaidShare[];
  /** @deprecated per-pair amounts, migrated on read. */
  paidSettlements?: IPaidSettlement[];
  /** @deprecated legacy `from->to:cents` keys, migrated on read. */
  paidSettlementKeys?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
  },
  { _id: false }
);

const ExpenseSchema = new Schema<IExpense>({
  key: { type: String },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paidBy: { type: String, required: true },
  splitWith: [{ type: String, required: true }],
  date: { type: Date, default: Date.now },
});

const PaidShareSchema = new Schema<IPaidShare>(
  {
    expenseKey: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    paidAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PaidSettlementSchema = new Schema<IPaidSettlement>(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    amount: { type: Number, required: true },
    paidAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GroupSchema = new Schema<IGroup>(
  {
    members: [MemberSchema],
    expenses: [ExpenseSchema],
    paidShares: [PaidShareSchema],
    paidSettlements: [PaidSettlementSchema],
    paidSettlementKeys: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const Group = models.Group || model<IGroup>('Group', GroupSchema);
