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
  category?: string;
}

export interface ISettlement {
  from: string;
  to: string;
  amount: number;
}

export interface IGroup {
  _id?: string;
  members: IMember[];
  expenses: IExpense[];
  paidSettlementKeys?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
});

const ExpenseSchema = new Schema<IExpense>({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paidBy: { type: String, required: true },
  splitWith: [{ type: String, required: true }],
  date: { type: Date, default: Date.now },
  category: { type: String },
});

const GroupSchema = new Schema<IGroup>(
  {
    members: [MemberSchema],
    expenses: [ExpenseSchema],
    paidSettlementKeys: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const Group = models.Group || model<IGroup>('Group', GroupSchema);
