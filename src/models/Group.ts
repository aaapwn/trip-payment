import { Schema, model, models } from 'mongoose';

export interface IMember {
  id: string;
  name: string;
  color: string;
}

export interface IExpense {
  _id?: string;
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
 * How much of a directed debt (from -> to) has already been transferred.
 * Amount-based on purpose: adding an expense afterwards must not silently
 * discard the fact that money already changed hands.
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
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paidBy: { type: String, required: true },
  splitWith: [{ type: String, required: true }],
  date: { type: Date, default: Date.now },
});

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
    paidSettlements: [PaidSettlementSchema],
    paidSettlementKeys: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const Group = models.Group || model<IGroup>('Group', GroupSchema);
