"use client";

import { useState } from "react";

import { statusLabel } from "@/components/shared/StatusPill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResource, useResourceMutation } from "@/lib/hooks/use-collection";
import { eventStatusValues } from "@/lib/validations/events";
import { formatAbsolute } from "@/lib/utils/dates";

type EventRecord = {
  id: string;
  title: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
};

export function EventDetail({ id }: { id: string }) {
  const { data, isLoading } = useResource<EventRecord>("events", id);
  const mutate = useResourceMutation("events");
  const [draft, setDraft] = useState<string | null>(null);
  const title = draft ?? data?.title ?? "";

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <input
        value={title}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (title.trim() && title !== data.title) {
            mutate.mutate({ op: "patch", id, body: { title: title.trim() } });
            setDraft(null);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="bg-transparent text-lg font-medium text-text outline-none"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-subtle">Status</span>
        <Select
          value={data.status}
          onValueChange={(v) =>
            mutate.mutate({ op: "patch", id, body: { status: v } })
          }
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {eventStatusValues.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-xs text-text-subtle">Starts</span>
        <span className="text-text">{formatAbsolute(data.startsAt)}</span>
      </div>
      {data.endsAt ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-text-subtle">Ends</span>
          <span className="text-text">{formatAbsolute(data.endsAt)}</span>
        </div>
      ) : null}
      {data.location ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-text-subtle">Location</span>
          <span className="text-text">{data.location}</span>
        </div>
      ) : null}
    </div>
  );
}
