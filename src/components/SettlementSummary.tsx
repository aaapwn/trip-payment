'use client';

import { IMember, IExpense } from '@/models/Group';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { calculateBalances, calculateSettlements } from '@/lib/calculations';

interface SettlementSummaryProps {
  expenses: IExpense[];
  members: IMember[];
}

export function SettlementSummary({ expenses, members }: SettlementSummaryProps) {
  const balances = calculateBalances(expenses, members);
  const settlements = calculateSettlements(balances);

  const getMemberById = (id: string) => members.find(m => m.id === id);

  if (settlements.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-serif text-foreground mb-6">สรุปการชำระเงิน</h2>
        <Card className="p-6 text-center sm:p-12">
          <p className="text-muted-foreground text-sm">
            ยังไม่มีรายการค่าใช้จ่าย จึงยังไม่มีการชำระเงิน
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-serif text-foreground mb-6">สรุปการชำระเงิน</h2>
      
      <div className="space-y-4">
        {settlements.map((settlement, index) => {
          const fromMember = getMemberById(settlement.from);
          const toMember = getMemberById(settlement.to);

          if (!fromMember || !toMember) return null;

          return (
            <Card
              key={index}
              className="border-l-4 p-4 transition-all duration-200 hover:shadow-md sm:p-6"
              style={{
                borderLeftColor: fromMember.color,
              }}
            >
              <div className="grid gap-3 sm:flex sm:items-center sm:gap-4">
                <Badge
                  variant="secondary"
                  className="w-fit max-w-full truncate px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: `${fromMember.color}15`,
                    color: fromMember.color,
                    borderColor: `${fromMember.color}30`,
                  }}
                >
                  {fromMember.name}
                </Badge>

                <div className="flex items-center gap-3 sm:flex-1">
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">โอนให้</div>
                </div>

                <Badge
                  variant="secondary"
                  className="w-fit max-w-full truncate px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: `${toMember.color}15`,
                    color: toMember.color,
                    borderColor: `${toMember.color}30`,
                  }}
                >
                  {toMember.name}
                </Badge>

                <div className="break-words border-t border-border/60 pt-3 text-2xl font-serif text-foreground sm:ml-4 sm:border-0 sm:pt-0">
                  ฿{settlement.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 bg-muted/30 p-4 border-dashed sm:p-6">
        <p className="text-sm text-muted-foreground text-center">
          ทั้งหมด {settlements.length} รายการโอน · 
          การคำนวณใช้วิธีลดจำนวนการโอนให้น้อยที่สุด
        </p>
      </Card>
    </div>
  );
}
