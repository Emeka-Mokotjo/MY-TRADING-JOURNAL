"use client";

import { cn } from "@/utils/cn";

interface PrivacyToggleProps {
  enabled: boolean;
  onChange: () => void;
  label?: string;
}

export function PrivacyToggle({ enabled, onChange, label = "Privacy Mode" }: PrivacyToggleProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="inline-flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-sky-400/30 hover:bg-slate-800"
    >
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-xs text-slate-400">{enabled ? "Sensitive values are hidden" : "Full detail mode"}</p>
      </div>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors",
          enabled ? "bg-sky-500" : "bg-slate-700"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
            enabled ? "translate-x-5" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}
