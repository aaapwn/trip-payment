'use client';

import { useState, useEffect, useCallback } from 'react';
import { IExpense, IGroup, IMember } from '@/models/Group';
import { Button } from '@/components/ui/button';
import { AlertCircle, Plus, Users } from 'lucide-react';
import { ExpenseList } from '@/components/ExpenseList';
import { AddExpenseDialog } from '@/components/AddExpenseDialog';
import { ManageMembersDialog } from '@/components/ManageMembersDialog';
import { fetchGroup as fetchGroupRequest, saveGroup, GroupUpdates } from '@/lib/api';

export default function HomePage() {
  const [group, setGroup] = useState<IGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [editingExpenseIndex, setEditingExpenseIndex] = useState<number | null>(null);
  const [manageMembersOpen, setManageMembersOpen] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    try {
      const data = await fetchGroupRequest();

      setIsMockMode(Boolean(data._id?.startsWith('mock-')));
      setGroup(data);
    } catch (error) {
      console.error('Failed to fetch group:', error);
      setErrorMessage('โหลดข้อมูลไม่สำเร็จ กรุณารีเฟรชหน้า');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGroup();
  }, [fetchGroup]);

  /** Returns true when the change was saved. */
  const save = useCallback(
    async (updates: GroupUpdates): Promise<boolean> => {
      if (!group) return false;

      setErrorMessage(null);
      const result = await saveGroup(updates, group.updatedAt);

      if (result.ok) {
        setGroup(result.group);
        return true;
      }

      setErrorMessage(result.error);

      // Someone else changed the group: show them the current data right away.
      if (result.conflict) {
        if (result.group) {
          setGroup(result.group);
        } else {
          await fetchGroup();
        }
      }

      return false;
    },
    [group, fetchGroup]
  );

  const handleExpenseAdded = async (expense: IExpense) => {
    if (!group) return;

    if (await save({ expenses: [...group.expenses, expense] })) {
      setAddExpenseOpen(false);
    }
  };

  const handleExpenseUpdated = async (expense: IExpense) => {
    if (!group || editingExpenseIndex === null) return;

    const updatedExpenses = group.expenses.map((currentExpense, index) =>
      index === editingExpenseIndex ? expense : currentExpense
    );

    if (await save({ expenses: updatedExpenses })) {
      setEditingExpenseIndex(null);
    }
  };

  const handleExpenseDeleted = async (expenseIndex: number) => {
    if (!group) return;

    await save({ expenses: group.expenses.filter((_, index) => index !== expenseIndex) });
  };

  const handleMembersUpdated = async (members: IMember[]) => {
    if (await save({ members })) {
      setManageMembersOpen(false);
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
          {errorMessage && (
            <p className="mb-6 text-sm text-destructive">{errorMessage}</p>
          )}
          <Button
            onClick={() => setManageMembersOpen(true)}
            size="lg"
            className="gap-2"
            disabled={!group}
          >
            <Users className="w-4 h-4" />
            เพิ่มสมาชิก
          </Button>
        </div>

        <ManageMembersDialog
          open={manageMembersOpen}
          onOpenChange={setManageMembersOpen}
          members={[]}
          expenses={group?.expenses ?? []}
          onSuccess={handleMembersUpdated}
          errorMessage={errorMessage}
        />
      </div>
    );
  }

  const totalExpenses = group.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const editingExpense =
    editingExpenseIndex === null ? null : group.expenses[editingExpenseIndex] ?? null;

  return (
    <div className="min-h-screen">
      {isMockMode && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center sm:px-6">
          <p className="text-sm text-amber-800">
            ⚠️ <strong>Mock Mode</strong>: กำลังใช้ข้อมูลทดสอบ (จะหายเมื่อรีสตาร์ท)
          </p>
        </div>
      )}

      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-serif leading-none text-foreground tracking-tight sm:text-3xl">
                หารตัง
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {group.members.length} คน · {group.expenses.length} รายการ
              </p>
            </div>
            <div className="rounded-md bg-card px-3 py-2 text-right ring-1 ring-border/70">
              <div className="text-xs text-muted-foreground">ยอดรวม</div>
              <div className="break-words text-xl font-serif leading-none text-foreground sm:text-2xl">
                ฿{totalExpenses.toLocaleString('th-TH')}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-3 py-3 pb-20 sm:px-6 sm:py-5">
        {errorMessage && (
          <div
            role="alert"
            className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0">{errorMessage}</span>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-serif text-foreground sm:text-xl">รายการทั้งหมด</h2>
          <Button onClick={() => setAddExpenseOpen(true)} className="h-9 gap-2 px-3">
            <Plus className="w-4 h-4" />
            เพิ่ม
          </Button>
        </div>

        <ExpenseList
          expenses={group.expenses}
          members={group.members}
          onEdit={setEditingExpenseIndex}
          onDelete={handleExpenseDeleted}
        />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border/70 bg-background/95 px-3 py-2 backdrop-blur sm:hidden">
        <div className="mx-auto max-w-4xl">
          <Button
            onClick={() => setManageMembersOpen(true)}
            variant="outline"
            className="h-10 w-full gap-2"
          >
            <Users className="w-4 h-4" />
            จัดการสมาชิก
          </Button>
        </div>
      </nav>

      <div className="fixed right-6 bottom-6 z-10 hidden gap-2 sm:flex">
        <Button
          onClick={() => setManageMembersOpen(true)}
          variant="outline"
          className="h-10 gap-2"
        >
          <Users className="w-4 h-4" />
          จัดการสมาชิก
        </Button>
      </div>

      {addExpenseOpen && (
        <AddExpenseDialog
          open={addExpenseOpen}
          onOpenChange={setAddExpenseOpen}
          members={group.members}
          onSuccess={handleExpenseAdded}
        />
      )}

      {editingExpense && (
        <AddExpenseDialog
          key={editingExpenseIndex}
          open={editingExpenseIndex !== null}
          onOpenChange={(open) => {
            if (!open) setEditingExpenseIndex(null);
          }}
          members={group.members}
          onSuccess={handleExpenseUpdated}
          initialExpense={editingExpense}
          mode="edit"
        />
      )}

      <ManageMembersDialog
        open={manageMembersOpen}
        onOpenChange={setManageMembersOpen}
        members={group.members}
        expenses={group.expenses}
        onSuccess={handleMembersUpdated}
        errorMessage={errorMessage}
      />
    </div>
  );
}
