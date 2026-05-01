'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IGroup, IMember } from '@/models/Group';

interface ShareLine {
  expenseIndex: number;
  description: string;
  date: Date;
  paidByMember: IMember;
  amount: number;
  totalAmount: number;
}

interface MemberShareSummary {
  member: IMember;
  total: number;
  items: ShareLine[];
}

export default function SettlementsPage() {
  const [group, setGroup] = useState<IGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

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

  const memberSummaries = useMemo<MemberShareSummary[]>(() => {
    if (!group) return [];

    return group.members
      .map((member) => {
        const items = group.expenses
          .map((expense, expenseIndex) => {
            const paidByMember = group.members.find((item) => item.id === expense.paidBy);

            if (
              !paidByMember ||
              expense.paidBy === member.id ||
              !expense.splitWith.includes(member.id)
            ) {
              return null;
            }

            return {
              expenseIndex,
              description: expense.description,
              date: expense.date,
              paidByMember,
              amount: expense.amount / expense.splitWith.length,
              totalAmount: expense.amount,
            };
          })
          .filter(Boolean) as ShareLine[];

        return {
          member,
          items: items.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ),
          total: items.reduce((sum, item) => sum + item.amount, 0),
        };
      });
  }, [group]);

  const selectedSummary =
    memberSummaries.find((item) => item.member.id === selectedMemberId) ??
    memberSummaries[0];
  const totalItems = memberSummaries.reduce((sum, item) => sum + item.items.length, 0);

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
                แยกตามคน · {totalItems} รายการที่ต้องจ่ายคืน
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-5 pb-24 sm:px-6 sm:py-8">
        {memberSummaries.length === 0 ? (
          <Card className="p-6 text-center sm:p-12">
            <p className="text-sm text-muted-foreground">
              ยังไม่มีข้อมูลสมาชิก
            </p>
          </Card>
        ) : selectedSummary ? (
          <div className="space-y-4">
            <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              <div className="flex min-w-max gap-2">
                {memberSummaries.map((summary) => {
                  const isSelected = summary.member.id === selectedSummary.member.id;

                  return (
                    <button
                      key={summary.member.id}
                      type="button"
                      onClick={() => setSelectedMemberId(summary.member.id)}
                      className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground hover:bg-muted'
                      }`}
                    >
                      <span>{summary.member.name}</span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-xs ${
                          isSelected
                            ? 'bg-primary-foreground/15 text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {summary.items.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Card
              className="p-4"
              style={{ borderTop: `4px solid ${selectedSummary.member.color}` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Badge
                    variant="secondary"
                    className="max-w-full truncate px-3 py-1.5 text-sm font-medium"
                    style={{
                      backgroundColor: `${selectedSummary.member.color}15`,
                      color: selectedSummary.member.color,
                      borderColor: `${selectedSummary.member.color}30`,
                    }}
                  >
                    {selectedSummary.member.name}
                  </Badge>
                  <p className="mt-2 text-sm text-muted-foreground">
                    รายการที่ร่วมหารและต้องจ่ายคืน
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-2xl font-serif leading-none text-foreground">
                    ฿{selectedSummary.total.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedSummary.items.length} รายการ
                  </p>
                </div>
              </div>
            </Card>

            {selectedSummary.items.length === 0 ? (
              <Card className="p-6 text-center sm:p-10">
                <p className="text-sm text-muted-foreground">
                  คนนี้ยังไม่มีรายการที่ต้องจ่ายคืนใคร
                </p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {selectedSummary.items.map((item) => (
                  <Card key={item.expenseIndex} className="p-3 sm:p-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                      <div className="min-w-0">
                        <h2 className="break-words text-base font-medium leading-snug text-foreground">
                          {item.description}
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {format(new Date(item.date), 'd MMMM yyyy', { locale: th })} · ยอดรายการ ฿
                          {item.totalAmount.toLocaleString('th-TH')}
                        </p>
                        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="shrink-0 text-sm text-muted-foreground">จ่ายให้</span>
                          <Badge
                            variant="secondary"
                            className="min-w-0 max-w-full truncate font-normal"
                            style={{
                              backgroundColor: `${item.paidByMember.color}15`,
                              color: item.paidByMember.color,
                              borderColor: `${item.paidByMember.color}30`,
                            }}
                          >
                            {item.paidByMember.name}
                          </Badge>
                        </div>
                      </div>
                      <div className="border-t border-border/60 pt-2 text-left sm:border-0 sm:pt-0 sm:text-right">
                        <div className="text-xs text-muted-foreground">ต้องจ่าย</div>
                        <div className="text-2xl font-serif leading-none text-foreground">
                          ฿{item.amount.toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Card className="p-6 text-center sm:p-12">
            <p className="text-sm text-muted-foreground">ไม่พบข้อมูลสรุป</p>
          </Card>
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
