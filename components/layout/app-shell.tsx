import { AppHeader } from "@/components/layout/app-header";
import { SideNav } from "@/components/layout/side-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <SideNav />
      <div className="sm:pl-56">
        {children}
      </div>
    </div>
  );
}
