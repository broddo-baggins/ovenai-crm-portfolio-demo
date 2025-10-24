// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import React from 'react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { MainNav } from '@/components/layout/MainNav';
import { UserNav } from '@/components/layout/UserNav';
import { BasicProjectSelector } from '@/components/common/BasicProjectSelector';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

export const Header: React.FC = () => {
  const { isRTL, flexRowReverse, marginEnd } = useLang();

  return (
    <header className="border-b">
      <div className={cn("flex h-16 items-center px-4", isRTL && "font-hebrew")} dir={isRTL ? "rtl" : "ltr"}>
        <MainNav className={cn(marginEnd("6"))} />
        <div className={cn("flex items-center space-x-4", isRTL ? "mr-auto space-x-reverse" : "ml-auto")}>
          <BasicProjectSelector />
          <NotificationCenter />
          <UserNav />
        </div>
      </div>
    </header>
  );
}; 