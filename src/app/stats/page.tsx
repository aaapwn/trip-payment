'use client';

import { useState, useEffect, useCallback } from 'react';
import { IGroup, IMember } from '@/models/Group';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search, Filter, Users } from 'lucide-react';
import Link from 'next/link';
import { getMemberStats } from '@/lib/calculations';
import { buildDebtPairs, formatCurrency } from '@/lib/settlements';

export default function StatsPage() {
  const [group, setGroup] = useState<IGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  const fetchGroup = useCallback(async () => {
    try {
      const response = await fetch('/api/group');
      const data = await response.json();
      
      if (response.ok) {
        setGroup(data);
        // Select all members by default
        setSelectedMembers(data.members.map((m: IMember) => m.id));
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

  // Money that has actually changed hands, so the numbers here agree with
  // the settlement pages instead of contradicting them.
  const debtPairs = buildDebtPairs(group);
  const transferred = (memberId: string) => {
    const paidOut = debtPairs
      .filter((pair) => pair.from.id === memberId)
      .reduce((sum, pair) => sum + pair.paidAmount, 0);
    const received = debtPairs
      .filter((pair) => pair.to.id === memberId)
      .reduce((sum, pair) => sum + pair.paidAmount, 0);

    return { paidOut, received };
  };

  // Filter members by search and selection
  const filteredMembers = group.members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isSelected = selectedMembers.includes(member.id);
    return matchesSearch && isSelected;
  });

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAll = () => {
    setSelectedMembers(group.members.map(m => m.id));
  };

  const clearAll = () => {
    setSelectedMembers([]);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-5 sm:px-6 sm:py-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-4 min-h-11 sm:min-h-7">
              <ArrowLeft className="w-4 h-4" />
              กลับหน้าหลัก
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif text-foreground tracking-tight mb-2 sm:text-3xl">
                สถิติแต่ละคน
              </h1>
              <p className="text-sm text-muted-foreground">
                แสดง {filteredMembers.length} จาก {group.members.length} คน
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="grid gap-3 sm:flex">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อสมาชิก..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Button
              variant={showFilter ? 'default' : 'outline'}
              onClick={() => setShowFilter(!showFilter)}
              className="h-11 gap-2 sm:shrink-0"
            >
              <Filter className="w-4 h-4" />
              Filter ({selectedMembers.length})
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilter && (
            <Card className="animate-in p-4 sm:p-6">
              <div className="mb-4 grid gap-3 sm:flex sm:items-center sm:justify-between">
                <h3 className="font-medium text-foreground">เลือกสมาชิกที่จะแสดง</h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAll}
                    className="min-h-11 text-xs sm:h-auto sm:min-h-0 sm:py-1"
                  >
                    เลือกทั้งหมด
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="min-h-11 text-xs sm:h-auto sm:min-h-0 sm:py-1"
                  >
                    ล้าง
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {group.members.map((member) => (
                  <label
                    key={member.id}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-accent/5"
                  >
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => toggleMember(member.id)}
                    />
                    <Badge
                      variant="secondary"
                      className="min-w-0 max-w-full truncate font-normal"
                      style={{
                        backgroundColor: `${member.color}15`,
                        color: member.color,
                        borderColor: `${member.color}30`,
                      }}
                    >
                      {member.name}
                    </Badge>
                  </label>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Stats Grid */}
        {filteredMembers.length === 0 ? (
          <Card className="p-6 text-center sm:p-12">
            <p className="text-muted-foreground text-sm">
              ไม่พบสมาชิกที่ตรงกับเงื่อนไข
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredMembers.map((member) => {
              const stats = getMemberStats(group.expenses, member.id);
              const { paidOut, received } = transferred(member.id);
              const netBalance = stats.netBalance + paidOut - received;
              const hasTransfers = paidOut > 0 || received > 0;
              const isCreditor = netBalance > 0.005;
              const isDebtor = netBalance < -0.005;

              return (
                <Card key={member.id} className="p-4 transition-shadow hover:shadow-md sm:p-6">
                  <div className="grid gap-5 sm:flex sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <Badge
                        variant="secondary"
                        className="mb-4 max-w-full truncate px-3 py-1.5 text-base font-medium"
                        style={{
                          backgroundColor: `${member.color}15`,
                          color: member.color,
                          borderColor: `${member.color}30`,
                        }}
                      >
                        {member.name}
                      </Badge>

                      <div className="grid gap-4 text-sm min-[420px]:grid-cols-2">
                        <div>
                          <span className="text-muted-foreground block mb-1">จ่ายไป</span>
                          <span className="break-words font-medium text-foreground text-lg">
                            {formatCurrency(stats.totalPaid)}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground block mb-1">ส่วนแบ่งที่ต้องจ่าย</span>
                          <span className="break-words font-medium text-foreground text-lg">
                            {formatCurrency(stats.totalOwed)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border/60 pt-4 sm:border-0 sm:pt-0 sm:text-right">
                      <span className="text-xs text-muted-foreground block mb-1">
                        {hasTransfers ? 'คงเหลือสุทธิ' : 'สุทธิ'}
                      </span>
                      <div
                        className={`break-words text-3xl font-serif ${
                          isCreditor
                            ? 'text-accent'
                            : isDebtor
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {isCreditor && '+'}
                        {formatCurrency(Math.abs(netBalance))}
                      </div>
                      {hasTransfers && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          หลังหักที่โอนกันแล้ว
                          {paidOut > 0 && ` · โอนออก ${formatCurrency(paidOut)}`}
                          {received > 0 && ` · รับเข้า ${formatCurrency(received)}`}
                        </p>
                      )}
                      {isCreditor && (
                        <p className="text-xs text-accent mt-1">
                          ได้รับคืน
                        </p>
                      )}
                      {isDebtor && (
                        <p className="text-xs text-destructive mt-1">
                          ต้องจ่าย
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
