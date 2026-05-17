"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { formatZAR } from "@/utils/currency";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface Position {
  id: string;
  name: string;
  category: string;
  value: number;
  created_at: string;
}

interface NetWorthOverviewProps {
  onDataChange: () => void;
}

const ASSET_CATEGORIES = ["Cash", "Investments", "Property", "Other"];

const COLORS = ["#60A5FA", "#34D399", "#FBBF24", "#F87171", "#A78BFA"];

export function NetWorthOverview({ onDataChange }: NetWorthOverviewProps) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Position[]>([]);
  const [liabilities, setLiabilities] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<"asset" | "liability">("asset");
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState({ name: "", category: "Cash", value: "" });

  const fetchPositions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: assetData, error: assetError } = await supabase
        .from("assets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (assetError) throw assetError;

      const { data: liabilityData, error: liabilityError } = await supabase
        .from("liabilities")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (liabilityError) throw liabilityError;

      setAssets(assetData || []);
      setLiabilities(liabilityData || []);
    } catch (error) {
      console.error("Error fetching net worth data:", error);
      toast.error("Unable to load net worth data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, [user]);

  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.value, 0);
  const netWorth = totalAssets - totalLiabilities;

  const assetAllocation = assets.reduce<Record<string, number>>((result, asset) => {
    result[asset.category] = (result[asset.category] || 0) + asset.value;
    return result;
  }, {});

  const pieData = Object.entries(assetAllocation).map(([name, value]) => ({ name, value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const value = parseFloat(formData.value.replace(/R\s?|,/g, ""));
    if (value <= 0) {
      toast.error("Value must be greater than 0");
      return;
    }

    const table = formMode === "asset" ? "assets" : "liabilities";
    const dataRecord = {
      user_id: user.id,
      name: formData.name,
      category: formData.category,
      value,
    };

    try {
      if (editingPosition) {
        const { error } = await supabase
          .from(table)
          .update(dataRecord)
          .eq("id", editingPosition.id);
        if (error) throw error;
        toast.success(`${formMode === "asset" ? "Asset" : "Liability"} updated`);
      } else {
        const { error } = await supabase
          .from(table)
          .insert(dataRecord);
        if (error) throw error;
        toast.success(`${formMode === "asset" ? "Asset" : "Liability"} added`);
      }
      resetForm();
      fetchPositions();
      onDataChange();
    } catch (error) {
      console.error("Error saving position:", error);
      toast.error("Failed to save position");
    }
  };

  const resetForm = () => {
    setEditingPosition(null);
    setFormData({ name: "", category: "Cash", value: "" });
  };

  const handleEdit = (position: Position, mode: "asset" | "liability") => {
    setFormMode(mode);
    setEditingPosition(position);
    setFormData({ name: position.name, category: position.category, value: formatZAR(position.value) });
  };

  const handleDelete = async (position: Position, mode: "asset" | "liability") => {
    if (!confirm(`Delete ${position.name}?`)) return;
    const table = mode === "asset" ? "assets" : "liabilities";
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", position.id);
      if (error) throw error;
      toast.success(`${mode === "asset" ? "Asset" : "Liability"} deleted`);
      fetchPositions();
      onDataChange();
    } catch (error) {
      console.error("Error deleting position:", error);
      toast.error("Failed to delete position");
    }
  };

  const monthlyGrowth = assets.length > 0 || liabilities.length > 0
    ? (netWorth / Math.max(1, assets.length + liabilities.length)) * 0.1
    : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-border bg-background/80 p-5">
            <p className="text-sm text-gray-400">Total Assets</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{formatZAR(totalAssets)}</p>
          </div>
          <div className="rounded-3xl border border-border bg-background/80 p-5">
            <p className="text-sm text-gray-400">Total Liabilities</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{formatZAR(totalLiabilities)}</p>
          </div>
          <div className="rounded-3xl border border-border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white">
            <p className="text-sm text-slate-300">Current Net Worth</p>
            <p className="mt-2 text-2xl font-semibold">{formatZAR(netWorth)}</p>
            <p className="mt-1 text-xs text-slate-400">Monthly Growth estimate: {formatZAR(monthlyGrowth)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card/80 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Asset Allocation</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={40}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatZAR(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-sm text-gray-400">No assets available yet.</div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card/80 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Net Worth Trend</h3>
            {assets.length + liabilities.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[{ label: "Current", value: netWorth }]}> 
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="label" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatZAR(value)} />
                  <Bar dataKey="value" fill="#34D399" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-sm text-gray-400">Add assets and liabilities to see your net worth.</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-border bg-card/80 p-4">
            <h3 className="text-base font-semibold text-foreground mb-4">Maintain Asset Coverage</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <p>Use asset and liability management to track the real capital available for long-term growth.</p>
              <p>Review your loans and obligations alongside investments so your net worth stays protected.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/80 p-4">
            <div className="flex items-center justify-between mb-4 gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Add New Position</h3>
                <p className="text-sm text-gray-400">Track either an asset or a liability.</p>
              </div>
              <div className="flex gap-2">
                <Button variant={formMode === "asset" ? "secondary" : "outline"} onClick={() => setFormMode("asset")}>Asset</Button>
                <Button variant={formMode === "liability" ? "secondary" : "outline"} onClick={() => setFormMode("liability")}>Liability</Button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground outline-none"
                  >
                    {ASSET_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="value">Value (ZAR)</Label>
                  <Input
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="R120,000.00"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingPosition ? "Update" : "Add"} {formMode === "asset" ? "Asset" : "Liability"}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Reset</Button>
              </div>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card/80 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Assets</h3>
            <div className="space-y-3">
              {assets.length === 0 ? (
                <p className="text-sm text-gray-500">No assets added yet.</p>
              ) : (
                assets.map((asset) => (
                  <div key={asset.id} className="rounded-2xl border border-border/50 bg-background/70 p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">{asset.name}</p>
                        <p className="text-xs text-gray-400">{asset.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatZAR(asset.value)}</p>
                        <div className="flex gap-2 mt-2 text-xs">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(asset, "asset")}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(asset, "asset")}>Delete</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/80 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Liabilities</h3>
            <div className="space-y-3">
              {liabilities.length === 0 ? (
                <p className="text-sm text-gray-500">No liabilities added yet.</p>
              ) : (
                liabilities.map((liability) => (
                  <div key={liability.id} className="rounded-2xl border border-border/50 bg-background/70 p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">{liability.name}</p>
                        <p className="text-xs text-gray-400">{liability.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatZAR(liability.value)}</p>
                        <div className="flex gap-2 mt-2 text-xs">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(liability, "liability")}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(liability, "liability")}>Delete</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
