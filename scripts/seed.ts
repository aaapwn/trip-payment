import { connectDB } from '@/lib/mongodb';
import { Group } from '@/models/Group';

const PRESET_COLORS = [
  '#5B7FE8', '#6BCF9E', '#F59E42', '#E85B7F', '#9B7FE8',
];

async function seed() {
  try {
    await connectDB();
    
    // Clear existing data
    await Group.deleteMany({});
    
    // Create sample group
    const group = await Group.create({
      members: [
        { id: '1', name: 'กอล์ฟ', color: PRESET_COLORS[0] },
        { id: '2', name: 'มิ้นต์', color: PRESET_COLORS[1] },
        { id: '3', name: 'เบียร์', color: PRESET_COLORS[2] },
        { id: '4', name: 'โอม', color: PRESET_COLORS[3] },
      ],
      expenses: [
        {
          description: 'ค่าที่พัก 2 คืน',
          amount: 4000,
          paidBy: '1',
          splitWith: ['1', '2', '3', '4'],
          date: new Date('2026-04-28'),
        },
        {
          description: 'ค่าเช่ารถ',
          amount: 1500,
          paidBy: '2',
          splitWith: ['1', '2', '3', '4'],
          date: new Date('2026-04-28'),
        },
        {
          description: 'ค่าอาหารวันแรก',
          amount: 800,
          paidBy: '3',
          splitWith: ['1', '2', '3', '4'],
          date: new Date('2026-04-28'),
        },
        {
          description: 'ค่าขนม + เครื่องดื่ม',
          amount: 350,
          paidBy: '4',
          splitWith: ['1', '2', '3', '4'],
          date: new Date('2026-04-29'),
        },
        {
          description: 'ค่าอาหารวันสอง',
          amount: 950,
          paidBy: '1',
          splitWith: ['1', '2', '3', '4'],
          date: new Date('2026-04-29'),
        },
        {
          description: 'ของฝาก',
          amount: 600,
          paidBy: '2',
          splitWith: ['2', '3'],
          date: new Date('2026-04-30'),
        },
      ],
    });
    
    console.log('✅ Seed data created successfully!');
    console.log(`Group ID: ${group._id}`);
    console.log(`Members: ${group.members.length}`);
    console.log(`Total expenses: ${group.expenses.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
