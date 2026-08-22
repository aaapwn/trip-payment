import { IMember } from '@/models/Group';
import { cn } from '@/lib/utils';

interface MemberChipProps {
  member: IMember;
  /** `soft` adds a tinted background — for hero and selected states. */
  variant?: 'plain' | 'soft';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * The member colour reads as a dot rather than as text colour: the ten preset
 * hues are too light to carry text on a light background, and a row of
 * differently coloured words is harder to scan than a row of dots.
 */
export function MemberChip({
  member,
  variant = 'plain',
  size = 'sm',
  className,
}: MemberChipProps) {
  return (
    <span
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'h-6 px-2 text-xs' : 'h-7 px-2.5 text-sm',
        variant === 'soft' ? 'ring-1 ring-inset' : 'bg-muted/60',
        className
      )}
      style={
        variant === 'soft'
          ? {
              backgroundColor: `${member.color}1f`,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ['--tw-ring-color' as any]: `${member.color}45`,
            }
          : undefined
      }
    >
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: member.color }}
      />
      <span className="truncate text-foreground">{member.name}</span>
    </span>
  );
}

/** Just the colour dot, for dense rows where the name is already nearby. */
export function MemberDot({ member, className }: { member: IMember; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('size-2.5 shrink-0 rounded-full', className)}
      style={{ backgroundColor: member.color }}
    />
  );
}
