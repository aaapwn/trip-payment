'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRightLeft, Coins, Receipt, ScrollText, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'รายการ', shortLabel: 'รายการ', icon: ScrollText },
  { href: '/settlements/select', label: 'สรุปโอน', shortLabel: 'สรุปโอน', icon: ArrowRightLeft },
  { href: '/receivables/select', label: 'เงินที่ต้องได้รับ', shortLabel: 'ค้างรับ', icon: Coins },
  { href: '/stats', label: 'สถิติ', shortLabel: 'สถิติ', icon: Receipt },
];

/** `/settlements/select` should also light up while you are on `/settlements`. */
const sectionOf = (href: string) => href.replace(/\/select$/, '');

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const section = sectionOf(href);
    if (section === '/') return pathname === '/';
    return pathname === section || pathname.startsWith(`${section}/`);
  };

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-border/70 bg-card/40 md:block">
        <div className="sticky top-0 flex h-screen flex-col px-3 py-5">
          <div className="mb-6 flex items-center gap-2.5 px-2">
            <div className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Wallet className="size-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-serif text-lg leading-none text-foreground">
                หารตัง
              </div>
              <div className="mt-1 truncate text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                Trip Payment
              </div>
            </div>
          </div>

          <nav className="grid gap-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile: one bottom tab bar, within thumb reach. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {navItems.map(({ href, shortLabel, icon: Icon }) => {
            const active = isActive(href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[3.25rem] flex-col items-center justify-center gap-1 text-[0.7rem] transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('size-5', active && 'stroke-[2.25]')} />
                <span className="truncate">{shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
