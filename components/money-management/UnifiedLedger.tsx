"use client";

import { formatZAR } from "@/utils/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Edit2, Trash2 } from "lucide-react";
import { UnifiedTransaction } from "@/utils/finance";

interface UnifiedLedgerProps {
  transactions: UnifiedTransaction[];
  onEditIncome: (item: UnifiedTransaction) => void;
  onDeleteIncome: (item: UnifiedTransaction) => void;
  onEditExpense: (item: UnifiedTransaction) => void;
  onDeleteExpense: (item: UnifiedTransaction) => void;
}

const typeStyles: Record<string, string> = {
  Income: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/10",
  Expense: "bg-red-500/10 text-red-300 border border-red-500/10",
  Transfer: "bg-sky-500/10 text-sky-300 border border-sky-500/10",
};

export function UnifiedLedger({ transactions, onEditIncome, onDeleteIncome, onEditExpense, onDeleteExpense }: UnifiedLedgerProps) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80 p-6 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.75)]">
      <CardHeader>
        <CardTitle>Unified Transaction Ledger</CardTitle>
        <CardDescription>
          All income, expenses, and transfers flow through a single financial truth layer.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-500">
            No ledger entries available yet.
          </div>
        ) : (
          <table className="min-w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {transactions.map((transaction) => (
                <tr key={`${transaction.rawType}-${transaction.id}`} className="transition hover:bg-white/5">
                  <td className="px-4 py-4 text-slate-300">{new Date(transaction.date).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${typeStyles[transaction.type]}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-medium text-foreground">{transaction.title}</td>
                  <td className="px-4 py-4 text-slate-400">{transaction.category}</td>
                  <td className="px-4 py-4 text-slate-400">{transaction.linkedAccount || "—"}</td>
                  <td className="px-4 py-4 text-right font-semibold text-slate-200">
                    {transaction.type === "Expense" ? "-" : transaction.type === "Income" ? "+" : ""}
                    {formatZAR(transaction.amount)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      {(transaction.rawType === "external_income") && (
                        <button
                          type="button"
                          onClick={() => onEditIncome(transaction)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {(transaction.rawType === "expenses") && (
                        <button
                          type="button"
                          onClick={() => onEditExpense(transaction)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {(transaction.rawType === "external_income") && (
                        <button
                          type="button"
                          onClick={() => onDeleteIncome(transaction)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-red-500/15"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {(transaction.rawType === "expenses") && (
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(transaction)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-red-500/15"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
