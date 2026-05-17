"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogOut, Settings, ChevronRight, ShieldCheck, UserCircle2 } from "lucide-react";
import { PrivacyToggle } from "@/components/ui/PrivacyToggle";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { Avatar } from "@/components/avatar";
import { cn } from "@/utils/cn";

interface ProfilePopoverProps {
  open: boolean;
  userEmail?: string | null;
  fullName: string;
  profileLabel: string;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export function ProfilePopover({
  open,
  userEmail,
  fullName,
  profileLabel,
  isCollapsed,
  onClose,
  onToggleSidebar,
  onLogout,
}: ProfilePopoverProps) {
  const { privacyMode, togglePrivacyMode } = usePrivacy();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mb-3 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-300 ease-out",
        isCollapsed
          ? "w-80 left-20 bottom-full"
          : "w-80 sm:w-96 left-0 bottom-full"
      )}
    >
      <div ref={panelRef} className="space-y-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <Avatar firstName={fullName.split(" ")[0]} lastName={fullName.split(" ")[1] || ""} className="h-14 w-14" />
              <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border border-slate-950 bg-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.35)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-white">{fullName}</p>
              <p className="truncate text-sm text-slate-400">{privacyMode ? "*****@*****" : userEmail ?? "No email"}</p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-sky-300 shadow-[0_10px_30px_-25px_rgba(59,130,246,0.8)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            {profileLabel}
          </div>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => {
              router.push("/settings");
              onClose();
            }}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100 transition-all duration-200 hover:border-sky-400/30 hover:bg-slate-900"
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-sky-300" />
              Account Settings
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          <PrivacyToggle enabled={privacyMode} onChange={togglePrivacyMode} />

          <button
            type="button"
            onClick={() => {
              onToggleSidebar();
              onClose();
            }}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 transition-all duration-200 hover:border-sky-400/30 hover:bg-slate-900"
          >
            <span className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-slate-300" />
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center justify-between rounded-2xl border border-transparent bg-rose-500/15 px-4 py-3 text-sm text-rose-200 transition-all duration-200 hover:border-rose-500/20 hover:bg-rose-500/25"
          >
            <span className="flex items-center gap-2">
              <LogOut className="h-4 w-4 text-rose-300" />
              Logout
            </span>
            <ChevronRight className="h-4 w-4 text-rose-200" />
          </button>
        </div>
      </div>
    </div>
  );
}
