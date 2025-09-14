
'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Home, History, User, Archive, ArchiveRestore, ChevronDown, LogOut } from 'lucide-react';
import type { Project } from '@/types/search';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';

export function ProjectSidebar() {
    const pathname = usePathname();
    const { 
      projects, 
      activeProjectId, 
      setActiveProjectId, 
      addProject, 
      updateProject, 
      deleteProject, 
      user,
      logout,
    } = useAppContext();

    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editingProjectName, setEditingProjectName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => { setHasMounted(true); }, []);
    
    useEffect(() => {
        if(editingProjectId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingProjectId]);

    if (!user) {
        return null;
    }

    const navItems = [
        { href: '/', label: 'Home', icon: Home, show: !pathname.startsWith('/chat/') },
        { href: '/main/history', label: 'History', icon: History, show: true },
        { href: '/main/profile', label: 'Profile', icon: User, show: true },
    ];

    const handleNewProject = (name: string) => {
        addProject(name);
        setIsNewProjectDialogOpen(false);
    };
    
    const handleStartEdit = (project: Project) => {
        if(project.isDefault) return;
        setEditingProjectId(project.id);
        setEditingProjectName(project.name);
    }

    const handleCancelEdit = () => {
        setEditingProjectId(null);
        setEditingProjectName('');
    }

    const handleSaveEdit = () => {
        if(editingProjectId && editingProjectName.trim()) {
            updateProject(editingProjectId, { name: editingProjectName.trim() });
        }
        handleCancelEdit();
    }
    
    const handleSignOut = async () => {
        await logout();
    };

    const activeProjects = projects.filter(p => !p.isArchived);
    const archivedProjects = projects.filter(p => p.isArchived);

    if (pathname.startsWith('/chat/')) {
        return null;
    }

    return (
        <>
            <Sidebar side="left" collapsible="offcanvas" variant="sidebar">
                <SidebarHeader className="flex items-center justify-between">
                     <Link href="/" className="flex items-center space-x-2 p-2">
                        <span className="font-bold text-lg">
                            KnowledgeGate
                        </span>
                    </Link>
                    <SidebarTrigger/>
                </SidebarHeader>

                <SidebarContent className="p-0 flex flex-col h-full">
                    {/* Section 1: Nav Links */}
                    <div className="p-2 pb-4">
                        <SidebarMenu>
                            {navItems.filter(i => i.show).map(item => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.label}
                                        className={cn(hasMounted && pathname === item.href && "bg-accent font-medium text-accent-foreground")}
                                    >
                                        <Link href={item.href}>
                                            <item.icon />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </div>

                    <SidebarSeparator />
                    
                    {/* Section 2: Active Projects */}
                    <div className="flex-1 min-h-0 p-2 pb-4 overflow-y-auto">
                        <div className='flex items-center justify-between pb-2'>
                            <h2 className="text-base font-semibold group-data-[collapsible=icon]:hidden">Projects</h2>
                            <Button variant="ghost" size="icon" className='h-7 w-7' onClick={() => setIsNewProjectDialogOpen(true)}>
                                <Plus className="h-4 w-4" /> 
                                <span className="sr-only">New Project</span>
                            </Button>
                        </div>
                        <SidebarMenu>
                            {activeProjects.map(project => (
                                <SidebarMenuItem key={project.id}>
                                    {editingProjectId === project.id ? (
                                        <div className='flex items-center gap-2 p-2 w-full'>
                                            <Input 
                                                ref={inputRef}
                                                value={editingProjectName}
                                                onChange={e => setEditingProjectName(e.target.value)}
                                                onBlur={handleSaveEdit}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleSaveEdit();
                                                    if (e.key === 'Escape') handleCancelEdit();
                                                }}
                                                className='h-8'
                                            />
                                        </div>
                                    ) : (
                                    <>
                                        <SidebarMenuButton
                                            onClick={() => setActiveProjectId(project.id)}
                                            isActive={project.id === activeProjectId}
                                            tooltip={project.name}
                                            className="w-full"
                                        >
                                            <span className="truncate flex-grow text-left">{project.name}</span>
                                        </SidebarMenuButton>
                                        
                                        {!project.isDefault && (
                                            <div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover/menu-item:opacity-100 transition-opacity z-10'>
                                                <Button variant="ghost" size="icon" className='h-6 w-6' onClick={(e) => { e.stopPropagation(); handleStartEdit(project) }}>
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className='h-6 w-6' onClick={(e) => { e.stopPropagation(); updateProject(project.id, { isArchived: true }) }}>
                                                    <Archive className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className='h-6 w-6' onClick={(e) => { e.stopPropagation(); setProjectToDelete(project) }}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                    )}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </div>

                    {/* Section 3: Archived Projects */}
                    {archivedProjects.length > 0 && (
                        <>
                            <SidebarSeparator />
                            <div className="flex-shrink-0 p-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild className="w-full">
                                        <SidebarMenuButton tooltip="Archived Projects">
                                            <Archive />
                                            <span>Archived</span>
                                            <ChevronDown className="ml-auto transition-none group-data-[state=open]:rotate-180 group-data-[collapsible=icon]:hidden" />
                                        </SidebarMenuButton>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="right" align="start" className="w-56 max-h-60 overflow-y-auto">
                                        {archivedProjects.map(project => (
                                            <DropdownMenuItem key={project.id} onSelect={(e) => e.preventDefault()} className="flex justify-between items-center group">
                                                <span className="truncate opacity-70">{project.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                    onClick={() => updateProject(project.id, { isArchived: false })}
                                                >
                                                    <ArchiveRestore className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </>
                    )}
                    <div className="mt-auto p-2">
                       <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start">
                            <LogOut />
                            <span>Sign Out</span>
                        </Button>
                    </div>
                </SidebarContent>
            </Sidebar>

            {/* Dialogs for project management */}
            <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>
                            Give your new project a name to start organizing your queries.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const name = formData.get('projectName') as string;
                        handleNewProject(name);
                    }}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="projectName" className="text-right">Name</Label>
                                <Input id="projectName" name="projectName" className="col-span-3" required autoFocus />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsNewProjectDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Create Project</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Project?</DialogTitle>
                        <DialogDescription>
                           Are you sure you want to delete the project "{projectToDelete?.name}"? All associated history will be lost. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setProjectToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => {
                            if (projectToDelete) {
                                deleteProject(projectToDelete.id);
                                setProjectToDelete(null);
                            }
                        }}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
