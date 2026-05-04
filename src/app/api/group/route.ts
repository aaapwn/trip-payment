import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Group } from '@/models/Group';

const USE_MOCK_DATA = !process.env.MONGODB_URI;

// Mock data - single group
const mockGroup = {
  _id: 'mock-group',
  members: [
    { id: '1', name: 'กอล์ฟ', color: '#5B7FE8' },
    { id: '2', name: 'มิ้นต์', color: '#6BCF9E' },
    { id: '3', name: 'เบียร์', color: '#F59E42' },
  ],
  expenses: [
    {
      _id: 'exp-1',
      description: 'ค่าที่พัก',
      amount: 3000,
      paidBy: '1',
      splitWith: ['1', '2', '3'],
      date: new Date('2026-04-28'),
    },
    {
      _id: 'exp-2',
      description: 'ค่าอาหาร',
      amount: 900,
      paidBy: '2',
      splitWith: ['1', '2', '3'],
      date: new Date('2026-04-28'),
    },
  ],
  paidSettlementKeys: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function GET() {
  if (USE_MOCK_DATA) {
    console.warn('⚠️  Using mock data - MongoDB not configured');
    return NextResponse.json(mockGroup);
  }

  try {
    await connectDB();
    let group = await Group.findOne();
    
    // Create default group if none exists
    if (!group) {
      group = await Group.create({
        members: [],
        expenses: [],
        paidSettlementKeys: [],
      });
    }
    
    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const body = await request.json();

  if (USE_MOCK_DATA) {
    Object.assign(mockGroup, body, { updatedAt: new Date() });
    return NextResponse.json(mockGroup);
  }

  try {
    await connectDB();
    let group = await Group.findOne();
    
    if (!group) {
      group = await Group.create(body);
    } else {
      group = await Group.findOneAndUpdate(
        {},
        body,
        { new: true, runValidators: true }
      );
    }
    
    return NextResponse.json(group);
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}
