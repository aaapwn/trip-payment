'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { IGroup, IMember } from '@/models/Group';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ListFilter, Search, Users } from 'lucide-react';
import { MemberChip } from '@/components/MemberChip';
import { Money } from '@/components/Money';
import { PageBody, PageHeader } from '@/components/PageHeader';
import { EmptyState, ErrorNotice, LoadingScreen } from '@/components/StateCard';
import { fetchGroup as fetchGroupRequest } from '@/lib/api';
import { buildMemberBalances, MONEY_EPSILON } from '@/lib/settlements';

export default function StatsPage() {
  const [group, setGroup] = useState<IGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    try {
      const data = await fetchGroupRequest();

      setGroup(data);
      // Select all members by default
      setSelectedMembers(data.members.map((member: IMember) => member.id));
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

  const balances = useMemo(() => (group ? buildMemberBalances(group) : []), [group]);

  if (loading || !group) {
    return <LoadingScreen message={errorMessage ?? 'กำลังโหลด...'} />;
  }

  const visible = balances.filter(
    ({ member }) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      selectedMembers.includes(member.id)
  );

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  return (
    <>
      <PageHeader
        title="สถิติแต่ละคน"
        subtitle={`แสดง ${visible.length} จาก ${group.members.length} คน`}
        backHref="/"
        backLabel="รายการ"
      >
        <div className="mt-3 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อสมาชิก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8"
              aria-label="ค้นหาชื่อสมาชิก"
            />
          </div>
          <Button
            variant={showFilter ? 'default' : 'outline'}
            onClick={() => setShowFilter(!showFilter)}
            className="h-9 shrink-0 gap-1.5 px-3"
            aria-expanded={showFilter}
          >
            <ListFilter className="size-4" />
            <span className="tabular">{selectedMembers.length}</span>
          </Button>
        </div>
      </PageHeader>

      <PageBody>
        {errorMessage && <ErrorNotice message={errorMessage} />}

        {showFilter && (
          <Card className="mb-3 gap-0 p-0">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5">
              <h2 className="text-sm font-medium text-foreground">เลือกคนที่จะแสดง</h2>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMembers(group.members.map((m) => m.id))}
                  className="h-8 px-2 text-xs"
                >
                  ทั้งหมด
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMembers([])}
                  className="h-8 px-2 text-xs"
                >
                  ล้าง
                </Button>
              </div>
            </div>
            <div className="grid gap-x-4 px-4 py-1 sm:grid-cols-2">
              {group.members.map((member) => (
                <label
                  key={member.id}
                  className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm"
                >
                  <Checkbox
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={() => toggleMember(member.id)}
                  />
                  <MemberChip member={member} />
                </label>
              ))}
            </div>
          </Card>
        )}

        {visible.length === 0 ? (
          <EmptyState
            icon={Users}
            title="ไม่พบสมาชิกที่ตรงกับเงื่อนไข"
            description="ลองแก้คำค้นหา หรือเลือกสมาชิกเพิ่มในตัวกรอง"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map(({ member, paid, share, transferredOut, transferredIn, net }) => {
              const isCreditor = net > MONEY_EPSILON;
              const isDebtor = net < -MONEY_EPSILON;
              const transferred = transferredOut + transferredIn;

              return (
                <Card key={member.id} className="gap-0 p-0">
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <MemberChip member={member} variant="soft" size="md" />
                    <div className="text-right">
                      <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                        {transferred > MONEY_EPSILON ? 'คงเหลือสุทธิ' : 'สุทธิ'}
                      </div>
                      <Money
                        value={net}
                        size="lg"
                        signed
                        tone={isCreditor ? 'positive' : isDebtor ? 'negative' : 'muted'}
                        className="mt-0.5 block"
                      />
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 border-t border-border/60 px-4 py-3 text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-xs text-muted-foreground">จ่ายไป</dt>
                      <dd>
                        <Money value={paid} size="sm" />
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-xs text-muted-foreground">ส่วนแบ่ง</dt>
                      <dd>
                        <Money value={share} size="sm" />
                      </dd>
                    </div>
                    {transferredOut > MONEY_EPSILON && (
                      <div className="flex items-baseline justify-between gap-2">
                        <dt className="text-xs text-muted-foreground">โอนออกแล้ว</dt>
                        <dd>
                          <Money value={transferredOut} size="sm" tone="muted" />
                        </dd>
                      </div>
                    )}
                    {transferredIn > MONEY_EPSILON && (
                      <div className="flex items-baseline justify-between gap-2">
                        <dt className="text-xs text-muted-foreground">รับเข้าแล้ว</dt>
                        <dd>
                          <Money value={transferredIn} size="sm" tone="muted" />
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="border-t border-border/60 px-4 py-2">
                    <p className="text-xs text-muted-foreground">
                      {isCreditor
                        ? 'ยังต้องได้รับคืน'
                        : isDebtor
                          ? 'ยังต้องจ่ายคืน'
                          : 'เคลียร์กันเรียบร้อย'}
                      {transferred > MONEY_EPSILON && ' · หลังหักที่โอนกันแล้ว'}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageBody>
    </>
  );
}
