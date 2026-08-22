'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { IExpense, IGroup, IMember } from '@/models/Group';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Receipt, Users } from 'lucide-react';
import { ExpenseList } from '@/components/ExpenseList';
import { AddExpenseDialog } from '@/components/AddExpenseDialog';
import { ManageMembersDialog } from '@/components/ManageMembersDialog';
import { PageBody, PageHeader } from '@/components/PageHeader';
import { EmptyState, ErrorNotice, LoadingScreen } from '@/components/StateCard';
import { MemberDot } from '@/components/MemberChip';
import { Money } from '@/components/Money';
import { fetchGroup as fetchGroupRequest, saveGroup, GroupUpdates } from '@/lib/api';
import { buildMemberBalances, MONEY_EPSILON } from '@/lib/settlements';

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

  const balances = useMemo(() => (group ? buildMemberBalances(group) : []), [group]);

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
    return <LoadingScreen />;
  }

  if (!group || group.members.length === 0) {
    return (
      <>
        <div className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <Users className="size-7 text-primary" />
            </div>
            <h1 className="mb-2 font-serif text-3xl leading-tight text-foreground">
              เริ่มต้นใช้งาน
            </h1>
            <p className="text-sm text-muted-foreground">
              เพิ่มสมาชิกในกลุ่มก่อน แล้วค่อยบันทึกค่าใช้จ่าย
            </p>
            {errorMessage && <p className="mt-5 text-sm text-destructive">{errorMessage}</p>}
            <Button
              onClick={() => setManageMembersOpen(true)}
              size="lg"
              className="mt-7 gap-2"
              disabled={!group}
            >
              <Users className="size-4" />
              เพิ่มสมาชิก
            </Button>
          </div>
        </div>

        <ManageMembersDialog
          open={manageMembersOpen}
          onOpenChange={setManageMembersOpen}
          members={[]}
          expenses={group?.expenses ?? []}
          onSuccess={handleMembersUpdated}
          errorMessage={errorMessage}
        />
      </>
    );
  }

  const totalExpenses = group.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const editingExpense =
    editingExpenseIndex === null ? null : group.expenses[editingExpenseIndex] ?? null;

  return (
    <>
      {isMockMode && (
        <div className="border-b border-warning/25 bg-warning-soft px-4 py-2 text-center">
          <p className="text-xs text-warning">
            <strong className="font-medium">Mock mode</strong> · ข้อมูลทดสอบ จะหายเมื่อรีสตาร์ท
          </p>
        </div>
      )}

      <PageHeader
        title="หารตัง"
        subtitle={`${group.members.length} คน · ${group.expenses.length} รายการ`}
        action={
          <>
            <Button
              onClick={() => setManageMembersOpen(true)}
              variant="outline"
              className="size-9 p-0 sm:h-9 sm:w-auto sm:px-3"
              title="จัดการสมาชิก"
            >
              <Users className="size-4" />
              <span className="hidden sm:inline">สมาชิก</span>
            </Button>
            <Button onClick={() => setAddExpenseOpen(true)} className="h-9 gap-1.5 px-3">
              <Plus className="size-4" />
              เพิ่ม
            </Button>
          </>
        }
      />

      <PageBody>
        {errorMessage && <ErrorNotice message={errorMessage} />}

        <Card className="mb-4 gap-0 p-0">
          <div className="flex items-end justify-between gap-4 px-4 py-3.5">
            <div>
              <div className="text-xs text-muted-foreground">ยอดรวมทั้งกลุ่ม</div>
              <Money value={totalExpenses} size="xl" className="mt-1 block" />
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>เฉลี่ยคนละ</div>
              <Money
                value={group.members.length > 0 ? totalExpenses / group.members.length : 0}
                size="sm"
                tone="muted"
                className="mt-1 block"
              />
            </div>
          </div>

          <div className="grid divide-y divide-border/60 border-t border-border/60">
            {balances.map(({ member, net }) => {
              const settled = Math.abs(net) <= MONEY_EPSILON;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 px-4 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <MemberDot member={member} />
                    <span className="truncate text-sm text-foreground">{member.name}</span>
                  </div>
                  {settled ? (
                    <span className="text-xs text-muted-foreground">เคลียร์แล้ว</span>
                  ) : (
                    <div className="flex shrink-0 items-baseline gap-2">
                      <span className="text-xs text-muted-foreground">
                        {net > 0 ? 'ได้รับคืน' : 'ต้องจ่าย'}
                      </span>
                      <Money
                        value={net}
                        size="sm"
                        tone={net > 0 ? 'positive' : 'negative'}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg text-foreground">รายการทั้งหมด</h2>
          <span className="text-xs text-muted-foreground">
            {group.expenses.length} รายการ
          </span>
        </div>

        {group.expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="ยังไม่มีรายการค่าใช้จ่าย"
            description="เพิ่มรายการแรกเพื่อเริ่มคำนวณว่าใครต้องจ่ายใครเท่าไหร่"
            action={
              <Button onClick={() => setAddExpenseOpen(true)} className="gap-1.5">
                <Plus className="size-4" />
                เพิ่มรายการ
              </Button>
            }
          />
        ) : (
          <ExpenseList
            expenses={group.expenses}
            members={group.members}
            onEdit={setEditingExpenseIndex}
            onDelete={handleExpenseDeleted}
          />
        )}
      </PageBody>

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
    </>
  );
}
