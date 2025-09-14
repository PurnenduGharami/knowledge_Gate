// This layout is simplified to avoid duplication, as the AppHeader is now in the root layout.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
