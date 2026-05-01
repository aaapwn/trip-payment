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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IMember, IExpense } from '@/models/Group';
import { Badge } from '@/components/ui/badge';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: IMember[];
  onSuccess: (expense: Omit<IExpense, '_id'>) => void;
}

export function AddExpenseDialog({
  open,
  onOpenChange,
  members,
  onSuccess,
}: AddExpenseDialogProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitWith, setSplitWith] = useState<string[]>([]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !paidBy || splitWith.length === 0) return;

    setLoading(true);
    try {
      const expense: Omit<IExpense, '_id'> = {
        description: description.trim(),
        amount: parseFloat(amount),
        paidBy,
        splitWith,
        date: new Date(),
      };

      await onSuccess(expense);
      
      setDescription('');
      setAmount('');
      setPaidBy('');
      setSplitWith([]);
    } catch (error) {
      console.error('Failed to add expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const paidByMember = members.find((m) => m.id === paidBy);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-xl font-serif sm:text-2xl">เพิ่มรายการค่าใช้จ่าย</DialogTitle>
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
            <Label className="text-sm font-medium">
              จ่ายโดย
            </Label>
            <Select value={paidBy} onValueChange={(value) => setPaidBy(value ?? '')}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="เลือกคนที่จ่าย">
                  {paidByMember && (
                    <Badge
                      variant="secondary"
                      className="font-normal"
                      style={{
                        backgroundColor: `${paidByMember.color}15`,
                        color: paidByMember.color,
                        borderColor: `${paidByMember.color}30`,
                      }}
                    >
                      {paidByMember.name}
                    </Badge>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <Badge
                      variant="secondary"
                      className="font-normal"
                      style={{
                        backgroundColor: `${member.color}15`,
                        color: member.color,
                        borderColor: `${member.color}30`,
                      }}
                    >
                      {member.name}
                    </Badge>
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

            <div className="grid gap-3 sm:grid-cols-2">
              {members.map((member) => (
                <label
                  key={member.id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/5"
                >
                  <Checkbox
                    checked={splitWith.includes(member.id)}
                    onCheckedChange={() => toggleMember(member.id)}
                  />
                  <Badge
                    variant="secondary"
                    className="min-w-0 max-w-full truncate font-normal"
                    style={{
                      backgroundColor: `${member.color}15`,
                      color: member.color,
                      borderColor: `${member.color}30`,
                    }}
                  >
                    {member.name}
                  </Badge>
                </label>
              ))}
            </div>

            {splitWith.length > 0 && amount && (
              <p className="text-xs text-muted-foreground pt-2">
                ฿{(parseFloat(amount) / splitWith.length).toLocaleString('th-TH', {
                  minimumFractionDigits: 2,
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
              disabled={
                !description.trim() ||
                !amount ||
                !paidBy ||
                splitWith.length === 0 ||
                loading
              }
            >
              {loading ? 'กำลังเพิ่ม...' : 'เพิ่มรายการ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
