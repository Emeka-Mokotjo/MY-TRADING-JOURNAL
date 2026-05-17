"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  LineChart,
  BookOpen,
  Settings,
  ListPlus,
  Wallet,
  Menu,
  X,
  DollarSign,
  Trophy,
  PiggyBank,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/utils/supabase/client";

const navigationSections = [
  {
    label: "PERFORMANCE",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Analytics", href: "/analytics", icon: LineChart },
    ],
  },
  {
    label: "EXECUTION",
    items: [
      { name: "Trade Tracker", href: "/tracker", icon: ListPlus },
      { name: "Journal", href: "/journal", icon: BookOpen },
    ],
  },
  {
    label: "TREASURY",
    collapsible: true,
    key: "treasury",
    items: [
      { name: "Capital", href: "/capital", icon: Wallet },
      { name: "Payouts", href: "/payouts", icon: DollarSign },
      { name: "Money Management", href: "/money-management", icon: PiggyBank },
    ],
  },
  {
    label: "ACCOUNT",
    collapsible: true,
    key: "account",
    items: [
      { name: "Certificates", href: "/certificates", icon: Trophy },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, firstName, lastName } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [groupExpanded, setGroupExpanded] = useState({
    treasury: true,
    account: true,
  });

  const closeMobile = () => setMobileOpen(false);
  const toggleMobile = () => setMobileOpen((state) => !state);
  const toggleGroup = (key: keyof typeof groupExpanded) => {
    setGroupExpanded((state) => ({
      ...state,
      [key]: !state[key],
    }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={toggleMobile}
        className="fixed left-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-card/95 text-gray-200 shadow-[0_25px_80px_-55px_rgba(0,0,0,0.9)] transition hover:bg-white/10 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-card/95 backdrop-blur-2xl shadow-2xl md:static md:translate-x-0",
          "transition-all duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "overflow-hidden"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
              <LineChart className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-white">BemoEdge</span>
          </Link>

          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close sidebar"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {navigationSections.map((section, sectionIndex) => {
            const isExpanded = section.collapsible ? groupExpanded[section.key as keyof typeof groupExpanded] : true;
            return (
              <div key={section.label} className={sectionIndex > 0 ? "pt-4" : ""}>
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-[10px] uppercase tracking-[0.45em] text-slate-500 font-semibold">
                    {section.label}
                  </span>
                  {section.collapsible && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(section.key as keyof typeof groupExpanded)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                      aria-label={`Toggle ${section.label}`}
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded ? "rotate-180" : "rotate-0")} />
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={closeMobile}
                          className={cn(
                            "group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                            isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <item.icon className="h-5 w-5 text-slate-400 transition-colors duration-200 group-hover:text-white" aria-hidden="true" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
              <span className="text-lg font-semibold">
                {firstName ? firstName[0] : user?.email?.charAt(0).toUpperCase() ?? "T"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {firstName ? `${firstName} ${lastName ?? ""}`.trim() : user?.email?.split("@")[0] ?? "Trader"}
              </p>
              <button type="button" onClick={handleLogout} className="mt-1 text-xs text-slate-400 hover:text-white">
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
