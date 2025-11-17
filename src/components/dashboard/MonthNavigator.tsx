'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface MonthNavigatorProps {
  currentMonth: string;
}

export function MonthNavigator({ currentMonth }: MonthNavigatorProps) {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth);

  const handlePrevMonth = () => {
    const [year, m] = month.split('-').map(Number);
    const date = new Date(year, m - 1, 1);
    date.setMonth(date.getMonth() - 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setMonth(newMonth);
    router.push(`/?month=${newMonth}`);
  };

  const handleNextMonth = () => {
    const [year, m] = month.split('-').map(Number);
    const date = new Date(year, m - 1, 1);
    date.setMonth(date.getMonth() + 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setMonth(newMonth);
    router.push(`/?month=${newMonth}`);
  };

  const [year, m] = month.split('-');
  const monthName = new Date(Number(year), Number(m) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handlePrevMonth}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium capitalize">{monthName}</span>
      <Button variant="outline" size="sm" onClick={handleNextMonth}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
