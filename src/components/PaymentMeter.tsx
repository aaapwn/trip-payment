import { cn } from '@/lib/utils';
import { MONEY_EPSILON } from '@/lib/settlements';

interface PaymentMeterProps {
  paid: number;
  total: number;
  className?: string;
}

/**
 * How much of a debt has been transferred. The numbers alone ("โอนแล้ว
 * ฿0.00 / ฿300.00") make you do the arithmetic; the bar does not.
 */
export function PaymentMeter({ paid, total, className }: PaymentMeterProps) {
  const ratio = total > MONEY_EPSILON ? Math.min(Math.max(paid / total, 0), 1) : 0;
  const settled = ratio >= 1 - MONEY_EPSILON;

  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={Math.round(total * 100) / 100}
      aria-valuenow={Math.round(paid * 100) / 100}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300 ease-out',
          settled ? 'bg-positive' : 'bg-primary'
        )}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
