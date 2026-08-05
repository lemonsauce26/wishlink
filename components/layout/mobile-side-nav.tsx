"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X, LayoutDashboard, Star, Inbox, Gift, Compass, Users, Heart } from "lucide-react";
import Link from "next/link";

export function MobileNav() {
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
              <Link href="/dashboard" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors">
                <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                Dashboard
              </Link>
              <Link href="/wishlists" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors">
                <Star className="w-4 h-4 text-muted-foreground" />
                My Wishlists
              </Link>
              <Link href="/shared" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors">
                <Inbox className="w-4 h-4 text-muted-foreground" />
                Shared
              </Link>
              <Link href="/explore" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors">
                <Compass className="w-4 h-4 text-muted-foreground" />
                Explore
              </Link>
              <Link href="/following" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors">
                <Users className="w-4 h-4 text-muted-foreground" />
                Following
              </Link>
              <Link href="/liked" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors">
                <Heart className="w-4 h-4 text-muted-foreground" />
                Liked
              </Link>
              <Link href="/reservations" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors">
                <Gift className="w-4 h-4 text-muted-foreground" />
                My Reservations
              </Link>
            </nav>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
