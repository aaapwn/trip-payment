import { IExpense, IGroup, IMember, IPaidShare } from '@/models/Group';

export interface GroupUpdates {
  members?: IMember[];
  expenses?: IExpense[];
  paidShares?: IPaidShare[];
}

export type SaveGroupResult =
  | { ok: true; group: IGroup }
  | { ok: false; conflict: boolean; error: string; group?: IGroup };

export async function fetchGroup(): Promise<IGroup> {
  const response = await fetch('/api/group');

  if (!response.ok) {
    throw new Error('โหลดข้อมูลกลุ่มไม่สำเร็จ');
  }

  return response.json();
}

/**
 * Sends `expectedUpdatedAt` so the server can reject the write when someone
 * else changed the group in the meantime, instead of silently overwriting it.
 */
export async function saveGroup(
  updates: GroupUpdates,
  expectedUpdatedAt?: Date | string
): Promise<SaveGroupResult> {
  try {
    const response = await fetch('/api/group', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, expectedUpdatedAt }),
    });

    const data = await response.json().catch(() => null);

    if (response.ok) {
      return { ok: true, group: data as IGroup };
    }

    return {
      ok: false,
      conflict: response.status === 409,
      error: data?.error ?? 'บันทึกไม่สำเร็จ กรุณาลองใหม่',
      group: data?.group as IGroup | undefined,
    };
  } catch (error) {
    console.error('Failed to save group:', error);
    return { ok: false, conflict: false, error: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่' };
  }
}
