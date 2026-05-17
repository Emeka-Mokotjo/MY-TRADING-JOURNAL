"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { ProfilePopover } from "@/components/sidebar/ProfilePopover";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { cn } from "@/utils/cn";

interface ProfileFooterProps {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isCollapsed: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export function ProfileFooter({
  email,
  firstName,
  lastName,
  isCollapsed,
  onToggleSidebar,
  onLogout,
}: ProfileFooterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { privacyMode } = usePrivacy();

  const fullName = useMemo(() => {
    if (firstName || lastName) {
      return `${firstName ?? ""} ${lastName ?? ""}`.trim();
    }
    if (email) {
      return email.split("@")[0];
    }
    return "Trader";
  }, [firstName, lastName, email]);

  const badgeLabel = useMemo(() => {
    if (fullName.toLowerCase().includes("pro")) return "PRO TRADER";
    return "BemoEdge Pro";
  }, [fullName]);

  return (
    <div className={cn(
      "relative px-3 pb-3 pt-2.5 transition-all duration-300 ease-out",
      isCollapsed ? "flex flex-col items-center" : ""
    )}>
      <button
        type="button"
        className={cn(
          "group relative flex items-center rounded-2xl border border-white/10 bg-white/5 text-left transition-all duration-300 ease-out hover:border-sky-400/20 hover:bg-white/10",
          isCollapsed
            ? "w-12 h-12 justify-center p-0"
            : "w-full gap-3 px-4 py-3"
        )}
        onClick={() => setIsOpen((value) => !value)}
        title={isCollapsed ? fullName : undefined}
      >
        <div className="relative flex-shrink-0">
          <Avatar
            firstName={firstName ?? fullName}
            lastName={lastName ?? ""}
            className={cn(
              "shadow-[0_0_18px_rgba(59,130,246,0.18)]",
              isCollapsed ? "h-10 w-10" : "h-11 w-11"
            )}
          />
          <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.35)]" />
        </div>

        {/* Info section - fades out when collapsed */}
        <div className={cn(
          "min-w-0 transition-all duration-300 ease-out overflow-hidden",
          isCollapsed ? "opacity-0 max-w-0 w-0" : "opacity-100 max-w-full w-auto"
        )}>
          <p className="truncate text-sm font-semibold text-white">{fullName}</p>
          <p className="truncate text-xs text-slate-400">{badgeLabel}</p>
        </div>

        {/* Chevron icon - only show when expanded */}
        <span className={cn(
          "text-slate-400 transition-all duration-300 ease-out flex-shrink-0",
          isCollapsed ? "opacity-0 max-w-0 w-0" : "opacity-100 ml-auto"
        )}>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0"
          )} />
        </span>
      </button>

      {/* Popover */}
      <div className="mt-3">
        <ProfilePopover
          open={isOpen}
          userEmail={email}
          fullName={fullName}
          profileLabel={badgeLabel}
          isCollapsed={isCollapsed}
          onClose={() => setIsOpen(false)}
          onToggleSidebar={onToggleSidebar}
          onLogout={onLogout}
        />
      </div>

      {/* Privacy mode indicator - only show when expanded */}
      <div className={cn(
        "mt-3 text-xs text-slate-500 sm:block transition-all duration-300 ease-out overflow-hidden",
        isCollapsed
          ? "opacity-0 max-h-0"
          : "opacity-100 max-h-20"
      )}>
        {privacyMode ? "Privacy mode is active — sensitive values are hidden." : "Privacy mode is off — full performance detail is visible."}
      </div>
    </div>
  );
}
