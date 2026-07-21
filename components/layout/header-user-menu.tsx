"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = { displayName: string; avatarUrl: string | null };

export function HeaderUserMenu({ displayName, avatarUrl }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        <div className="w-6 h-6 rounded-full overflow-hidden bg-secondary border border-border shrink-0 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
        <span className="truncate max-w-[120px] sm:max-w-none">{displayName}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-border bg-background shadow-lg py-1 z-50">
          <Link
            href="/mypage"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-secondary transition-colors"
          >
            My Page
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-secondary transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
