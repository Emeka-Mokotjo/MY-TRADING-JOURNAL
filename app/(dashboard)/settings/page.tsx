"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import {
  CheckCircle2,
  Edit2,
  Plus,
  ShieldAlert,
  Sparkles,
  Wallet,
  Bell,
  UserCircle2,
  Upload,
  Trash2,
  Info,
} from "lucide-react";
import { AddRuleModal } from "@/components/add-rule-modal";
import toast from "react-hot-toast";

interface TradingRule {
  id: string;
  rule_name: string;
  rule_value: number;
  enabled?: boolean;
  description?: string;
  enforcement_type?: string;
}

interface ProfileInfo {
  first_name?: string;
  last_name?: string;
  plan?: string;
  status?: string;
  created_at?: string;
}

const tabs = [
  { id: "profile", label: "Profile", icon: UserCircle2 },
  { id: "rules", label: "Trading Rules", icon: Sparkles },
  { id: "security", label: "Security", icon: ShieldAlert },
  { id: "billing", label: "Billing", icon: Wallet },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, firstName, lastName } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");
  const [fName, setFName] = useState("");
  const [lName, setLName] = useState("");
  const [profileData, setProfileData] = useState<ProfileInfo>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [rules, setRules] = useState<TradingRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [ruleToggleState, setRuleToggleState] = useState<Record<string, boolean>>({});
  const [editingRule, setEditingRule] = useState<TradingRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supportAdvancedColumns, setSupportAdvancedColumns] = useState({ enabled: false, description: false, enforcementType: false });

  const username = user?.email?.split("@")[0] ?? "tradehero";
  const emailVerified = Boolean((user as any)?.email_confirmed_at);
  const joinDate = profileData.created_at ? new Date(profileData.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
  const currentPlan = profileData.plan ?? "Edge Standard";
  const status = profileData.status ?? "Active";
  const fullName = `${profileData.first_name ?? firstName ?? "Trader"} ${profileData.last_name ?? lastName ?? "Edge"}`.trim();

  useEffect(() => {
    if (firstName) setFName(firstName);
    if (lastName) setLName(lastName);
  }, [firstName, lastName]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, plan, status, created_at")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfileData(data);
      }
    };

    const loadRules = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("trading_rules")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (data) {
        setRules(data as TradingRule[]);
        setRuleToggleState(
          data.reduce<Record<string, boolean>>((acc, rule) => {
            acc[rule.id] = rule.enabled ?? true;
            return acc;
          }, {})
        );
        setSupportAdvancedColumns({
          enabled: data.some((rule) => rule.hasOwnProperty("enabled")),
          description: data.some((rule) => rule.hasOwnProperty("description")),
          enforcementType: data.some((rule) => rule.hasOwnProperty("enforcement_type")),
        });
      }
      setRulesLoading(false);
    };

    loadProfile();
    loadRules();
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: fName.trim(),
        last_name: lName.trim(),
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Unable to save profile settings.");
    } else {
      toast.success("Profile updated successfully.");
      setProfileData((prev) => ({ ...prev, first_name: fName.trim(), last_name: lName.trim() }));
    }
    setProfileSaving(false);
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm("Delete this rule from your discipline checklist?")) return;
    const { error } = await supabase.from("trading_rules").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove rule.");
      return;
    }
    toast.success("Rule removed.");
    setRules((prev) => prev.filter((rule) => rule.id !== id));
    setRuleToggleState((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleToggleRule = async (rule: TradingRule) => {
    const current = ruleToggleState[rule.id] ?? (rule.enabled ?? true);
    const next = !current;
    setRuleToggleState((prev) => ({ ...prev, [rule.id]: next }));

    if (supportAdvancedColumns.enabled) {
      const { error } = await supabase
        .from("trading_rules")
        .update({ enabled: next })
        .eq("id", rule.id);
      if (error) {
        toast.error("Unable to update rule status.");
        setRuleToggleState((prev) => ({ ...prev, [rule.id]: current }));
      }
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const activeRulesCount = useMemo(
    () => rules.filter((rule) => ruleToggleState[rule.id] ?? (rule.enabled ?? true)).length,
    [rules, ruleToggleState]
  );

  const rulesBreached = Math.max(0, Math.min(rules.length, Math.floor(rules.length * 0.08)));
  const disciplineScore = Math.min(100, 84 + activeRulesCount * 4);
  const daysConsistent = Math.min(30, 6 + activeRulesCount * 2);
  const averageRisk = useMemo(() => {
    const riskRules = rules.filter((rule) => /risk/i.test(rule.rule_name));
    if (!riskRules.length) return 2.0;
    const total = riskRules.reduce((sum, rule) => sum + rule.rule_value, 0);
    return +(total / riskRules.length).toFixed(1);
  }, [rules]);

  const consistencyScore = Math.min(100, Math.round((disciplineScore + daysConsistent) / 2));

  const profileSummary = [
    { label: "Username", value: username },
    { label: "Email", value: user?.email ?? "—" },
    { label: "Verification", value: emailVerified ? "Verified" : "Pending" },
    { label: "Joined", value: joinDate },
    { label: "Plan", value: currentPlan },
    { label: "Account Status", value: status },
  ];

  const ruleDescriptionFor = (rule: TradingRule) => {
    if (rule.description) return rule.description;
    const name = rule.rule_name.toLowerCase();
    if (name.includes("risk")) return "Limit risk exposure on every trade.";
    if (name.includes("daily loss")) return "Pause trading once the daily loss threshold is reached.";
    if (name.includes("weekly loss")) return "Protect capital by enforcing weekly drawdown discipline.";
    if (name.includes("daily trades")) return "Keep trade frequency within limits to stay focused.";
    if (name.includes("profit")) return "Track profit targets and close disciplined winners.";
    return "Rule enforcement is designed to keep your edge intact.";
  };

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_35px_120px_-80px_rgba(15,23,42,0.9)] backdrop-blur-xl ring-1 ring-white/5">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-400/80">Command Center</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white">Control Panel</h1>
            <p className="text-sm leading-7 text-slate-300 max-w-xl">
              Manage your account, trading rules and platform preferences from a premium operating environment built for disciplined traders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="lg"
              className="relative overflow-hidden border border-white/10 bg-white/5 text-white shadow-[0_18px_60px_-40px_rgba(59,130,246,0.8)] hover:bg-white/10"
              onClick={() => router.push("/dashboard")}
            >
              <UserCircle2 className="mr-2 h-4 w-4 text-sky-300" />
              View My Profile
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="inline-flex rounded-full border border-white/10 bg-slate-900/70 p-1 shadow-inner shadow-slate-950/30">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-slate-800 text-white shadow-[0_0_40px_rgba(59,130,246,0.16)] ring-1 ring-sky-400/20"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {activeTab === "profile" && (
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
            <Card className="overflow-hidden border-white/10 bg-slate-950/80">
              <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_48%)]" />
              <CardHeader className="relative pt-12">
                <CardTitle className="text-3xl">Your Identity</CardTitle>
                <CardDescription>
                  This is your trader identity in the BemoEdge command center.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-8 pt-0">
                <div className="grid gap-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-slate-900 ring-2 ring-sky-400/30 shadow-[0_0_40px_rgba(56,189,248,0.15)]">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400/15 via-slate-900/10 to-violet-500/10" />
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Trader avatar"
                          className="relative h-24 w-24 rounded-full object-cover"
                        />
                      ) : (
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 text-3xl font-semibold text-slate-100">
                          {fullName
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-[0.25em] text-sky-300 shadow-[0_10px_40px_-30px_rgba(59,130,246,0.75)]">
                        PRO TRADER
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-white">{fullName}</h2>
                        <p className="text-sm text-slate-400">Discipline &gt; Motivation</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>Member Since</span>
                        <span className="text-slate-100">{joinDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>Trading Plan</span>
                        <span className="text-slate-100">{currentPlan}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>Account Status</span>
                        <span className="text-slate-100">{status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <label className="group inline-flex cursor-pointer items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-400/30 hover:bg-slate-900/80">
                      <div>
                        <p className="font-medium text-white">Upload / Change Avatar</p>
                        <p className="text-xs text-slate-400">Keep your command center profile sharp and personalized.</p>
                      </div>
                      <Upload className="h-4 w-4 text-sky-300" />
                      <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-slate-950/80">
              <CardHeader>
                <CardTitle>Profile Dashboard</CardTitle>
                <CardDescription>
                  Review your account identity and keep your trader profile in sync with the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  {profileSummary.map((item) => (
                    <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={fName}
                        onChange={(e) => setFName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lName}
                        onChange={(e) => setLName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white shadow-[0_20px_80px_-45px_rgba(56,189,248,0.9)] hover:scale-[1.01] transition-transform"
                    disabled={profileSaving}
                  >
                    {profileSaving ? "Saving changes..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "rules" && (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Active Rules", value: activeRulesCount, color: "from-emerald-500 to-sky-500", icon: CheckCircle2 },
                { label: "Rules Breached", value: rulesBreached, color: "from-rose-500 to-pink-500", icon: ShieldAlert },
                { label: "Discipline Score", value: `${disciplineScore}%`, color: "from-sky-500 to-indigo-500", icon: Sparkles },
                { label: "Days Consistent", value: `${daysConsistent} days`, color: "from-violet-500 to-fuchsia-500", icon: Wallet },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="border-white/10 bg-slate-950/80 p-5 shadow-[0_25px_60px_-45px_rgba(30,41,59,0.9)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{stat.label}</p>
                        <p className="text-3xl font-semibold text-white">{stat.value}</p>
                      </div>
                      <div className={`rounded-2xl bg-gradient-to-br ${stat.color} p-3 text-white shadow-[0_20px_60px_-40px_rgba(59,130,246,0.45)]`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="border-white/10 bg-slate-950/80">
              <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <CardTitle>Rules Management</CardTitle>
                  <CardDescription>Build your discipline checklist and keep enforcement transparent.</CardDescription>
                </div>
                <Button
                  size="sm"
                  className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-slate-900/80 text-white hover:bg-slate-800"
                  onClick={() => {
                    setEditingRule(null);
                    setIsModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              </CardHeader>
              <CardContent className="overflow-hidden">
                {rulesLoading ? (
                  <div className="py-12 text-center text-slate-400">Loading discipline rules...</div>
                ) : rules.length === 0 ? (
                  <div className="space-y-4 py-14 text-center text-slate-300">
                    <Info className="mx-auto h-10 w-10 text-sky-400" />
                    <p className="text-lg font-medium">No rules in the command checklist yet.</p>
                    <p className="max-w-xl mx-auto text-sm text-slate-400">Create your first operational constraint to make trading more disciplined across every session.</p>
                    <Button onClick={() => { setEditingRule(null); setIsModalOpen(true); }}>
                      Add Rule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="hidden grid-cols-[3fr_1.2fr_1fr_0.9fr] gap-4 px-6 py-4 text-xs uppercase tracking-[0.25em] text-slate-500 text-left md:grid">
                      <span>Rule</span>
                      <span>Value</span>
                      <span>Status</span>
                      <span className="text-right">Actions</span>
                    </div>

                    <div className="space-y-3 px-1 py-2">
                      {rules.map((rule) => {
                        const enabled = ruleToggleState[rule.id] ?? (rule.enabled ?? true);
                        const valueLabel = /risk/i.test(rule.rule_name)
                          ? `${rule.rule_value}%`
                          : /trades/i.test(rule.rule_name)
                          ? `${rule.rule_value} Trades`
                          : /loss/i.test(rule.rule_name)
                          ? `$${rule.rule_value.toLocaleString()}`
                          : `${rule.rule_value}`;

                        return (
                          <div
                            key={rule.id}
                            className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 px-5 py-4 shadow-[0_0_80px_-55px_rgba(56,189,248,0.45)] transition hover:border-sky-400/20 hover:bg-white/10 md:grid-cols-[3fr_1.2fr_1fr_0.9fr]"
                          >
                            <div className="space-y-1">
                              <p className="font-semibold text-white">{rule.rule_name}</p>
                              <p className="text-sm text-slate-400">{ruleDescriptionFor(rule)}</p>
                            </div>

                            <div className="flex flex-col justify-center text-slate-100">
                              <span className="text-sm text-slate-400">Value</span>
                              <span className="mt-1 font-semibold text-white">{valueLabel}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                enabled ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700/60 text-slate-300"
                              }`}>{enabled ? "Enabled" : "Disabled"}</span>
                              <button
                                onClick={() => handleToggleRule(rule)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${enabled ? "bg-sky-400/70" : "bg-slate-700/70"}`}
                                aria-label={enabled ? "Disable rule" : "Enable rule"}
                              >
                                <span
                                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`}
                                />
                              </button>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-slate-800"
                                onClick={() => {
                                  setEditingRule(rule);
                                  setIsModalOpen(true);
                                }}
                                aria-label="Edit rule"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-rose-500/20 hover:text-rose-300"
                                onClick={() => handleDeleteRule(rule.id)}
                                aria-label="Delete rule"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
              <Card className="border-white/10 bg-slate-950/80">
                <CardHeader>
                  <CardTitle>Discipline Score</CardTitle>
                  <CardDescription>Track the psychology of staying consistent and rule-driven.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-6 text-center">
                    <div
                      className="relative flex h-56 w-56 items-center justify-center rounded-full bg-slate-900/80 shadow-[0_0_80px_-50px_rgba(59,130,246,0.35)]"
                      style={{
                        backgroundImage: `conic-gradient(rgba(59,130,246,0.9) 0 ${disciplineScore}%, rgba(148,163,184,0.12) ${disciplineScore}% 100%)`,
                      }}
                    >
                      <div className="flex h-44 w-44 items-center justify-center rounded-full bg-slate-950/90 text-center">
                        <div>
                          <p className="text-5xl font-semibold text-white">{disciplineScore}%</p>
                          <p className="text-sm text-slate-400">Operational focus</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid w-full gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      {[
                        { label: "Rules Followed", value: activeRulesCount },
                        { label: "Rules Breached", value: rulesBreached },
                        { label: "Average Risk", value: `${averageRisk}%` },
                        { label: "Consistency Score", value: `${consistencyScore}%` },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="font-semibold text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-950/80 to-slate-900/90 text-white shadow-[0_35px_120px_-80px_rgba(15,23,42,0.95)]">
                <CardHeader>
                  <CardTitle>Discipline is your edge</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-slate-300">
                    Great traders have rules. Elite traders follow them. This control panel keeps your operational rituals visible so discipline becomes the default.
                  </p>
                  <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-[0_0_40px_-16px_rgba(59,130,246,0.25)]">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-sky-400/80">Focus</p>
                      <p className="text-sm text-slate-300">Stay aligned with your trading edge by reviewing rules before each session.</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-sky-400/80">Feedback</p>
                      <p className="text-sm text-slate-300">Use the discipline metrics to keep accountability visible and momentum built.</p>
                    </div>
                  </div>
                  <p className="mt-6 text-xs uppercase tracking-[0.24em] text-slate-500">Stay consistent. Stay profitable.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/10 bg-slate-950/80">
              <CardHeader>
                <CardTitle>Secure Access</CardTitle>
                <CardDescription>Keep your account locked down with premium controls.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <p className="text-sm text-slate-300">Session Lock</p>
                  <p className="mt-2 text-sm text-slate-400">Require a fresh login after every 30 minutes of inactivity.</p>
                  <button className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-white hover:bg-slate-800">
                    <ShieldAlert className="h-4 w-4 text-sky-300" />
                    Enable Session Guard
                  </button>
                </div>

                <div className="grid gap-4">
                  {[
                    { label: "Multi-factor authentication", active: true },
                    { label: "Auto lock on browser close", active: false },
                    { label: "Device trust checks", active: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
                      <div>
                        <p className="font-medium text-white">{item.label}</p>
                        <p className="text-sm text-slate-400">{item.active ? "Enabled" : "Disabled"}</p>
                      </div>
                      <span className={`inline-flex h-8 min-w-[3rem] items-center justify-center rounded-full px-3 text-sm ${item.active ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700/60 text-slate-300"}`}>
                        {item.active ? "On" : "Off"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-slate-950/80">
              <CardHeader>
                <CardTitle>Security Summary</CardTitle>
                <CardDescription>Review the strength of your account protection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Account security</span>
                    <span className="text-slate-100">Strong</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Confirmed login methods</span>
                    <span className="text-slate-100">2</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Recent security events</span>
                    <span className="text-slate-100">0</span>
                  </div>
                </div>
                <Button className="w-full bg-slate-900/90 text-white hover:bg-slate-800">Review security audit</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/10 bg-slate-950/80">
              <CardHeader>
                <CardTitle>Billing & Plan</CardTitle>
                <CardDescription>Monitor your membership and manage invoices from one place.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <p className="text-sm text-slate-400">Current plan</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{currentPlan}</p>
                  <p className="mt-3 text-sm text-slate-400">Premium access to the control center and elite execution insights.</p>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-sky-300/80">Next invoice</p>
                    <p className="mt-3 text-lg font-semibold text-white">$24.99</p>
                    <p className="text-sm text-slate-400">Billed monthly on the 15th.</p>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white">Manage payment method</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-slate-950/80">
              <CardHeader>
                <CardTitle>Invoice history</CardTitle>
                <CardDescription>Keep track of your premium access payments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {[
                    { title: "Jan 2026", amount: "$24.99", status: "Paid" },
                    { title: "Dec 2025", amount: "$24.99", status: "Paid" },
                    { title: "Nov 2025", amount: "$24.99", status: "Paid" },
                  ].map((invoice) => (
                    <div key={invoice.title} className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div>
                        <p className="font-medium text-white">{invoice.title}</p>
                        <p className="text-sm text-slate-400">{invoice.status}</p>
                      </div>
                      <p className="font-semibold text-white">{invoice.amount}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/10 bg-slate-950/80">
              <CardHeader>
                <CardTitle>Notification Center</CardTitle>
                <CardDescription>Control the alerts that keep your trading discipline sharp.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { title: "Rule breach alerts", active: true },
                  { title: "Daily performance digest", active: true },
                  { title: "Platform updates", active: false },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
                    <div>
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="text-sm text-slate-400">{item.active ? "Enabled" : "Disabled"}</p>
                    </div>
                    <span className={`inline-flex h-8 min-w-[3rem] items-center justify-center rounded-full px-3 text-sm ${item.active ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700/60 text-slate-300"}`}>
                      {item.active ? "On" : "Off"}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-slate-950/80">
              <CardHeader>
                <CardTitle>Alert mode</CardTitle>
                <CardDescription>Stay informed without breaking your focus.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-slate-300">
                  <p className="text-sm">Enabled alerts only for rule breaches and daily discipline recaps. This keeps you connected while avoiding noise.</p>
                </div>
                <Button className="mt-5 w-full bg-slate-900/90 text-white hover:bg-slate-800">Customize alert preferences</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {isModalOpen && (
        <AddRuleModal
          rule={editingRule}
          supportsAdvanced={supportAdvancedColumns}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingRule(null);
            toast.success(editingRule ? "Rule updated" : "Rule added");
            setRulesLoading(true);
            supabase
              .from("trading_rules")
              .select("*")
              .eq("user_id", user?.id ?? "")
              .order("created_at", { ascending: true })
              .then(({ data }) => {
                if (data) {
                  setRules(data as TradingRule[]);
                }
                setRulesLoading(false);
              });
          }}
        />
      )}
    </div>
  );
}
