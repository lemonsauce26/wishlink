"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X, LayoutDashboard, Star, Inbox, Gift, Compass, Users, Heart, type LucideIcon } from "lucide-react";
import Link from "next/link";

const navSets: Record<string, { href: string; icon: LucideIcon; label: string }[]> = {
  default: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/wishlists", icon: Star, label: "My Wishlists" },
    { href: "/shared", icon: Inbox, label: "Shared" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/following", icon: Users, label: "Following" },
    { href: "/liked", icon: Heart, label: "Liked" },
    { href: "/reservations", icon: Gift, label: "My Reservations" },
  ],
  console: [
    { href: "/console/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  ],
};

export function MobileNav({ variant }: { variant?: string } = {}) {
  const items = navSets[variant ?? "default"] ?? navSets.default;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="sm:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mounted && createPortal(
        <>
          {/* Dim overlay */}
          <div
            className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-500 ease-out sm:hidden ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-xl will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-border">
              <span className="text-sm font-medium">Menu</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="p-4 space-y-1">
              {items.map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
