
'use client';

import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { useModelSelection } from '@/hooks/useModelSelection';
import { Badge } from '@/components/ui/badge';
import { Coins, History } from 'lucide-react';
import { formatSparksDetailed } from '@/lib/credits';
import { ScrollArea } from '@/components/ui/scroll-area';

const MAX_TRANSACTIONS_TO_SHOW = 10;

export function TransactionHistory() {
  const { transactions, userDataLoading } = useAppContext();
  const { allModels, isLoading: modelsLoading } = useModelSelection();

  const getModelName = (id: string) => {
    return allModels.find(m => m.id === id)?.name || id;
  };

  const recentTransactions = transactions.slice(0, MAX_TRANSACTIONS_TO_SHOW);
  const isLoading = userDataLoading || modelsLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Recent Transactions
        </CardTitle>
        <CardDescription>Your last {MAX_TRANSACTIONS_TO_SHOW} Chaos Spark transactions.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="border rounded-md">
            <ScrollArea className="h-72">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Sparks</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {!isLoading && recentTransactions.length > 0 ? (
                        recentTransactions.map(tx => (
                        <TableRow key={tx.id}>
                            <TableCell>
                                <div className="font-medium">{getModelName(tx.modelUsed)}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                                    <span>{tx.tokensUsed} tokens</span>
                                    <Badge variant="outline" className="capitalize">{tx.searchType}</Badge>
                                    <span>{formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                                <div className="flex items-center justify-end gap-1">
                                    <Coins className="h-3 w-3" />
                                    {formatSparksDetailed(tx.sparksCharged)}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                            {isLoading ? "Loading transactions..." : "No transactions yet."}
                            </TableCell>
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
