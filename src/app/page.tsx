'use client';

import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { KnowledgeGate } from '@/components/search/knowledge-gate';
import { Skeleton } from '@/components/ui/skeleton';
import { BookKey, UserPlus, LogIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';


export default function Home() {
  const { 
    user, 
    isLoading, 
    error, 
    signInWithEmailAndPassword,
    signUpWithEmailAndPassword,
    signInAsGuest,
  } = useAppContext();
  
  const { toast } = useToast();
  const [authMode, setAuthMode] = React.useState<'signin' | 'signup'>('signin');

  React.useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error,
      });
    }
  }, [error, toast]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (authMode === 'signup') {
        const confirmPassword = formData.get('confirmPassword') as string;
        if (password !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Passwords do not match',
                description: 'Please ensure your passwords match.',
            });
            return;
        }
        signUpWithEmailAndPassword(email, password);
    } else {
        signInWithEmailAndPassword(email, password);
    }
  }

  const LoadingState = () => (
    <div className="flex w-full flex-grow items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-4 animate-pulse">
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
          <div className="pt-4 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
    </div>
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return (
      <div className="flex w-full flex-grow flex-col items-center justify-center p-4 space-y-8">
        <div className="text-center space-y-4">
          <BookKey className="mx-auto h-16 w-16 text-primary" />
          <div>
            <h1 className="text-4xl font-bold font-mono">Welcome to Knowledge Gate</h1>
            <p className="text-muted-foreground">A portal that reveals diverse answers from around the world</p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <Card>
            <CardHeader>
                <CardTitle>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</CardTitle>
                <CardDescription>
                    {authMode === 'signin' 
                        ? 'Enter your credentials to access your account.'
                        : 'Create a new account to save your progress.'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                     {authMode === 'signup' && (
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" required />
                        </div>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                         {authMode === 'signin' ? (
                            <>
                                <LogIn className="mr-2 h-4 w-4" /> Sign In
                            </>
                        ) : (
                            <>
                                <UserPlus className="mr-2 h-4 w-4" /> Create Account
                            </>
                        )}
                    </Button>
                </form>
                 <div className="mt-4 text-center text-sm">
                    {authMode === 'signin' ? (
                        <>
                            Don&apos;t have an account?{' '}
                            <Button variant="link" className="p-0 h-auto" onClick={() => setAuthMode('signup')}>
                                Sign up
                            </Button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <Button variant="link" className="p-0 h-auto" onClick={() => setAuthMode('signin')}>
                                Sign in
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
          </Card>
          
           <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or
                    </span>
                </div>
            </div>

            <Button variant="secondary" className="w-full" onClick={signInAsGuest} disabled={isLoading}>
                Continue as Guest
            </Button>
        </div>
      </div>
    );
  }

  return <KnowledgeGate />;
}
