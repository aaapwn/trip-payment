import { cn } from '@/lib/utils';

type Tone = 'default' | 'muted' | 'positive' | 'negative';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const toneClass: Record<Tone, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  positive: 'text-positive',
  negative: 'text-destructive',
};

const sizeClass: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base sm:text-lg',
  lg: 'text-xl sm:text-2xl',
  xl: 'text-2xl sm:text-3xl',
};

/** Always two decimals: shares are fractional, so one rule beats per-page rules. */
export const formatAmount = (value: number) =>
  value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface MoneyProps {
  value: number;
  tone?: Tone;
  size?: Size;
  /** Prefix a `+` for positive values (net balances). */
  signed?: boolean;
  className?: string;
}

export function Money({
  value,
  tone = 'default',
  size = 'md',
  signed = false,
  className,
}: MoneyProps) {
  const sign = signed && value > 0 ? '+' : '';

  return (
    <span
      className={cn(
        'font-serif tabular whitespace-nowrap leading-none',
        toneClass[tone],
        sizeClass[size],
        className
      )}
    >
      {sign}฿{formatAmount(Math.abs(value))}
    </span>
  );
}
