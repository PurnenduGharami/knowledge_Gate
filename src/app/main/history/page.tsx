
'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HistoryCard } from '@/components/history/history-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BookCopy, ChevronDown, Search, Trash2, Wand } from 'lucide-react';
import { isToday, isYesterday, format } from 'date-fns';
import type { HistoryItem } from '@/types/search';


type GroupedHistory = {
  [projectName: string]: {
    [dateGroup: string]: HistoryItem[];
  };
};

export default function HistoryPage() {
  const { projects, history, clearHistory } = useAppContext();
  const [filters, setFilters] = useState({
    projectId: 'all',
    search: '',
    showFavorites: false,
  });

  const handleFilterChange = (key: keyof typeof filters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const getGroupName = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const filteredHistory = useMemo(() => {
    return history
      .filter(item => {
        if (filters.showFavorites && !item.isFavorite) {
          return false;
        }
        if (filters.projectId !== 'all' && item.projectId !== filters.projectId) {
          return false;
        }
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const queryMatch = item.query.toLowerCase().includes(searchTerm);
          const notesMatch = item.notes?.toLowerCase().includes(searchTerm);
          const resultsMatch = item.results.some(r =>
            r.resultText?.toLowerCase().includes(searchTerm)
          );
          if (!queryMatch && !notesMatch && !resultsMatch) {
            return false;
          }
        }
        return true;
      })
      .map(item => ({
        ...item,
        projectName: projects.find(p => p.id === item.projectId)?.name || 'Unknown Project'
      }));
  }, [history, projects, filters]);

  const groupedHistory = useMemo(() => {
    return filteredHistory.reduce<GroupedHistory>((acc, item) => {
      const projectName = item.projectName;
      if (!acc[projectName]) {
        acc[projectName] = {};
      }
      
      const dateGroup = getGroupName(new Date(item.timestamp));
      if (!acc[projectName][dateGroup]) {
        acc[projectName][dateGroup] = [];
      }
      
      acc[projectName][dateGroup].push(item);
      return acc;
    }, {});
  }, [filteredHistory]);


  const activeProjects = projects.filter(p => !p.isArchived);
  const archivedProjects = projects.filter(p => p.isArchived);
  
  const totalHistoryCount = history.length;
  const filteredHistoryCount = filteredHistory.length;

  const noHistory = totalHistoryCount === 0;
  const noFilteredResults = !noHistory && filteredHistoryCount === 0;

  const defaultOpenAccordions = Object.keys(groupedHistory);

  const selectedProjectName = filters.projectId === 'all'
    ? 'All Projects'
    : projects.find(p => p.id === filters.projectId)?.name || 'Select a project';

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Gate Record</h1>
        <p className="text-muted-foreground mt-2">
          Track your knowledge, revisit past insights, and never lose your path.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" disabled={noHistory}>
                    <span>{selectedProjectName}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
                <DropdownMenuRadioGroup value={filters.projectId} onValueChange={(value) => handleFilterChange('projectId', value)}>
                    <DropdownMenuRadioItem value="all">All Projects</DropdownMenuRadioItem>
                    
                    {activeProjects.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Active Projects</DropdownMenuLabel>
                            {activeProjects.map(p => (
                                <DropdownMenuRadioItem key={p.id} value={p.id}>{p.name}</DropdownMenuRadioItem>
                            ))}
                        </>
                    )}

                    {archivedProjects.length > 0 && (
                       <>
                        <DropdownMenuSeparator />
                         <DropdownMenuSub>
                             <DropdownMenuSubTrigger>
                                 <span>Archived Projects</span>
                             </DropdownMenuSubTrigger>
                             <DropdownMenuPortal>
                                 <DropdownMenuSubContent className="max-h-96 overflow-y-auto">
                                     {archivedProjects.map(p => (
                                         <DropdownMenuRadioItem key={p.id} value={p.id}>{p.name}</DropdownMenuRadioItem>
                                     ))}
                                 </DropdownMenuSubContent>
                             </DropdownMenuPortal>
                         </DropdownMenuSub>
                       </>
                    )}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative sm:col-span-1 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search queries, notes, or results..."
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            className="pl-10"
            disabled={noHistory}
          />
        </div>

        <div className="flex items-center justify-start sm:justify-end space-x-2">
          <Switch
            id="favorites-only"
            checked={filters.showFavorites}
            onCheckedChange={checked => handleFilterChange('showFavorites', checked)}
            disabled={noHistory}
          />
          <Label htmlFor="favorites-only">Show Favorites</Label>
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        {!noHistory && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Clear All History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all of your history records across all projects.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearHistory}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <main>
        {noHistory ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookCopy className="mx-auto h-12 w-12" />
            <h2 className="mt-4 text-xl font-semibold">You haven't explored anything yet.</h2>
            <p>Your past queries will be recorded here for you to revisit.</p>
          </div>
        ) : noFilteredResults ? (
          <div className="text-center py-16 text-muted-foreground">
            <Wand className="mx-auto h-12 w-12" />
            <h2 className="mt-4 text-xl font-semibold">No entries match your filters.</h2>
            <p>Try adjusting your search or project filter.</p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-4" defaultValue={defaultOpenAccordions}>
            {Object.entries(groupedHistory).map(([projectName, dateGroups]) => (
                <AccordionItem key={projectName} value={projectName} className="border rounded-lg">
                    <AccordionTrigger className="text-xl font-bold px-4 py-3 hover:no-underline">
                        {projectName}
                    </AccordionTrigger>
                    <AccordionContent className="pt-0 p-4">
                        <div className="space-y-6">
                        {Object.entries(dateGroups).map(([dateGroup, items]) => (
                            <div key={dateGroup}>
                                <h2 className="mb-3 text-base font-semibold text-muted-foreground">{dateGroup}</h2>
                                <div className="space-y-4">
                                {items.map(item => (
                                    <HistoryCard
                                        key={item.id}
                                        item={item}
                                    />
                                ))}
                                </div>
                            </div>
                        ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
        )}
      </main>
    </div>
  );
}
