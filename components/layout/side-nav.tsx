"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LayoutList } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/wishlists", icon: LayoutList, label: "My Wishlists" },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden sm:flex flex-col fixed left-0 top-14 bottom-0 w-56 border-r border-border bg-background z-30">
      <nav className="p-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
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
