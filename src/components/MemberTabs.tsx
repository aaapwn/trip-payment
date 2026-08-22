'use client';

import { IMember } from '@/models/Group';
import { MemberDot } from '@/components/MemberChip';
import { cn } from '@/lib/utils';

interface MemberTabsProps {
  items: { member: IMember; count: number }[];
  selectedId: string;
  onSelect: (memberId: string) => void;
  className?: string;
}

export function MemberTabs({ items, selectedId, onSelect, className }: MemberTabsProps) {
  return (
    <div
      className={cn(
        '-mx-4 overflow-x-auto px-4 pb-0.5 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      <div className="flex min-w-max gap-1.5" role="tablist">
        {items.map(({ member, count }) => {
          const isSelected = member.id === selectedId;

          return (
            <button
              key={member.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelect(member.id)}
              className={cn(
                'flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-sm transition-colors',
                isSelected
                  ? 'border-primary/30 bg-primary/10 font-medium text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <MemberDot member={member} className="size-2" />
              <span className="truncate">{member.name}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 text-[0.7rem] tabular',
                  isSelected ? 'bg-primary/15' : 'bg-muted'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
