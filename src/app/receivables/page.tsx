'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Clock3, Coins, UserRoundSearch } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IGroup } from '@/models/Group';
import { MemberChip } from '@/components/MemberChip';
import { MemberTabs } from '@/components/MemberTabs';
import { Money } from '@/components/Money';
import { PageBody, PageHeader } from '@/components/PageHeader';
import { PaymentMeter } from '@/components/PaymentMeter';
import { EmptyState, ErrorNotice, LoadingScreen } from '@/components/StateCard';
import { fetchGroup as fetchGroupRequest } from '@/lib/api';
import { buildReceivableSummaries } from '@/lib/settlements';

export default function ReceivablesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [group, setGroup] = useState<IGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
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

  const receivableSummaries = useMemo(
    () => (group ? buildReceivableSummaries(group) : []),
    [group]
  );

  const memberIdFromQuery = searchParams.get('memberId');
  const selectedSummary =
    receivableSummaries.find((item) => item.member.id === selectedMemberId) ??
    receivableSummaries.find((item) => item.member.id === memberIdFromQuery) ??
    receivableSummaries[0];

  if (loading || !group) {
    return <LoadingScreen message={errorMessage ?? 'กำลังโหลด...'} />;
  }

  return (
    <>
      <PageHeader
        title="เงินที่ต้องได้รับ"
        subtitle="เช็กว่าใครโอนคืนครบแล้ว"
        backHref="/settlements"
        backLabel="สรุปโอน"
        action={
          <Link
            href={`/receivables/select${
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
        {receivableSummaries.length > 0 && selectedSummary && (
          <MemberTabs
            items={receivableSummaries.map((summary) => ({
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
          <EmptyState
            icon={Coins}
            title="ยังไม่มีรายการที่ต้องได้รับเงินคืน"
            description="เมื่อมีคนออกเงินให้คนอื่น รายการจะขึ้นที่นี่"
          />
        ) : (
          <div className="space-y-3">
            <Card className="gap-0 p-0">
              <div className="flex items-end justify-between gap-4 px-4 py-3.5">
                <div className="min-w-0">
                  <MemberChip member={selectedSummary.member} variant="soft" size="md" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {selectedSummary.settledPairCount}/{selectedSummary.pairs.length} คนโอนแล้ว
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-muted-foreground">ค้างรับ</div>
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
                      ได้รับแล้ว <Money value={selectedSummary.paidTotal} size="sm" tone="muted" />
                    </span>
                    <span>
                      จากทั้งหมด <Money value={selectedSummary.total} size="sm" tone="muted" />
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {selectedSummary.pairs.map((pair) => (
              <Card key={pair.from.id} className="gap-0 overflow-hidden p-0">
                <div className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="shrink-0 text-xs text-muted-foreground">รอจาก</span>
                        <MemberChip member={pair.from} />
                        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="shrink-0 truncate text-xs text-muted-foreground">
                          {selectedSummary.member.name}
                        </span>
                      </div>
                      <div className="mt-2">
                        {pair.isSettled ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-positive-soft px-2 py-0.5 text-xs font-medium text-positive">
                            <CheckCircle2 className="size-3" />
                            โอนแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
                            <Clock3 className="size-3" />
                            {pair.isPartiallyPaid ? 'โอนบางส่วน' : 'ยังไม่โอน'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-xs text-muted-foreground">
                        {pair.isSettled ? 'รับครบแล้ว' : 'ค้างรับ'}
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

                <div className="divide-y divide-border/50 border-t border-border/60 bg-muted/25">
                  {pair.items.map((item) => (
                    <div
                      key={item.expenseIndex}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm text-foreground">{item.description}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground tabular">
                          {format(new Date(item.date), 'd MMM yy', { locale: th })} · ยอดรวม ฿
                          {Math.abs(item.totalAmount).toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                      <Money value={item.amount} size="sm" />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
