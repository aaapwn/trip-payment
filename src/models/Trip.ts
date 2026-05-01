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

export interface ITrip {
  _id?: string;
  name: string;
  members: IMember[];
  expenses: IExpense[];
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

const TripSchema = new Schema<ITrip>(
  {
    name: { type: String, required: true },
    members: [MemberSchema],
    expenses: [ExpenseSchema],
  },
  {
    timestamps: true,
  }
);

export const Trip = models.Trip || model<ITrip>('Trip', TripSchema);
