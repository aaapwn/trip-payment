'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, HandCoins, UserRoundSearch } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { IGroup } from '@/models/Group';
import { MemberChip } from '@/components/MemberChip';
import { Money } from '@/components/Money';
import { PageBody, PageHeader } from '@/components/PageHeader';
import { PaymentMeter } from '@/components/PaymentMeter';
import { EmptyState, ErrorNotice, LoadingScreen } from '@/components/StateCard';
import { MemberTabs } from '@/components/MemberTabs';
import { fetchGroup as fetchGroupRequest, saveGroup } from '@/lib/api';
import {
  buildPayableSummaries,
  DebtPair,
  pairKey,
  readPaidShares,
  setPairPaid,
  togglePaidShare,
} from '@/lib/settlements';

export default function SettlementsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [group, setGroup] = useState<IGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
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

  const savePaidShares = async (key: string, nextPaidShares: ReturnType<typeof readPaidShares>) => {
    if (!group || savingKey) return;

    setSavingKey(key);
    setErrorMessage(null);

    const result = await saveGroup({ paidShares: nextPaidShares }, group.updatedAt);

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

    setSavingKey(null);
  };

  /** One expense at a time: paying for today's items is not disturbed by
      whatever gets added tomorrow. */
  const toggleShare = (pair: DebtPair, expenseKey: string) => {
    if (!group) return;

    savePaidShares(
      `${pair.to.id}|${expenseKey}`,
      togglePaidShare(readPaidShares(group), expenseKey, pair.from.id, pair.to.id)
    );
  };

  const toggleWholePair = (pair: DebtPair) => {
    if (!group) return;

    savePaidShares(
      pairKey(pair.from.id, pair.to.id),
      setPairPaid(readPaidShares(group), pair, !pair.isSettled)
    );
  };

  if (loading || !group) {
    return <LoadingScreen message={errorMessage ?? 'กำลังโหลด...'} />;
  }

  return (
    <>
      <PageHeader
        title="สรุปโอนเงิน"
        subtitle={`แยกตามคน · ${totalItems} รายการที่ต้องจ่ายคืน`}
        backHref="/"
        backLabel="รายการ"
        action={
          <Link
            href={`/settlements/select${
              selectedSummary ? `?memberId=${selectedSummary.member.id}` : ''
            }`}
          >
            <Button variant="outline" className="h-9 gap-1.5 px-3">
              <UserRoundSearch className="size-4" />
              <span className="hidden sm:inline">เลือกคน</span>
            </Button>
          </Link>
        }
      >
        {memberSummaries.length > 0 && selectedSummary && (
          <MemberTabs
            items={memberSummaries.map((summary) => ({
              member: summary.member,
              count: summary.pairs.length,
            }))}
            selectedId={selectedSummary.member.id}
            onSelect={(memberId) => {
              setSelectedMemberId(memberId);
              router.replace(`${pathname}?memberId=${memberId}`, { scroll: false });
            }}
            className="mt-3"
          />
        )}
      </PageHeader>

      <PageBody>
        {errorMessage && <ErrorNotice message={errorMessage} />}

        {!selectedSummary ? (
          <EmptyState icon={HandCoins} title="ยังไม่มีข้อมูลสมาชิก" />
        ) : (
          <div className="space-y-3">
            <Card className="gap-0 p-0">
              <div className="flex items-end justify-between gap-4 px-4 py-3.5">
                <div className="min-w-0">
                  <MemberChip member={selectedSummary.member} variant="soft" size="md" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    ต้องจ่ายคืนทั้งหมด {selectedSummary.pairs.length} คน
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-muted-foreground">ค้างจ่าย</div>
                  <Money
                    value={selectedSummary.outstandingTotal}
                    size="xl"
                    tone={selectedSummary.outstandingTotal > 0 ? 'default' : 'positive'}
                    className="mt-1 block"
                  />
                </div>
              </div>

              {selectedSummary.total > 0 && (
                <div className="px-4 pb-3.5">
                  <PaymentMeter
                    paid={selectedSummary.paidTotal}
                    total={selectedSummary.total}
                  />
                  <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>
                      โอนแล้ว <Money value={selectedSummary.paidTotal} size="sm" tone="muted" />
                    </span>
                    <span>
                      จากทั้งหมด <Money value={selectedSummary.total} size="sm" tone="muted" />
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {selectedSummary.pairs.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="ไม่มีรายการที่ต้องจ่ายคืนใคร"
                description="คนนี้ไม่ได้ติดใครอยู่"
              />
            ) : (
              selectedSummary.pairs.map((pair) => {
                const key = pairKey(pair.from.id, pair.to.id);
                const isSavingPair = savingKey === key;

                return (
                  <Card key={pair.to.id} className="gap-0 overflow-hidden p-0">
                    <div className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="shrink-0 text-xs text-muted-foreground">
                              จ่ายให้
                            </span>
                            <MemberChip member={pair.to} />
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground tabular">
                            ติ๊กแล้ว {pair.paidCount}/{pair.items.length} รายการ
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-xs text-muted-foreground">
                            {pair.isSettled ? 'จ่ายครบแล้ว' : 'ค้างจ่าย'}
                          </div>
                          <Money
                            value={pair.isSettled ? pair.total : pair.outstanding}
                            size="lg"
                            tone={pair.isSettled ? 'positive' : 'default'}
                            className="mt-1 block"
                          />
                          {!pair.isSettled && pair.paidAmount > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              จากทั้งหมด ฿{pair.total.toLocaleString('th-TH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <PaymentMeter paid={pair.paidAmount} total={pair.total} className="mt-3" />
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-2">
                      <span className="text-xs text-muted-foreground">ติ๊กรายการที่จ่ายแล้ว</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleWholePair(pair)}
                        disabled={isSavingPair || Boolean(savingKey)}
                        className="h-7 px-2 text-xs"
                      >
                        {pair.isSettled ? 'ยกเลิกทั้งหมด' : 'ติ๊กทั้งหมด'}
                      </Button>
                    </div>

                    <div className="divide-y divide-border/50 border-t border-border/60 bg-muted/25">
                      {pair.items.map((item) => {
                        const shareSaving = savingKey === `${pair.to.id}|${item.expenseKey}`;

                        return (
                          <label
                            key={item.expenseKey}
                            className={`grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2.5 transition-colors ${
                              item.isPaid ? 'bg-positive-soft/40' : 'hover:bg-muted/50'
                            } ${shareSaving ? 'opacity-60' : ''}`}
                          >
                            <Checkbox
                              checked={item.isPaid}
                              disabled={Boolean(savingKey)}
                              onCheckedChange={() => toggleShare(pair, item.expenseKey)}
                              aria-label={`จ่ายค่า ${item.description} ให้ ${pair.to.name} แล้ว`}
                            />
                            <div className="min-w-0">
                              <div
                                className={`truncate text-sm ${
                                  item.isPaid
                                    ? 'text-muted-foreground line-through'
                                    : 'text-foreground'
                                }`}
                              >
                                {item.description}
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground tabular">
                                {format(new Date(item.date), 'd MMM yy', { locale: th })} · ยอดรวม ฿
                                {Math.abs(item.totalAmount).toLocaleString('th-TH', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {item.isPaid && <CheckCircle2 className="size-3.5 text-positive" />}
                              <Money
                                value={item.amount}
                                size="sm"
                                tone={item.isPaid ? 'muted' : 'default'}
                              />
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </PageBody>
    </>
  );
}
