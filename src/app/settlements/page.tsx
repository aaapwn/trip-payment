'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  UserRoundSearch,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { IGroup } from '@/models/Group';
import { fetchGroup as fetchGroupRequest, saveGroup } from '@/lib/api';
import {
  buildPayableSummaries,
  formatCurrency,
  pairKey,
  readPaidSettlements,
  togglePaidSettlement,
} from '@/lib/settlements';

export default function SettlementsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [group, setGroup] = useState<IGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [savingPairKey, setSavingPairKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    try {
      setGroup(await fetchGroupRequest());
    } catch (error) {
      console.error('Failed to fetch group:', error);
      setErrorMessage('โหลดข้อมูลไม่สำเร็จ กรุณารีเฟรชหน้า');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGroup();
  }, [fetchGroup]);

  const memberSummaries = useMemo(
    () => (group ? buildPayableSummaries(group) : []),
    [group]
  );

  const memberIdFromQuery = searchParams.get('memberId');
  const selectedSummary =
    memberSummaries.find((item) => item.member.id === selectedMemberId) ??
    memberSummaries.find((item) => item.member.id === memberIdFromQuery) ??
    memberSummaries[0];
  const totalItems = memberSummaries.reduce((sum, item) => sum + item.items.length, 0);

  const togglePayment = async (fromMemberId: string, toMemberId: string, total: number) => {
    if (!group || savingPairKey) return;

    const key = pairKey(fromMemberId, toMemberId);
    const nextPaidSettlements = togglePaidSettlement(
      readPaidSettlements(group),
      fromMemberId,
      toMemberId,
      total
    );

    setSavingPairKey(key);
    setErrorMessage(null);

    const result = await saveGroup({ paidSettlements: nextPaidSettlements }, group.updatedAt);

    if (result.ok) {
      setGroup(result.group);
    } else {
      setErrorMessage(result.error);

      if (result.conflict) {
        if (result.group) {
          setGroup(result.group);
        } else {
          await fetchGroup();
        }
      }
    }

    setSavingPairKey(null);
  };

  if (loading || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4 animate-pulse">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {errorMessage ?? 'กำลังโหลด...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="-ml-2 mb-2 min-h-9 gap-2">
              <ArrowLeft className="w-4 h-4" />
              รายการ
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-serif leading-none tracking-tight text-foreground sm:text-3xl">
                สรุปโอนเงิน
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                แยกตามคน · {totalItems} รายการที่ต้องจ่ายคืน
              </p>
            </div>
            <Link
              href={`/settlements/select${
                selectedSummary ? `?memberId=${selectedSummary.member.id}` : ''
              }`}
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
        {errorMessage && (
          <div
            role="alert"
            className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0">{errorMessage}</span>
          </div>
        )}

        {memberSummaries.length === 0 ? (
          <Card className="p-6 text-center sm:p-12">
            <p className="text-sm text-muted-foreground">
              ยังไม่มีข้อมูลสมาชิก
            </p>
          </Card>
        ) : selectedSummary ? (
          <div className="space-y-3">
            <div className="-mx-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
              <div className="flex min-w-max gap-1.5">
                {memberSummaries.map((summary) => {
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
                        {summary.items.length}
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
                    โอนแล้ว {formatCurrency(selectedSummary.paidTotal)} /{' '}
                    {formatCurrency(selectedSummary.total)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xl font-serif leading-none text-foreground sm:text-2xl">
                    ค้างจ่าย {formatCurrency(selectedSummary.outstandingTotal)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedSummary.items.length} รายการ
                  </p>
                </div>
              </div>
            </div>

            {selectedSummary.items.length === 0 ? (
              <Card className="p-6 text-center sm:p-10">
                <p className="text-sm text-muted-foreground">
                  คนนี้ยังไม่มีรายการที่ต้องจ่ายคืนใคร
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {selectedSummary.pairs.map((pair) => {
                  const key = pairKey(pair.from.id, pair.to.id);

                  return (
                    <Card
                      key={pair.to.id}
                      className={`rounded-lg p-3 transition-colors ${
                        pair.isSettled ? 'bg-accent/5 ring-1 ring-accent/20' : ''
                      }`}
                    >
                      <div className="mb-2.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="shrink-0 text-xs text-muted-foreground">จ่ายให้</span>
                            <Badge
                              variant="secondary"
                              className="h-5 min-w-0 max-w-full truncate px-2 text-xs font-medium"
                              style={{
                                backgroundColor: `${pair.to.color}15`,
                                color: pair.to.color,
                                borderColor: `${pair.to.color}30`,
                              }}
                            >
                              {pair.to.name}
                            </Badge>
                            {pair.isSettled && (
                              <Badge
                                variant="secondary"
                                className="h-5 gap-1 bg-accent/10 px-2 text-xs font-medium text-accent"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                จ่ายแล้ว
                              </Badge>
                            )}
                            {pair.isPartiallyPaid && (
                              <Badge
                                variant="secondary"
                                className="h-5 gap-1 bg-amber-500/10 px-2 text-xs font-medium text-amber-700"
                              >
                                จ่ายแล้วบางส่วน
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            จาก {pair.items.length} รายการที่ร่วมหาร
                            {pair.isPartiallyPaid &&
                              ` · โอนแล้ว ${formatCurrency(pair.paidAmount)}`}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs text-muted-foreground">
                            {pair.isSettled ? 'รวม' : 'ค้างจ่าย'}
                          </div>
                          <div className="text-xl font-serif leading-none text-foreground sm:text-2xl">
                            {formatCurrency(pair.isSettled ? pair.total : pair.outstanding)}
                          </div>
                          {!pair.isSettled && pair.paidAmount > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              จากทั้งหมด {formatCurrency(pair.total)}
                            </div>
                          )}
                        </div>
                      </div>

                      <label className="mb-2.5 flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-border/70 bg-background/70 px-2.5 text-sm transition-colors hover:bg-muted/60">
                        <Checkbox
                          checked={pair.isSettled}
                          disabled={savingPairKey === key}
                          onCheckedChange={() =>
                            togglePayment(pair.from.id, pair.to.id, pair.total)
                          }
                        />
                        <span className="text-foreground">จ่ายให้ {pair.to.name} แล้ว</span>
                      </label>

                      <div className="space-y-1.5 border-t border-border/60 pt-2.5">
                        {pair.items.map((item) => (
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
            )}
          </div>
        ) : (
          <Card className="p-6 text-center sm:p-12">
            <p className="text-sm text-muted-foreground">ไม่พบข้อมูลสรุป</p>
          </Card>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border/70 bg-background/95 px-3 py-2 backdrop-blur sm:hidden">
        <div className="mx-auto max-w-4xl">
          <Link href="/">
            <Button variant="outline" className="h-10 w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              กลับไปรายการ
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
