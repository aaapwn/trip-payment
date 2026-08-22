'use client';

import { useState } from 'react';
import { format, isValid, parse } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IMember, IExpense } from '@/models/Group';
import { Check } from 'lucide-react';
import { MemberChip, MemberDot } from '@/components/MemberChip';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: IMember[];
  onSuccess: (expense: IExpense) => void;
  initialExpense?: IExpense | null;
  mode?: 'add' | 'edit';
}

const DATE_INPUT_FORMAT = 'yyyy-MM-dd';

/** Parsed as a local date so the day shown never shifts by timezone. */
const parseDateInput = (value: string) => parse(value, DATE_INPUT_FORMAT, new Date());

export function AddExpenseDialog({
  open,
  onOpenChange,
  members,
  onSuccess,
  initialExpense = null,
  mode = 'add',
}: AddExpenseDialogProps) {
  const [description, setDescription] = useState(() => initialExpense?.description ?? '');
  const [amount, setAmount] = useState(() =>
    initialExpense ? String(initialExpense.amount) : ''
  );
  const [date, setDate] = useState(() =>
    format(initialExpense?.date ? new Date(initialExpense.date) : new Date(), DATE_INPUT_FORMAT)
  );
  const [paidBy, setPaidBy] = useState(() => initialExpense?.paidBy ?? '');
  const [splitWith, setSplitWith] = useState<string[]>(() => initialExpense?.splitWith ?? []);
  const [loading, setLoading] = useState(false);

  const toggleMember = (memberId: string) => {
    setSplitWith((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAll = () => {
    setSplitWith(members.map((m) => m.id));
  };

  const amountValue = Number(amount);
  const isAmountValid = amount.trim() !== '' && Number.isFinite(amountValue);
  const isDateValid = isValid(parseDateInput(date));
  const canSubmit =
    Boolean(description.trim()) &&
    isAmountValid &&
    isDateValid &&
    Boolean(paidBy) &&
    splitWith.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      const expense: IExpense = {
        ...(initialExpense?._id ? { _id: initialExpense._id } : {}),
        // Paid marks reference this, so it must survive edits and reordering.
        key: initialExpense?.key ?? crypto.randomUUID(),
        description: description.trim(),
        amount: amountValue,
        paidBy,
        splitWith,
        date: parseDateInput(date),
      };

      await onSuccess(expense);
    } catch (error) {
      console.error('Failed to save expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const paidByMember = members.find((m) => m.id === paidBy);
  const isEditing = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-xl font-serif sm:text-2xl">
            {isEditing ? 'แก้ไขรายการค่าใช้จ่าย' : 'เพิ่มรายการค่าใช้จ่าย'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              รายการ
            </Label>
            <Input
              id="description"
              placeholder="เช่น ค่าที่พัก, ค่าอาหาร"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11"
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                จำนวนเงิน (บาท)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">
                วันที่
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              จ่ายโดย
            </Label>
            <Select value={paidBy} onValueChange={(value) => setPaidBy(value ?? '')}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="เลือกคนที่จ่าย">
                  {paidByMember && <MemberChip member={paidByMember} />}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <MemberChip member={member} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm font-medium">
                แชร์กับ ({splitWith.length} คน)
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="min-h-11 shrink-0 text-xs sm:h-auto sm:min-h-0 sm:py-1"
              >
                เลือกทั้งหมด
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const isIncluded = splitWith.includes(member.id);

                return (
                  <button
                    key={member.id}
                    type="button"
                    aria-pressed={isIncluded}
                    onClick={() => toggleMember(member.id)}
                    className={`flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm transition-colors ${
                      isIncluded
                        ? 'border-primary/30 bg-primary/10 font-medium text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {isIncluded ? (
                      <Check className="size-3.5 shrink-0" />
                    ) : (
                      <MemberDot member={member} className="size-2" />
                    )}
                    <span className="truncate">{member.name}</span>
                  </button>
                );
              })}
            </div>

            {splitWith.length > 0 && isAmountValid && (
              <p className="text-xs text-muted-foreground pt-2">
                ฿{(amountValue / splitWith.length).toLocaleString('th-TH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                / คน
              </p>
            )}
          </div>

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
              disabled={!canSubmit || loading}
            >
              {loading
                ? isEditing
                  ? 'กำลังบันทึก...'
                  : 'กำลังเพิ่ม...'
                : isEditing
                  ? 'บันทึก'
                  : 'เพิ่มรายการ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
