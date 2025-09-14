
'use client';

import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ArchiveRestore, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Project } from '@/types/search';
import { useState } from 'react';

export function ArchivedProjectsManager() {
  const { projects, deleteProject, updateProject } = useAppContext();
  const { toast } = useToast();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const archivedProjects = projects.filter(p => p.isArchived);

  const handleRestore = (id: string) => {
    updateProject(id, { isArchived: false });
    toast({ title: 'Project Restored', description: 'The project has been moved back to your active projects.' });
  };

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      toast({ title: 'Project Deleted', description: `"${projectToDelete.name}" and all its history have been permanently deleted.`, variant: 'destructive' });
      setProjectToDelete(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Archived Projects</CardTitle>
        <CardDescription>View, restore, or permanently delete your archived projects.</CardDescription>
      </CardHeader>
      <CardContent>
        {archivedProjects.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {archivedProjects.map(project => (
              <AccordionItem key={project.id} value={project.id}>
                <AccordionTrigger>{project.name}</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Archived on: {format(new Date(project.createdAt), 'PPP')}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleRestore(project.id)}>
                      <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setProjectToDelete(project)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">You have no archived projects.</p>
        )}
      </CardContent>
       <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{projectToDelete?.name}" and all its associated history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
