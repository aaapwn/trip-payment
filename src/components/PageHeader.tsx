import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Optional "back" affordance shown above the title on small screens. */
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
  /** Rendered full width under the title row (tabs, filters, totals). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * One header for every page. Each page used to roll its own with a slightly
 * different padding scale, which is why nothing lined up between routes.
 */
export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  action,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-md',
        className
      )}
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6 sm:py-4">
        {backHref && (
          <Link
            href={backHref}
            className="mb-1.5 -ml-1 inline-flex min-h-7 items-center gap-1 rounded-md px-1 text-xs text-muted-foreground transition-colors hover:text-foreground md:hidden"
          >
            <ArrowLeft className="size-3.5" />
            {backLabel}
          </Link>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-serif text-2xl leading-tight tracking-tight text-foreground sm:text-[1.75rem]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>

        {children}
      </div>
    </header>
  );
}

/** Content column, matched to the header width. */
export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-6', className)}>
      {children}
    </div>
  );
}
