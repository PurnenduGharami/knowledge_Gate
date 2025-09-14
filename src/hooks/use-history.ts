
'use client';

import { useMemo } from 'react';
import { useProjectContext } from '@/contexts/project-context';
import type { HistoryItem } from '@/types/search';
import { isToday, isYesterday, format } from 'date-fns';

type HistoryFilters = {
  projectId: string;
  search: string;
  showFavorites: boolean;
};

type GroupedHistory = {
  [projectName: string]: {
    [dateGroup: string]: HistoryItem[];
  };
};

export function useHistory(filters: HistoryFilters) {
  const { history, projects, ...rest } = useProjectContext();

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

  return {
    ...rest,
    projects,
    groupedHistory,
    totalHistoryCount: history.length,
    filteredHistoryCount: filteredHistory.length,
  };
}
