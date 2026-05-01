'use client';

import { IMember, IExpense } from '@/models/Group';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getMemberStats } from '@/lib/calculations';

interface MemberStatsProps {
  expenses: IExpense[];
  members: IMember[];
}

export function MemberStats({ expenses, members }: MemberStatsProps) {
  return (
    <div>
      <h2 className="text-xl font-serif text-foreground mb-6">สถิติแต่ละคน</h2>
      
      <div className="space-y-3">
        {members.map((member) => {
          const stats = getMemberStats(expenses, member.id);
          const isCreditor = stats.netBalance > 0;
          const isDebtor = stats.netBalance < 0;

          return (
            <Card key={member.id} className="p-6">
              <div className="mb-4">
                <Badge
                  variant="secondary"
                  className="px-3 py-1.5 text-sm font-medium mb-3"
                  style={{
                    backgroundColor: `${member.color}15`,
                    color: member.color,
                    borderColor: `${member.color}30`,
                  }}
                >
                  {member.name}
                </Badge>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">จ่ายไป</span>
                    <span className="font-medium text-foreground">
                      ฿{stats.totalPaid.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">ค้างจ่าย</span>
                    <span className="font-medium text-foreground">
                      ฿{stats.totalOwed.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="h-px bg-border my-3" />

                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">สุทธิ</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-serif text-lg ${
                          isCreditor
                            ? 'text-accent'
                            : isDebtor
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {isCreditor && '+'}
                        ฿{Math.abs(stats.netBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {isCreditor && (
                    <p className="text-xs text-accent pt-1">
                      ได้รับคืน
                    </p>
                  )}
                  {isDebtor && (
                    <p className="text-xs text-destructive pt-1">
                      ต้องจ่าย
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
