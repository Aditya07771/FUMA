"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Plus } from "lucide-react";

interface HeaderProps {
  user: { email?: string | null; name?: string | null };
  highRiskCount?: number;
}

function initials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

export function Header({ user, highRiskCount = 0 }: HeaderProps) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-6 flex h-14 items-center justify-between gap-4">

        {/* Left — logo + nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            FUME
          </Link>
          <nav className="hidden md:flex gap-5 text-sm">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/clients" className="text-muted-foreground hover:text-foreground transition-colors">
              Clients
            </Link>
          </nav>
        </div>

        {/* Right — actions + user */}
        <div className="flex items-center gap-2">

          {/* High-risk bell */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Bell className="h-4 w-4" />
            </Button>
            {highRiskCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                {highRiskCount > 9 ? "9+" : highRiskCount}
              </span>
            )}
          </div>

          {/* New analysis quick button */}
          <Button
            size="sm"
            className="h-8 gap-1.5 hidden sm:flex"
            onClick={() => router.push("/dashboard")}
          >
            <Plus className="h-3.5 w-3.5" />
            New analysis
          </Button>

          {/* Divider */}
          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

          {/* User initials */}
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium select-none">
              {initials(user.name, user.email)}
            </div>
            <span className="text-sm text-muted-foreground hidden md:inline truncate max-w-[140px]">
              {user.name ?? user.email}
            </span>
          </div>

          {/* Sign out */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}