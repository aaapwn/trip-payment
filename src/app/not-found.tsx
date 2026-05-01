import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="max-w-md w-full p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-6">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <h1 className="text-6xl font-serif text-foreground mb-4">
          404
        </h1>
        
        <h2 className="text-xl font-medium text-foreground mb-3">
          ไม่พบหน้านี้
        </h2>
        
        <p className="text-muted-foreground text-sm mb-8">
          ขออภัย หน้าที่คุณกำลังค้นหาอาจถูกลบหรือย้ายไปแล้ว
        </p>

        <Link href="/">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            กลับหน้าหลัก
          </Button>
        </Link>
      </Card>
    </div>
  );
}
