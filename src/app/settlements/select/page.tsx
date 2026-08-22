'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { IGroup } from '@/models/Group';
import { MemberChip } from '@/components/MemberChip';
import { Money } from '@/components/Money';
import { PageBody, PageHeader } from '@/components/PageHeader';
import { EmptyState, LoadingScreen } from '@/components/StateCard';
import { fetchGroup as fetchGroupRequest } from '@/lib/api';
import { buildPayableSummaries, MONEY_EPSILON } from '@/lib/settlements';

export default function SettlementsSelectPage() {
  const searchParams = useSearchParams();
  const [group, setGroup] = useState<IGroup | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGroup = useCallback(async () => {
    try {
      setGroup(await fetchGroupRequest());
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

  const summaries = useMemo(() => (group ? buildPayableSummaries(group) : []), [group]);
  const selectedMemberId = searchParams.get('memberId');

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <PageHeader
        title="เลือกคน"
        subtitle="กดชื่อเพื่อดูว่าคนนั้นต้องจ่ายคืนใครเท่าไหร่"
        backHref="/settlements"
        backLabel="สรุปโอน"
      />

      <PageBody>
        {summaries.length === 0 ? (
          <EmptyState icon={Users} title="ยังไม่มีสมาชิกให้เลือก" />
        ) : (
          <Card className="divide-y divide-border/60 overflow-hidden p-0">
            {summaries.map((summary) => {
              const isActive = summary.member.id === selectedMemberId;
              const settled = summary.outstandingTotal <= MONEY_EPSILON;

              return (
                <Link
                  key={summary.member.id}
                  href={`/settlements?memberId=${summary.member.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex min-h-14 items-center justify-between gap-3 px-4 transition-colors ${
                    isActive ? 'bg-primary/5' : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <MemberChip member={summary.member} size="md" />
                    <span className="shrink-0 text-xs text-muted-foreground tabular">
                      {summary.pairs.length} คน
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {settled ? (
                      <span className="text-xs text-positive">เคลียร์แล้ว</span>
                    ) : (
                      <Money value={summary.outstandingTotal} size="sm" />
                    )}
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </Card>
        )}
      </PageBody>
    </>
  );
}
