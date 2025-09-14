
import type {Metadata} from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from '@/contexts/AppContext';
import { ProjectSidebar } from '@/components/project/project-sidebar';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { cn } from '@/lib/utils';
import { SidebarProvider } from '@/components/ui/sidebar';


const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Knowledge Gate',
  description: 'A gateway to the world’s collective intelligence.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('bg-background font-sans antialiased', inter.variable, jetbrainsMono.variable)}>
        <AppProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <ProjectSidebar />
              <PageWrapper>
                {children}
              </PageWrapper>
            </div>
            <Toaster />
          </SidebarProvider>
        </AppProvider>
      </body>
    </html>
  );
}
