'use client';

import { useState, useEffect, useCallback } from 'react';
import { IExpense, IGroup, IMember } from '@/models/Group';
import { Button } from '@/components/ui/button';
import { Plus, Users, ArrowRightLeft } from 'lucide-react';
import { ExpenseList } from '@/components/ExpenseList';
import { AddExpenseDialog } from '@/components/AddExpenseDialog';
import { ManageMembersDialog } from '@/components/ManageMembersDialog';
import Link from 'next/link';

export default function HomePage() {
  const [group, setGroup] = useState<IGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [manageMembersOpen, setManageMembersOpen] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);

  const fetchGroup = useCallback(async () => {
    try {
      const response = await fetch('/api/group');
      const data = await response.json();
      
      if (data._id?.startsWith('mock-')) {
        setIsMockMode(true);
      }
      
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

  const handleExpenseAdded = async (expense: Omit<IExpense, '_id'>) => {
    if (!group) return;

    try {
      const response = await fetch('/api/group', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenses: [...group.expenses, expense],
        }),
      });

      if (response.ok) {
        setAddExpenseOpen(false);
        fetchGroup();
      }
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const handleExpenseDeleted = async (expenseIndex: number) => {
    if (!group) return;

    const updatedExpenses = group.expenses.filter((_, i) => i !== expenseIndex);

    try {
      const response = await fetch('/api/group', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenses: updatedExpenses,
        }),
      });

      if (response.ok) {
        fetchGroup();
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const handleMembersUpdated = async (members: IMember[]) => {
    try {
      const response = await fetch('/api/group', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members }),
      });

      if (response.ok) {
        setManageMembersOpen(false);
        fetchGroup();
      }
    } catch (error) {
      console.error('Failed to update members:', error);
    }
  };

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
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-serif text-foreground mb-3">
            เริ่มต้นใช้งาน
          </h1>
          <p className="text-muted-foreground mb-8">
            เพิ่มสมาชิกในกลุ่มเพื่อเริ่มบันทึกค่าใช้จ่าย
          </p>
          <Button
            onClick={() => setManageMembersOpen(true)}
            size="lg"
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            เพิ่มสมาชิก
          </Button>
        </div>

        <ManageMembersDialog
          open={manageMembersOpen}
          onOpenChange={setManageMembersOpen}
          members={[]}
          onSuccess={handleMembersUpdated}
        />
      </div>
    );
  }

  const totalExpenses = group.expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen">
      {isMockMode && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center sm:px-6">
          <p className="text-sm text-amber-800">
            ⚠️ <strong>Mock Mode</strong>: กำลังใช้ข้อมูลทดสอบ (จะหายเมื่อรีสตาร์ท)
          </p>
        </div>
      )}

      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif text-foreground tracking-tight">
                หารตัง
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {group.members.length} คน · {group.expenses.length} รายการ
              </p>
            </div>
            <div className="rounded-lg bg-card px-3 py-2 text-right ring-1 ring-border/70">
              <div className="text-xs text-muted-foreground">ยอดรวม</div>
              <div className="break-words text-2xl font-serif leading-none text-foreground sm:text-3xl">
                ฿{totalExpenses.toLocaleString('th-TH')}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-5 pb-24 sm:px-6 sm:py-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-serif text-foreground">รายการทั้งหมด</h2>
          <Button onClick={() => setAddExpenseOpen(true)} className="h-10 gap-2">
            <Plus className="w-4 h-4" />
            เพิ่ม
          </Button>
        </div>

        <ExpenseList
          expenses={group.expenses}
          members={group.members}
          onDelete={handleExpenseDeleted}
        />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-2">
          <Link href="/settlements">
            <Button variant="outline" className="h-11 w-full gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              สรุปโอน
            </Button>
          </Link>
          <Button
            onClick={() => setManageMembersOpen(true)}
            variant="outline"
            className="h-11 gap-2"
          >
            <Users className="w-4 h-4" />
            สมาชิก
          </Button>
        </div>
      </nav>

      <div className="fixed right-6 bottom-6 z-10 hidden gap-2 sm:flex">
        <Link href="/settlements">
          <Button variant="outline" className="h-10 gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            สรุปโอน
          </Button>
        </Link>
        <Button
          onClick={() => setManageMembersOpen(true)}
          variant="outline"
          className="h-10 gap-2"
        >
          <Users className="w-4 h-4" />
          จัดการสมาชิก
        </Button>
      </div>

      <AddExpenseDialog
        open={addExpenseOpen}
        onOpenChange={setAddExpenseOpen}
        members={group.members}
        onSuccess={handleExpenseAdded}
      />

      <ManageMembersDialog
        open={manageMembersOpen}
        onOpenChange={setManageMembersOpen}
        members={group.members}
        onSuccess={handleMembersUpdated}
      />
    </div>
  );
}
