import { AppHeader } from "@/components/layout/app-header";
import { ConsoleSideNav } from "@/components/layout/console-side-nav";
export function ConsoleShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <AppHeader badge="Console" mobileNavVariant="console" />
      <ConsoleSideNav />
      <div className="sm:pl-56">
        {children}
      </div>
    </div>
  );
}
