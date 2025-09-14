
'use client';

import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useModelSelection } from '@/hooks/useModelSelection';
import { ScrollArea } from '@/components/ui/scroll-area';

export function UsageTable() {
  const { usageLogs } = useAppContext();
  const { allModels } = useModelSelection();

  const getModelName = (id: string) => {
    return allModels.find(m => m.id === id)?.name || id;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Usage</CardTitle>
        <CardDescription>An approximate history of your model usage.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
            <ScrollArea className="h-64">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Last Used</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {usageLogs.length > 0 ? (
                        usageLogs
                            .sort((a,b) => b.lastUsed - a.lastUsed)
                            .map(log => (
                            <TableRow key={log.modelId}>
                                <TableCell className="font-medium">{getModelName(log.modelId)}</TableCell>
                                <TableCell className="text-right">{log.requests}</TableCell>
                                <TableCell className="text-right">{format(new Date(log.lastUsed), 'PPP p')}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">No usage data recorded yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
