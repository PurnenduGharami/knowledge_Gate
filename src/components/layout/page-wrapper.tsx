
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { User, Home } from "lucide-react";
import { useAppContext } from '@/contexts/AppContext';

export function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { state: sidebarState } = useSidebar();
    const { user } = useAppContext();
    const isChatPage = pathname.startsWith('/chat/');
    const isHistoryPage = pathname === '/main/history';
    const isProfilePage = pathname === '/main/profile';

    // On the login page (when user is null), we don't want to show the sidebar or profile buttons.
    const showLayoutElements = !!user;

    if (isChatPage) {
        return <main className="w-full">{children}</main>;
    }

    const SidebarToggleButton = () => (
        <>
            {/* This trigger is for mobile to open the sheet */}
            <div className="md:hidden">
                <SidebarTrigger className="h-8 w-8" />
            </div>
            {/* This trigger is for desktop to show the sidebar when collapsed */}
            {sidebarState === 'collapsed' && (
                <div className="hidden md:block">
                    <SidebarTrigger className="h-8 w-8" />
                </div>
            )}
        </>
    );
    
    return (
        <SidebarInset className="flex-grow flex flex-col relative overflow-x-hidden">
            {showLayoutElements && (
                <>
                    {/* The left-side button has been removed from here and relocated to the right. */}

                    <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                        {(isHistoryPage || isProfilePage) && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <Link href="/">
                                    <Home className="h-4 w-4" />
                                    <span className="sr-only">Home</span>
                                </Link>
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href="/main/profile">
                                <User className="h-4 w-4" />
                                <span className="sr-only">Profile</span>
                            </Link>
                        </Button>
                        {/* The Sidebar toggle button is now here, at the end of the group. */}
                        <SidebarToggleButton />
                    </div>
                </>
            )}
            {children}
        </SidebarInset>
    );
}
