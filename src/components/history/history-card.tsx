
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Star, Trash, RefreshCw, Share, FileJson, FileText, ChevronDown, ChevronUp, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportAsJson, exportAsMarkdown } from '@/utils/export';
import { useToast } from '@/hooks/use-toast';
import type { HistoryItem, Project, ChatMessage } from '@/types/search';
import { ResultCard } from '../search/result-card';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { useAppContext } from '@/contexts/AppContext';


interface HistoryCardProps {
  item: HistoryItem;
}

export function HistoryCard({ item }: HistoryCardProps) {
  const { toast } = useToast();
  const { projects, updateHistoryItem, deleteHistoryItem } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState(item.notes || '');

  const project = projects.find(p => p.id === item.projectId);

  const handleNotesBlur = () => {
    if (notes !== item.notes) {
      updateHistoryItem(item.id, { notes });
      toast({ title: "Note saved!" });
    }
  };
  
  const handleFavoriteToggle = () => {
    updateHistoryItem(item.id, { isFavorite: !item.isFavorite });
    toast({ title: item.isFavorite ? 'Removed from favorites' : 'Added to favorites' });
  };
  
  const handleDelete = () => {
    deleteHistoryItem(item.id);
    toast({ title: 'History item deleted' });
  };

  const handleExport = (format: 'json' | 'markdown') => {
    const CHATS_STORAGE_KEY = 'knowledgeGateChats';
    const exportableItem: HistoryItem & { projectName?: string; chatMessages?: ChatMessage[] } = {
        ...item,
        projectName: project?.name,
    };

    if (item.chatContext?.chatId) {
        try {
            const allChats: Record<string, ChatMessage[]> = JSON.parse(window.localStorage.getItem(CHATS_STORAGE_KEY) || '{}');
            const chatMessages = allChats[item.chatContext.chatId];
            if (chatMessages) {
                exportableItem.chatMessages = chatMessages;
            }
        } catch (error) {
            console.error("Failed to load chat messages for export", error);
            toast({
                variant: "destructive",
                title: "Could not load chat history",
                description: "There was an error reading the chat messages for this entry."
            })
        }
    }

    if (format === 'json') {
      exportAsJson(exportableItem);
    } else {
      exportAsMarkdown(exportableItem);
    }
    toast({ title: `Exported as ${format.toUpperCase()}` });
  };
  
  const handleProjectChange = (newProjectId: string) => {
    if (item.projectId !== newProjectId) {
      updateHistoryItem(item.id, { projectId: newProjectId });
      toast({ title: `Moved to "${projects.find(p => p.id === newProjectId)?.name}"` });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg font-bold flex-1" title={item.query}>
            {isExpanded || item.query.length <= 100
              ? item.query
              : `${item.query.substring(0, 100)}...`}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFavoriteToggle}>
              <Star className={cn("h-4 w-4", item.isFavorite && "fill-yellow-400 text-yellow-500")} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Share className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <FileJson className="mr-2 h-4 w-4" /> Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('markdown')}>
                  <FileText className="mr-2 h-4 w-4" /> Export as Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
             <Link href={`/?rerun_query=${encodeURIComponent(item.query)}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </Link>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <ProjectSwitcher
                currentProject={project}
                projects={projects}
                onProjectChange={handleProjectChange}
            />
          <Badge variant="outline">{item.mode}</Badge>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-4">
            {item.results.map((result, index) => (
              <ResultCard key={`${item.id}-result-${index}`} result={result} searchMode={item.mode} />
            ))}
          </div>
          {item.chatContext?.chatId && (
            <div className="flex justify-start pt-2">
              <Link href={`/chat/${item.chatContext.chatId}`} passHref>
                <Button variant="secondary" size="sm" className="mt-4">
                  Continue this Chat
                </Button>
              </Link>
            </div>
          )}
          <div>
            <Label htmlFor={`notes-${item.id}`} className="text-sm font-medium">Notes</Label>
            <Textarea
              id={`notes-${item.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add your thoughts here..."
              className="mt-1"
            />
          </div>
        </CardContent>
      )}

      <CardFooter>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
        </p>
      </CardFooter>
    </Card>
  );
}

function ProjectSwitcher({ currentProject, projects, onProjectChange }: {
    currentProject?: Project,
    projects: Project[],
    onProjectChange: (projectId: string) => void
}) {
    const [open, setOpen] = useState(false)
    const activeProjects = projects.filter(p => !p.isArchived);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between h-auto py-1 px-2 text-xs"
                >
                    {currentProject ? currentProject.name : "Select project..."}
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search projects..." />
                    <CommandEmpty>No project found.</CommandEmpty>
                    <CommandGroup>
                        {activeProjects.map((project) => (
                            <CommandItem
                                key={project.id}
                                value={project.name}
                                onSelect={() => {
                                    onProjectChange(project.id)
                                    setOpen(false)
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        currentProject?.id === project.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {project.name}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
