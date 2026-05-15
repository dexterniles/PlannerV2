"use client";

import { StatusPill } from "@/components/shared/StatusPill";
import { DueDate } from "@/components/shared/DueDate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection } from "@/lib/hooks/use-collection";
import { formatAbsolute } from "@/lib/utils/dates";

type Bill = {
  id: string;
  name: string;
  amount: string;
  dueDate: string;
  status: string;
};
type Income = {
  id: string;
  source: string | null;
  kind: string;
  amount: string;
  receivedDate: string;
};

const currency = (v: string) =>
  `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

function BillsTab() {
  const { data: bills = [], isLoading } = useCollection<Bill>("bills");
  if (isLoading)
    return <p className="p-4 text-sm text-text-muted">Loading…</p>;
  if (bills.length === 0)
    return <p className="p-4 text-sm text-text-muted">No bills.</p>;
  const total = bills
    .filter((b) => b.status === "unpaid")
    .reduce((s, b) => s + Number(b.amount), 0);
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2 text-xs text-text-muted">
        <span>{bills.length} bills</span>
        <span>
          Outstanding:{" "}
          <span className="text-text tabular-nums">
            {currency(total.toFixed(2))}
          </span>
        </span>
      </div>
      {bills.map((b) => (
        <div
          key={b.id}
          className="flex h-9 items-center gap-3 border-b border-border-subtle px-4 text-sm"
        >
          <span className="w-24 shrink-0">
            <StatusPill status={b.status} />
          </span>
          <span className="flex-1 truncate text-text">{b.name}</span>
          <DueDate value={b.dueDate} />
          <span className="w-24 shrink-0 text-right text-text tabular-nums">
            {currency(b.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

function IncomeTab() {
  const { data: income = [], isLoading } = useCollection<Income>("income");
  if (isLoading)
    return <p className="p-4 text-sm text-text-muted">Loading…</p>;
  if (income.length === 0)
    return <p className="p-4 text-sm text-text-muted">No income entries.</p>;
  const total = income.reduce((s, i) => s + Number(i.amount), 0);
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2 text-xs text-text-muted">
        <span>{income.length} entries</span>
        <span>
          Total:{" "}
          <span className="text-text tabular-nums">
            {currency(total.toFixed(2))}
          </span>
        </span>
      </div>
      {income.map((i) => (
        <div
          key={i.id}
          className="flex h-9 items-center gap-3 border-b border-border-subtle px-4 text-sm"
        >
          <span className="w-20 shrink-0 text-xs text-text-subtle capitalize">
            {i.kind}
          </span>
          <span className="flex-1 truncate text-text">
            {i.source ?? "Income"}
          </span>
          <span className="text-xs text-text-muted tabular-nums">
            {formatAbsolute(i.receivedDate)}
          </span>
          <span className="w-24 shrink-0 text-right text-text tabular-nums">
            {currency(i.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MoneyView() {
  return (
    <Tabs defaultValue="out" className="flex flex-1 flex-col gap-0">
      <div className="border-b border-border-subtle px-4 py-2">
        <TabsList>
          <TabsTrigger value="out">Out</TabsTrigger>
          <TabsTrigger value="in">In</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="out">
        <BillsTab />
      </TabsContent>
      <TabsContent value="in">
        <IncomeTab />
      </TabsContent>
    </Tabs>
  );
}
