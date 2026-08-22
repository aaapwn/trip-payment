'use client';

import { IMember, IExpense } from '@/models/Group';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { MemberChip } from '@/components/MemberChip';
import { Money } from '@/components/Money';
import { EmptyState } from '@/components/StateCard';
import { calculateBalances, calculateSettlements } from '@/lib/calculations';
import { resolveMember } from '@/lib/settlements';

interface SettlementSummaryProps {
  expenses: IExpense[];
  members: IMember[];
}

/**
 * Netted view: the fewest transfers that clear everyone. Not used by the main
 * screens, which deliberately show gross per-pair debts instead.
 */
export function SettlementSummary({ expenses, members }: SettlementSummaryProps) {
  const settlements = calculateSettlements(calculateBalances(expenses, members));

  return (
    <section>
      <h2 className="mb-3 font-serif text-lg text-foreground">สรุปการโอนแบบหักลบ</h2>

      {settlements.length === 0 ? (
        <EmptyState title="ยังไม่มีรายการที่ต้องโอน" description="ทุกคนเคลียร์กันเรียบร้อยแล้ว" />
      ) : (
        <>
          <Card className="divide-y divide-border/60 overflow-hidden p-0">
            {settlements.map((settlement, index) => (
              <div
                key={`${settlement.from}-${settlement.to}-${index}`}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <MemberChip member={resolveMember(members, settlement.from)} />
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  <MemberChip member={resolveMember(members, settlement.to)} />
                </div>
                <Money value={settlement.amount} size="md" />
              </div>
            ))}
          </Card>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            {settlements.length} รายการโอน · หักลบหนี้สองทางให้เหลือรอบน้อยที่สุด
          </p>
        </>
      )}
    </section>
  );
}
