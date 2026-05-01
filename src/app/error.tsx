'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="max-w-md w-full p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        
        <h1 className="text-2xl font-serif text-foreground mb-3">
          เกิดข้อผิดพลาด
        </h1>
        
        <p className="text-muted-foreground text-sm mb-8">
          ขออภัย มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง
        </p>

        <Button onClick={reset} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          ลองใหม่
        </Button>
      </Card>
    </div>
  );
}
