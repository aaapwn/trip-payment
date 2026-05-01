'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IGroup, IMember, ISettlement } from '@/models/Group';
import { calculateBalances, calculateSettlements } from '@/lib/calculations';

interface SettlementGroup {
  member: IMember;
  total: number;
  settlements: Array<ISettlement & { toMember: IMember }>;
}

export default function SettlementsPage() {
  const [group, setGroup] = useState<IGroup | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGroup = useCallback(async () => {
    try {
      const response = await fetch('/api/group');
      const data = await response.json();

      if (response.ok) {
        setGroup(data);
      }
    } catch (error) {
      console.error('Failed to fetch group:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGroup();
  }, [fetchGroup]);

  const settlementGroups = useMemo<SettlementGroup[]>(() => {
    if (!group) return [];

    const balances = calculateBalances(group.expenses, group.members);
    const settlements = calculateSettlements(balances);

    return group.members
      .map((member) => {
        const memberSettlements = settlements
          .filter((settlement) => settlement.from === member.id)
          .map((settlement) => {
            const toMember = group.members.find((item) => item.id === settlement.to);
            return toMember ? { ...settlement, toMember } : null;
          })
          .filter(Boolean) as Array<ISettlement & { toMember: IMember }>;

        return {
          member,
          settlements: memberSettlements,
          total: memberSettlements.reduce((sum, settlement) => sum + settlement.amount, 0),
        };
      })
      .filter((item) => item.settlements.length > 0)
      .sort((a, b) => b.total - a.total);
  }, [group]);

  const totalTransfers = settlementGroups.reduce(
    (sum, item) => sum + item.settlements.length,
    0
  );
  const totalAmount = settlementGroups.reduce((sum, item) => sum + item.total, 0);

  if (loading || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4 animate-pulse">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-5">
          <Link href="/">
            <Button variant="ghost" size="sm" className="-ml-2 mb-3 min-h-10 gap-2">
              <ArrowLeft className="w-4 h-4" />
              รายการ
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif tracking-tight text-foreground">
                สรุปโอนเงิน
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {totalTransfers} รายการโอน · รวม ฿
                {totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-5 pb-24 sm:px-6 sm:py-8">
        {settlementGroups.length === 0 ? (
          <Card className="p-6 text-center sm:p-12">
            <p className="text-sm text-muted-foreground">
              ตอนนี้ยังไม่มีใครต้องโอนเงินให้ใคร
            </p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {settlementGroups.map((groupItem) => (
              <Card
                key={groupItem.member.id}
                className="p-4"
                style={{ borderLeft: `4px solid ${groupItem.member.color}` }}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge
                      variant="secondary"
                      className="max-w-full truncate px-3 py-1.5 text-sm font-medium"
                      style={{
                        backgroundColor: `${groupItem.member.color}15`,
                        color: groupItem.member.color,
                        borderColor: `${groupItem.member.color}30`,
                      }}
                    >
                      {groupItem.member.name}
                    </Badge>
                    <p className="mt-2 text-sm text-muted-foreground">ต้องโอนทั้งหมด</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-2xl font-serif leading-none text-foreground">
                      ฿{groupItem.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {groupItem.settlements.length} รายการ
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {groupItem.settlements.map((settlement) => (
                    <div
                      key={`${settlement.from}-${settlement.to}`}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg bg-muted/35 px-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="shrink-0 text-sm text-muted-foreground">โอนให้</span>
                        <Badge
                          variant="secondary"
                          className="min-w-0 max-w-full truncate font-normal"
                          style={{
                            backgroundColor: `${settlement.toMember.color}15`,
                            color: settlement.toMember.color,
                            borderColor: `${settlement.toMember.color}30`,
                          }}
                        >
                          {settlement.toMember.name}
                        </Badge>
                      </div>
                      <div className="font-serif text-lg leading-none text-foreground">
                        ฿{settlement.amount.toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="mx-auto max-w-4xl">
          <Link href="/">
            <Button variant="outline" className="h-11 w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              กลับไปรายการ
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
