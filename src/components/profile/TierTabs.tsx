
'use client';

import type { Tier } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TierTabsProps {
  activeTier: Tier | 'all';
  onTierChange: (tier: Tier | 'all') => void;
}

const TIERS: (Tier | 'all')[] = ['all', 'Basic', 'Medium', 'Professional', 'Premium'];

export function TierTabs({ activeTier, onTierChange }: TierTabsProps) {
  return (
    <div className="flex flex-col space-y-2">
      <p className="text-sm font-medium">Filter by Tier</p>
      {TIERS.map(tier => (
        <Button
          key={tier}
          variant={activeTier === tier ? 'secondary' : 'ghost'}
          onClick={() => onTierChange(tier)}
          className="justify-start"
        >
          {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </Button>
      ))}
    </div>
  );
}
