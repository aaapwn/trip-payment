'use client';

import { IMember, IExpense } from '@/models/Group';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface ExpenseListProps {
  expenses: IExpense[];
  members: IMember[];
  onDelete: (index: number) => void;
}

export function ExpenseList({ expenses, members, onDelete }: ExpenseListProps) {
  const getMemberById = (id: string) => members.find(m => m.id === id);

  if (expenses.length === 0) {
    return (
      <Card className="p-6 text-center sm:p-12">
        <p className="text-muted-foreground text-sm">
          ยังไม่มีรายการค่าใช้จ่าย เริ่มเพิ่มรายการแรกกันเลย
        </p>
      </Card>
    );
  }

  const sortedExpenses = expenses
    .map((expense, originalIndex) => ({ expense, originalIndex }))
    .sort(
      (a, b) => new Date(b.expense.date).getTime() - new Date(a.expense.date).getTime()
    );

  return (
    <div className="space-y-2.5">
      {sortedExpenses.map(({ expense, originalIndex }) => {
        const paidByMember = getMemberById(expense.paidBy);
        const splitMembers = expense.splitWith.map(getMemberById).filter(Boolean) as IMember[];
        const amountPerPerson = expense.amount / expense.splitWith.length;

        return (
          <Card
            key={originalIndex}
            className="group p-3 transition-all duration-200 hover:shadow-md sm:p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="mb-2 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-base font-medium leading-snug text-foreground">
                      {expense.description}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {format(new Date(expense.date), 'd MMMM yyyy', { locale: th })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(originalIndex)}
                    className="-mr-2 -mt-1 min-h-11 min-w-11 transition-opacity sm:min-h-7 sm:min-w-7 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid gap-2 text-sm sm:flex sm:items-center sm:gap-4">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="shrink-0 text-muted-foreground">จ่ายโดย</span>
                    {paidByMember && (
                      <Badge
                        variant="secondary"
                        className="min-w-0 max-w-full truncate font-normal"
                        style={{
                          backgroundColor: `${paidByMember.color}15`,
                          color: paidByMember.color,
                          borderColor: `${paidByMember.color}30`,
                        }}
                      >
                        {paidByMember.name}
                      </Badge>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="shrink-0 text-muted-foreground">แชร์กับ</span>
                    <div className="flex min-w-0 flex-wrap gap-1">
                      {splitMembers.map((member) => (
                        <Badge
                          key={member.id}
                          variant="outline"
                          className="max-w-full truncate font-normal text-xs"
                          style={{
                            borderColor: `${member.color}30`,
                            color: member.color,
                          }}
                        >
                          {member.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  ฿{amountPerPerson.toLocaleString('th-TH', { minimumFractionDigits: 2 })} / คน
                </div>
              </div>

              <div className="shrink-0 border-t border-border/60 pt-2 text-left sm:border-0 sm:pt-0 sm:text-right">
                <div className="break-words text-2xl font-serif leading-none text-foreground">
                  ฿{expense.amount.toLocaleString('th-TH')}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
