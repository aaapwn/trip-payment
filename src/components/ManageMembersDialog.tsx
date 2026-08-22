'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Lock, Plus, X } from 'lucide-react';
import { IExpense, IMember } from '@/models/Group';
import { isMemberReferenced } from '@/lib/settlements';
import { MemberDot } from '@/components/MemberChip';

interface ManageMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: IMember[];
  expenses: IExpense[];
  onSuccess: (members: IMember[]) => void;
  errorMessage?: string | null;
}

const PRESET_COLORS = [
  '#5B7FE8', '#6BCF9E', '#F59E42', '#E85B7F', '#9B7FE8',
  '#42C6F5', '#F5C842', '#E85BA8', '#7FE8B5', '#F57F42',
];

export function ManageMembersDialog({
  open,
  onOpenChange,
  members: initialMembers,
  expenses,
  onSuccess,
  errorMessage = null,
}: ManageMembersDialogProps) {
  const [memberName, setMemberName] = useState('');
  const [members, setMembers] = useState<IMember[]>(initialMembers);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setMemberName('');
      setMembers(initialMembers);
    }

    onOpenChange(nextOpen);
  };

  const addMember = () => {
    const name = memberName.trim();
    if (!name) return;

    const newMember: IMember = {
      id: crypto.randomUUID(),
      name,
      color: PRESET_COLORS[members.length % PRESET_COLORS.length],
    };

    setMembers([...members, newMember]);
    setMemberName('');
  };

  const removeMember = (id: string) => {
    setMembers(members.filter((member) => member.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (members.length < 2) return;

    setLoading(true);
    try {
      await onSuccess(members);
    } catch (error) {
      console.error('Failed to update members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-xl font-serif sm:text-2xl">จัดการสมาชิก</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              สมาชิกทั้งหมด ({members.length} คน)
            </Label>

            <div className="grid gap-2 sm:flex">
              <Input
                placeholder="ชื่อสมาชิก"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
                className="h-11"
                autoFocus
              />
              <Button
                type="button"
                onClick={addMember}
                size="lg"
                variant="secondary"
                className="h-11 gap-2 sm:shrink-0"
              >
                <Plus className="w-4 h-4" />
                เพิ่ม
              </Button>
            </div>

            {members.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {members.map((member) => {
                  // Removing them would orphan those expenses, so the group
                  // total would no longer match the per-person summaries.
                  const isLocked = isMemberReferenced(expenses, member.id);

                  return (
                    <span
                      key={member.id}
                      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-card pl-3 pr-1.5 text-sm"
                    >
                      <MemberDot member={member} />
                      <span className="max-w-[10rem] truncate text-foreground">
                        {member.name}
                      </span>
                      {isLocked ? (
                        <span
                          className="inline-flex size-6 items-center justify-center text-muted-foreground/70"
                          title="ลบไม่ได้เพราะยังมีรายการค่าใช้จ่ายที่อ้างถึงคนนี้"
                        >
                          <Lock className="size-3" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeMember(member.id)}
                          className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`ลบ ${member.name}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {members.some((member) => isMemberReferenced(expenses, member.id)) && (
              <p className="text-xs text-muted-foreground">
                🔒 คนที่มีรายการค่าใช้จ่ายอยู่แล้วจะลบไม่ได้ — ต้องลบหรือแก้รายการนั้นก่อน
              </p>
            )}

            {members.length > 0 && members.length < 2 && (
              <p className="text-xs text-muted-foreground">
                ต้องมีอย่างน้อย 2 คนเพื่อแชร์ค่าใช้จ่าย
              </p>
            )}
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0">{errorMessage}</span>
            </div>
          )}

          <div className="grid gap-3 pt-4 sm:flex">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 flex-1 sm:h-8"
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="h-11 flex-1 sm:h-8"
              disabled={members.length < 2 || loading}
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
