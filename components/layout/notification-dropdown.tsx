"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

type NotifItem = {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  text: string;
  href: string;
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export function NotificationDropdown({ unreadCount }: { unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [arrowRight, setArrowRight] = useState(12);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleToggle() {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const bellCenterFromRight = window.innerWidth - rect.left - rect.width / 2;
      const dropdownRightOffset = 8; // right-2
      setArrowRight(Math.max(8, bellCenterFromRight - dropdownRightOffset - 8));
    }
    setOpen(prev => !prev);
    if (!loaded) {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="fixed top-14 right-2 w-80 max-w-[calc(100vw-1rem)] z-50">
          {/* 말풍선 화살표 */}
          <div
            className="absolute -top-[9px] w-4 h-4 rotate-45 bg-background border-t border-l border-border"
            style={{ right: `${arrowRight}px` }}
          />

          {/* 패널 */}
          <div className="rounded-xl border border-border bg-background shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold">Notifications</span>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all →
              </Link>
            </div>

            {loading && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            )}

            {!loading && notifications.length > 0 && (
              <div className="divide-y divide-border">
                {notifications.map(n => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => {
                      setOpen(false);
                      if (!n.read) {
                        setNotifications(prev =>
                          prev.map(item => item.id === n.id ? { ...item, read: true } : item)
                        );
                        fetch("/api/notifications", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: n.id }),
                        });
                      }
                    }}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors relative"
                  >
                    {!n.read && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600" />
                    )}
                    <p className="text-sm leading-snug text-foreground flex-1 min-w-0 line-clamp-2">
                      {n.text}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
