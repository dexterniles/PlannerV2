"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { DueDate } from "@/components/shared/DueDate";
import type { OverdueItem } from "@/lib/server/data/agenda";

function tomorrowAt9(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(9, 0, 0, 0);
  return d.toISOString();
}

export function OverdueStrip({ initial }: { initial: OverdueItem[] }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  if (items.length === 0) return null;

  async function act(
    item: OverdueItem,
    body: Record<string, unknown>,
    failMsg: string,
  ) {
    setBusy(item.id);
    const path = item.kind === "task" ? "tasks" : "assignments";
    const res = await fetch(`/api/${path}/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (!res.ok) {
      toast.error(failMsg);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    qc.invalidateQueries({ queryKey: ["items"] });
  }

  const complete = (item: OverdueItem) =>
    act(
      item,
      { status: item.kind === "task" ? "done" : "submitted" },
      "Could not complete",
    );
  const snooze = (item: OverdueItem) =>
    act(item, { dueDate: tomorrowAt9() }, "Could not reschedule");

  return (
    <section className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-bg-elevated p-3">
      <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-text-subtle">
        Overdue · {items.length}
      </h2>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li
            key={`${item.kind}:${item.id}`}
            className="group flex items-center gap-3 rounded-md px-1 py-1.5 hover:bg-bg-hover"
          >
            <button
              type="button"
              aria-label="Complete"
              disabled={busy === item.id}
              onClick={() => complete(item)}
              className="flex size-5 shrink-0 items-center justify-center rounded border border-border-strong text-text-subtle hover:border-brand hover:text-brand disabled:opacity-50"
            >
              <Check className="size-3" />
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(`/issues?detail=${item.kind}:${item.id}`)
              }
              className="flex-1 truncate text-left text-sm text-text"
            >
              {item.title}
            </button>
            <DueDate value={item.dueDate} />
            <button
              type="button"
              aria-label="Reschedule to tomorrow"
              title="Push to tomorrow"
              disabled={busy === item.id}
              onClick={() => snooze(item)}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-text-subtle opacity-0 transition-opacity hover:bg-bg-hover hover:text-text group-hover:opacity-100 disabled:opacity-50"
            >
              <CalendarClock className="size-3.5" />
              Tomorrow
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
