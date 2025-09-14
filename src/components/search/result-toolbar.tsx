
'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { ProviderResult } from '@/types/search';
import { Copy } from 'lucide-react';

interface ResultToolbarProps {
  results: ProviderResult[];
}

export function ResultToolbar({ results }: ResultToolbarProps) {
  const { toast } = useToast();

  const handleCopyAll = () => {
    const successfulResults = results.filter((r) => r.status === 'success' && r.resultText);
    if (successfulResults.length === 0) {
      toast({
        title: 'Nothing to copy',
        description: 'There are no successful results to copy.',
      });
      return;
    }
    const textToCopy = successfulResults
      .map((r) => `--- ${r.name} ---\n\n${r.resultText}`)
      .join('\n\n');
      
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: 'Copied to clipboard!',
      description: `Copied ${successfulResults.length} results.`,
    });
  };

  return (
    <div className="flex w-full items-center justify-end">
      <Button variant="outline" onClick={handleCopyAll}>
        <Copy className="mr-2 h-4 w-4" />
        Copy All
      </Button>
    </div>
  );
}
