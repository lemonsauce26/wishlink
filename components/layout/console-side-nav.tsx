"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

const navItems = [
  { href: "/console/dashboard", icon: LayoutDashboard, label: "Dashboard" },
];

export function ConsoleSideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden sm:flex flex-col fixed left-0 top-14 bottom-0 w-56 border-r border-border bg-background z-30">
      <nav className="p-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-emerald-600" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
