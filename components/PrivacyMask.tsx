"use client";

import { usePrivacy } from "@/contexts/PrivacyContext";

interface PrivacyMaskProps {
  value: string | number;
  masked?: string;
  className?: string;
  hiddenClassName?: string;
}

/**
 * Display a value with privacy masking on toggle
 */
export function PrivacyMask({
  value,
  masked = "*****",
  className = "",
  hiddenClassName = "blur-sm",
}: PrivacyMaskProps) {
  const { privacyMode } = usePrivacy();

  return (
    <span className={privacyMode ? hiddenClassName : className}>
      {privacyMode ? masked : value}
    </span>
  );
}
