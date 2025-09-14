
'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, Edit, UserCircle, LogOut } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export function UserInfoCard() {
  const { profile, updateProfile, isLoading, logout } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading) {
        setName(profile.name);
    }
  }, [profile.name, isLoading]);

  const handleSave = () => {
    if (name.trim()) {
      updateProfile({ name: name.trim() });
      setIsEditing(false);
      toast({ title: "Profile updated!" });
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
        handleSave();
    } else {
        setName(profile.name); // Reset to current profile name on edit start
        setIsEditing(true);
    }
  }

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCircle className="h-5 w-5 text-muted-foreground" /> User Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <Skeleton className="h-6 w-3/4" />
               <Skeleton className="h-4 w-1/2" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCircle className="h-5 w-5 text-muted-foreground" />
            User Information
          </CardTitle>
          <CardDescription>View and manage your profile details.</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={handleEditToggle}>
          {isEditing ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          <span className="sr-only">{isEditing ? "Save" : "Edit"}</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          {isEditing ? (
            <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
            />
          ) : (
            <p className="text-lg font-medium">{profile.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <p className="text-sm text-muted-foreground">{profile.email || 'Guest Account'}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
        </Button>
      </CardFooter>
    </Card>
  );
}
