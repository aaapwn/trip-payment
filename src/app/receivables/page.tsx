'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, UserRoundSearch, Users } from 'lucide-react';
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
  amount: number;
  totalAmount: number;
}

interface DebtorGroup {
  member: IMember;
  total: number;
  items: ShareLine[];
}

interface ReceivableSummary {
  member: IMember;
  total: number;
  receivedTotal: number;
  outstandingTotal: number;
  paidCount: number;
  debtors: DebtorGroup[];
}

const formatCurrency = (amount: number) =>
  `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

const getPaymentKey = (fromMemberId: string, toMemberId: string, amount: number) =>
  `${fromMemberId}->${toMemberId}:${Math.round(amount * 100)}`;

export default function ReceivablesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  const paidSettlementKeys = useMemo(
    () => group?.paidSettlementKeys ?? [],
    [group?.paidSettlementKeys]
  );

  const receivableSummaries = useMemo<ReceivableSummary[]>(() => {
    if (!group) return [];

    return group.members
      .map((receiver) => {
        const debtorMap = new Map<string, DebtorGroup>();

        group.members.forEach((payer) => {
          group.expenses.forEach((expense, expenseIndex) => {
            const paidByMember = group.members.find((item) => item.id === expense.paidBy);
            const shareAmount = expense.amount / expense.splitWith.length;
            const isRefund = shareAmount < 0;
            const shouldPay = isRefund
              ? expense.paidBy === payer.id
              : expense.paidBy !== payer.id && expense.splitWith.includes(payer.id);

            if (!paidByMember || !shouldPay) return;

            const payeeMembers: IMember[] = isRefund
              ? expense.splitWith
                  .filter((memberId) => memberId !== expense.paidBy)
                  .map((memberId) => group.members.find((item) => item.id === memberId))
                  .filter((item): item is IMember => Boolean(item))
              : [paidByMember];

            if (!payeeMembers.some((payee) => payee.id === receiver.id)) return;

            const line: ShareLine = {
              expenseIndex,
              description: expense.description,
              date: expense.date,
              amount: Math.abs(shareAmount),
              totalAmount: expense.amount,
            };

            const existingDebtor = debtorMap.get(payer.id);
            if (existingDebtor) {
              existingDebtor.items.push(line);
              existingDebtor.total += line.amount;
            } else {
              debtorMap.set(payer.id, {
                member: payer,
                total: line.amount,
                items: [line],
              });
            }
          });
        });

        const debtors = Array.from(debtorMap.values())
          .map((debtor) => ({
            ...debtor,
            items: debtor.items.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
          }))
          .sort((a, b) => b.total - a.total);

        const paidCount = debtors.filter((debtor) =>
          paidSettlementKeys.includes(getPaymentKey(debtor.member.id, receiver.id, debtor.total))
        ).length;
        const total = debtors.reduce((sum, debtor) => sum + debtor.total, 0);
        const receivedTotal = debtors.reduce((sum, debtor) => {
          const isPaid = paidSettlementKeys.includes(
            getPaymentKey(debtor.member.id, receiver.id, debtor.total)
          );
          return sum + (isPaid ? debtor.total : 0);
        }, 0);

        return {
          member: receiver,
          total,
          receivedTotal,
          outstandingTotal: total - receivedTotal,
          paidCount,
          debtors,
        };
      })
      .filter((summary) => summary.debtors.length > 0);
  }, [group, paidSettlementKeys]);

  const memberIdFromQuery = searchParams.get('memberId');
  const selectedSummary =
    receivableSummaries.find((item) => item.member.id === selectedMemberId) ??
    receivableSummaries.find((item) => item.member.id === memberIdFromQuery) ??
    receivableSummaries[0];

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
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/settlements">
            <Button variant="ghost" size="sm" className="-ml-2 mb-2 min-h-9 gap-2">
              <ArrowLeft className="w-4 h-4" />
              สรุปโอน
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-serif leading-none tracking-tight text-foreground sm:text-3xl">
                เงินที่ต้องได้รับ
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                เช็กว่าใครโอนคืนครบแล้ว
              </p>
            </div>
            <Link
              href={`/receivables/select${selectedSummary ? `?memberId=${selectedSummary.member.id}` : ''}`}
            >
              <Button variant="outline" className="h-9 gap-2 px-3">
                <UserRoundSearch className="h-4 w-4" />
                เลือกคน
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-3 py-3 pb-20 sm:px-6 sm:py-5">
        {receivableSummaries.length === 0 ? (
          <Card className="p-6 text-center sm:p-12">
            <p className="text-sm text-muted-foreground">ยังไม่มีรายการที่ต้องได้รับเงินคืน</p>
          </Card>
        ) : selectedSummary ? (
          <div className="space-y-3">
            <div className="-mx-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
              <div className="flex min-w-max gap-1.5">
                {receivableSummaries.map((summary) => {
                  const isSelected = summary.member.id === selectedSummary.member.id;
                  return (
                    <button
                      key={summary.member.id}
                      type="button"
                      onClick={() => {
                        setSelectedMemberId(summary.member.id);
                        router.replace(`${pathname}?memberId=${summary.member.id}`, {
                          scroll: false,
                        });
                      }}
                      className={`flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors ${
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
                        {summary.debtors.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="rounded-lg bg-card px-3 py-2.5 ring-1 ring-border/70"
              style={{ borderTop: `4px solid ${selectedSummary.member.color}` }}
            >
              <div className="grid gap-3 sm:flex sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Badge
                    variant="secondary"
                    className="h-5 max-w-full truncate px-2 text-xs font-medium"
                    style={{
                      backgroundColor: `${selectedSummary.member.color}15`,
                      color: selectedSummary.member.color,
                      borderColor: `${selectedSummary.member.color}30`,
                    }}
                  >
                    {selectedSummary.member.name}
                  </Badge>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    ได้รับแล้ว {formatCurrency(selectedSummary.receivedTotal)} /{' '}
                    {formatCurrency(selectedSummary.total)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xl font-serif leading-none text-foreground sm:text-2xl">
                    ค้างรับ {formatCurrency(selectedSummary.outstandingTotal)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedSummary.paidCount}/{selectedSummary.debtors.length} คนโอนแล้ว
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {selectedSummary.debtors.map((debtor) => {
                const paymentKey = getPaymentKey(
                  debtor.member.id,
                  selectedSummary.member.id,
                  debtor.total
                );
                const isPaid = paidSettlementKeys.includes(paymentKey);

                return (
                  <Card
                    key={debtor.member.id}
                    className={`rounded-lg p-3 transition-colors ${
                      isPaid ? 'bg-accent/5 ring-1 ring-accent/20' : ''
                    }`}
                  >
                    <div className="mb-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <span className="shrink-0 text-xs text-muted-foreground">รอจาก</span>
                          <Badge
                            variant="secondary"
                            className="h-5 min-w-0 max-w-full truncate px-2 text-xs font-medium"
                            style={{
                              backgroundColor: `${debtor.member.color}15`,
                              color: debtor.member.color,
                              borderColor: `${debtor.member.color}30`,
                            }}
                          >
                            {debtor.member.name}
                          </Badge>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {selectedSummary.member.name}
                          </span>
                        </div>
                        <div className="mt-1.5">
                          {isPaid ? (
                            <Badge
                              variant="secondary"
                              className="h-5 gap-1 bg-accent/10 px-2 text-xs font-medium text-accent"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              โอนแล้ว
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="h-5 gap-1 bg-amber-500/10 px-2 text-xs font-medium text-amber-700"
                            >
                              <Clock3 className="h-3 w-3" />
                              ยังไม่โอน
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs text-muted-foreground">รวม</div>
                        <div className="text-xl font-serif leading-none text-foreground sm:text-2xl">
                          {formatCurrency(debtor.total)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 border-t border-border/60 pt-2.5">
                      {debtor.items.map((item) => (
                        <div
                          key={item.expenseIndex}
                          className="grid grid-cols-[1fr_auto] gap-3 rounded-md bg-muted/35 px-2.5 py-2"
                        >
                          <div className="min-w-0">
                            <div className="break-words text-sm font-medium leading-snug text-foreground">
                              {item.description}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {format(new Date(item.date), 'd MMM yyyy', { locale: th })} · ยอดรายการ{' '}
                              {formatCurrency(Math.abs(item.totalAmount))}
                            </div>
                          </div>
                          <div className="shrink-0 text-right font-serif text-base leading-none text-foreground sm:text-lg">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <Card className="p-6 text-center sm:p-12">
            <p className="text-sm text-muted-foreground">ไม่พบข้อมูลสรุป</p>
          </Card>
        )}
      </main>
    </div>
  );
}
