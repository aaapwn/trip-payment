'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IGroup } from '@/models/Group';

export default function SettlementsSelectPage() {
  const searchParams = useSearchParams();
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

  const selectedMemberId = searchParams.get('memberId');

  if (loading) {
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

  if (!group || group.members.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Card className="max-w-md p-6 text-center sm:p-8">
          <p className="text-sm text-muted-foreground">ยังไม่มีสมาชิกให้เลือก</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 sm:py-4">

          <h1 className="text-2xl font-serif leading-none tracking-tight text-foreground sm:text-3xl">
            เลือกคน
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            กดชื่อเพื่อไปหน้าสรุปโอนเงินของคนนั้น
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-3 py-3 pb-20 sm:px-6 sm:py-5">
        <div className="grid gap-2">
          {group.members.map((member) => {
            const isActive = member.id === selectedMemberId;
            return (
              <Link
                key={member.id}
                href={`/settlements?memberId=${member.id}`}
                className="block"
              >
                <Card
                  className={`rounded-lg p-3 transition-colors ${
                    isActive ? 'bg-accent/5 ring-1 ring-accent/20' : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge
                      variant="secondary"
                      className="max-w-full truncate px-3 py-1.5 text-sm font-medium"
                      style={{
                        backgroundColor: `${member.color}15`,
                        color: member.color,
                        borderColor: `${member.color}30`,
                      }}
                    >
                      {member.name}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
