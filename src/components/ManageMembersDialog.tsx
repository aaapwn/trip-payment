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
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { IMember } from '@/models/Group';

interface ManageMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: IMember[];
  onSuccess: (members: IMember[]) => void;
}

const PRESET_COLORS = [
  '#5B7FE8', '#6BCF9E', '#F59E42', '#E85B7F', '#9B7FE8',
  '#42C6F5', '#F5C842', '#E85BA8', '#7FE8B5', '#F57F42',
];

export function ManageMembersDialog({
  open,
  onOpenChange,
  members: initialMembers,
  onSuccess,
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
    if (!memberName.trim()) return;
    
    const newMember: IMember = {
      id: Date.now().toString(),
      name: memberName.trim(),
      color: PRESET_COLORS[members.length % PRESET_COLORS.length],
    };
    
    setMembers([...members, newMember]);
    setMemberName('');
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
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
              <div className="flex flex-wrap gap-2 pt-2">
                {members.map((member) => (
                  <Badge
                    key={member.id}
                    variant="secondary"
                    className="max-w-full gap-2 px-3 py-2 text-sm"
                    style={{
                      backgroundColor: `${member.color}15`,
                      color: member.color,
                      borderColor: `${member.color}30`,
                    }}
                  >
                    {member.name}
                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      className="-mr-1 inline-flex min-h-6 min-w-6 items-center justify-center rounded-md transition-opacity hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {members.length > 0 && members.length < 2 && (
              <p className="text-xs text-muted-foreground">
                ต้องมีอย่างน้อย 2 คนเพื่อแชร์ค่าใช้จ่าย
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
