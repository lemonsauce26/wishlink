import { AppHeader } from "@/components/layout/app-header";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-4 py-24 text-center space-y-3">
        <p className="text-4xl">🔍</p>
        <p className="font-medium">This page is not available</p>
        <p className="text-sm text-muted-foreground">
          The page you&apos;re looking for could not be found.
        </p>
      </main>
    </div>
  );
}
