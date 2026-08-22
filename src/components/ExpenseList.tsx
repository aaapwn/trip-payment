'use client';

import { IMember, IExpense } from '@/models/Group';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Undo2 } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { MemberChip } from '@/components/MemberChip';
import { Money } from '@/components/Money';
import { resolveMember } from '@/lib/settlements';

interface ExpenseListProps {
  expenses: IExpense[];
  members: IMember[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export function ExpenseList({ expenses, members, onEdit, onDelete }: ExpenseListProps) {
  const sortedExpenses = expenses
    .map((expense, originalIndex) => ({ expense, originalIndex }))
    .sort((a, b) => new Date(b.expense.date).getTime() - new Date(a.expense.date).getTime());

  return (
    <Card className="divide-y divide-border/60 overflow-hidden p-0">
      {sortedExpenses.map(({ expense, originalIndex }) => {
        const paidByMember = resolveMember(members, expense.paidBy);
        const isRefund = expense.amount < 0;
        const shareCount = expense.splitWith.length;
        const amountPerPerson = shareCount > 0 ? Math.abs(expense.amount) / shareCount : 0;

        return (
          <div
            key={originalIndex}
            className="group grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-1.5 px-3 py-3 transition-colors hover:bg-muted/40 sm:px-4"
          >
            <div className="flex min-w-0 items-center gap-1.5">
              {isRefund && (
                <Undo2 className="size-3.5 shrink-0 text-positive" aria-label="เงินคืน" />
              )}
              <h3 className="truncate font-medium leading-snug text-foreground">
                {expense.description}
              </h3>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Money
                value={Math.abs(expense.amount)}
                size="md"
                tone={isRefund ? 'positive' : 'default'}
              />
              <div className="-mr-1.5 flex items-center transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(originalIndex)}
                  className="size-8 p-0 text-muted-foreground hover:text-foreground"
                  aria-label={`แก้ไข ${expense.description}`}
                  title="แก้ไข"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(originalIndex)}
                  className="size-8 p-0 text-muted-foreground hover:text-destructive"
                  aria-label={`ลบ ${expense.description}`}
                  title="ลบ"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {/* Meta spans the full width so it never wraps around the amount. */}
            <div className="col-span-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                <span className="tabular">
                  {format(new Date(expense.date), 'd MMM yy', { locale: th })}
                </span>
                <span aria-hidden>·</span>
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  {isRefund ? 'คืนโดย' : 'จ่ายโดย'}
                  <MemberChip member={paidByMember} />
                </span>
              </div>
              <span className="shrink-0 tabular">
                ฿{amountPerPerson.toLocaleString('th-TH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                × {shareCount}
              </span>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
