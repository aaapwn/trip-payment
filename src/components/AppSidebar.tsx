'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRightLeft, Coins, Home, Receipt, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'รายการ', icon: Home },
  { href: '/settlements/select', label: 'สรุปโอน', icon: ArrowRightLeft },
  { href: '/receivables/select', label: 'เงินที่ต้องได้รับ', icon: Coins },
  { href: '/stats', label: 'สถิติ', icon: Receipt },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border/70 bg-card/50 md:block">
        <div className="sticky top-0 flex h-screen flex-col px-3 py-4">
          <div className="mb-4 flex items-center gap-2 px-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">หารตัง</div>
              <div className="text-xs text-muted-foreground">Trip Payment</div>
            </div>
          </div>

          <nav className="grid gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="sticky top-0 z-20 border-b border-border/70 bg-background/95 px-3 py-2 backdrop-blur md:hidden">
        <nav className="mx-auto grid max-w-4xl grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-10 flex-col items-center justify-center rounded-md px-1 text-[11px] leading-tight',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <Icon className="mb-0.5 h-3.5 w-3.5" />
                <span className="truncate text-center">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
