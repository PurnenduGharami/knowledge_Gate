'use client';

import { UserInfoCard } from '@/components/profile/UserInfoCard';
import { AIModelPreferences } from '@/components/profile/AIModelPreferences';
import { DataExportCard } from '@/components/profile/DataExportCard';
import { UsageTable } from '@/components/profile/UsageTable';
import { ArchivedProjectsManager } from '@/components/profile/ArchivedProjectsManager';
import { TierExplanationCard } from '@/components/profile/TierExplanationCard';
import { CurrentlyUsedModels } from '@/components/profile/CurrentlyUsedModels';
import { CreditBalanceCard } from '@/components/profile/CreditBalanceCard';
import { ThemeSelector } from '@/components/profile/ThemeSelector';
import { TransactionHistory } from '@/components/profile/TransactionHistory';

export default function ProfilePage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 space-y-8">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account, preferences, and data.</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <UserInfoCard />
            <CreditBalanceCard />
          </div>
          <AIModelPreferences />
          <UsageTable />
          <TransactionHistory />
        </div>
        <div className="space-y-8">
          <ThemeSelector />
          <TierExplanationCard />
          <CurrentlyUsedModels />
          <DataExportCard />
          <ArchivedProjectsManager />
        </div>
      </main>
    </div>
  );
}
