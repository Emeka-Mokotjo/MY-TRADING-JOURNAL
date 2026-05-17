"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatZAR } from "@/utils/currency";

interface BalanceOverviewProps {
  tradingCapital: number;
  spendableCash: number;
  longTermWealth: number;
}

export function BalanceOverview({ tradingCapital, spendableCash, longTermWealth }: BalanceOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Capital Separation</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-border bg-background/70 p-5">
          <p className="text-sm text-gray-400">Protected Trading Capital</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">{formatZAR(tradingCapital)}</p>
          <p className="mt-2 text-xs text-gray-500">Reserve set aside for your trading edge and risk management.</p>
        </div>
        <div className="rounded-3xl border border-border bg-background/70 p-5">
          <p className="text-sm text-gray-400">Spendable Cash</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">{formatZAR(spendableCash)}</p>
          <p className="mt-2 text-xs text-gray-500">Short-term cash available for lifestyle and daily spending.</p>
        </div>
        <div className="rounded-3xl border border-border bg-background/70 p-5">
          <p className="text-sm text-gray-400">Long-Term Wealth</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">{formatZAR(longTermWealth)}</p>
          <p className="mt-2 text-xs text-gray-500">Assets, savings and investment capital for future growth.</p>
        </div>
      </CardContent>
    </Card>
  );
}