
'use client';

import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DataExportCard() {
  const { profile, projects, history } = useAppContext();
  const { toast } = useToast();

  const handleExport = () => {
    // Construct the full data object from the unified context
    const dataToExport = {
      profile,
      projects,
      history,
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `knowlege-gate-export-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Data Exported', description: 'Your data has been downloaded as a JSON file.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
        <CardDescription>Download a copy of all your profile settings, projects, and history.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleExport} className="w-full">
          <Download className="mr-2 h-4 w-4" /> Export My Data
        </Button>
      </CardContent>
    </Card>
  );
}
