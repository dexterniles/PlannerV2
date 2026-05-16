"use client";

import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";

import { Kbd } from "@/components/shared/Kbd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useCollection, useResourceMutation } from "@/lib/hooks/use-collection";
import { useLocalStorageBoolean } from "@/lib/hooks/use-local-storage";
import { GLOBAL_SHORTCUTS } from "@/lib/keymap/registry";

type Workspace = { id: string; name: string; type: string };
type PaySchedule = {
  frequency: string;
  referenceDate: string;
} | null;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <h3 className="text-sm font-medium text-text">{title}</h3>
      {children}
    </div>
  );
}

function WorkspacesTab() {
  const { data: workspaces = [] } = useCollection<Workspace>("workspaces");
  const mutate = useResourceMutation("workspaces");
  const [name, setName] = useState("");

  return (
    <Section title="Workspaces">
      <div className="flex flex-col gap-1">
        {workspaces.map((w) => (
          <div
            key={w.id}
            className="flex items-center justify-between rounded-md border border-border-subtle px-3 py-2 text-sm"
          >
            <span className="text-text">{w.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-subtle">{w.type}</span>
              <button
                type="button"
                onClick={() => mutate.mutate({ op: "delete", id: w.id })}
                className="text-xs text-text-subtle hover:text-status-blocked"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New workspace name"
          className="h-8"
        />
        <Button
          size="sm"
          disabled={!name.trim()}
          onClick={() => {
            mutate.mutate({
              op: "create",
              body: { name: name.trim(), type: "custom" },
            });
            setName("");
          }}
        >
          Add
        </Button>
      </div>
    </Section>
  );
}

function PayScheduleTab() {
  const { data } = useQuery<PaySchedule>({
    queryKey: ["pay-schedule"],
    queryFn: async () => {
      const res = await fetch("/api/pay-schedule");
      const json = (await res.json()) as { data: PaySchedule };
      return json.data;
    },
  });
  const [frequency, setFrequency] = useState<string>("biweekly");
  const [refDate, setRefDate] = useState("");

  const freq = data?.frequency ?? frequency;
  const ref = refDate || data?.referenceDate?.slice(0, 10) || "";

  return (
    <Section title="Pay schedule">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-muted">Frequency</span>
        <Select value={freq} onValueChange={setFrequency}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["weekly", "biweekly", "monthly"].map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-muted">Reference date</span>
        <Input
          type="date"
          value={ref}
          onChange={(e) => setRefDate(e.target.value)}
          className="h-8 w-40"
        />
      </div>
      <Button
        size="sm"
        className="self-start"
        onClick={async () => {
          const res = await fetch("/api/pay-schedule", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              frequency: freq,
              referenceDate: ref || new Date().toISOString().slice(0, 10),
            }),
          });
          toast[res.ok ? "success" : "error"](
            res.ok ? "Pay schedule saved" : "Could not save",
          );
        }}
      >
        Save
      </Button>
    </Section>
  );
}

export function SettingsView({ email }: { email: string }) {
  const { theme, setTheme } = useTheme();
  const [dense, setDense] = useLocalStorageBoolean("planner.density.dense");

  const shortcutGroups = GLOBAL_SHORTCUTS.reduce<
    Record<string, typeof GLOBAL_SHORTCUTS>
  >((acc, s) => {
    (acc[s.group] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      <Tabs defaultValue="profile" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="pay">Pay schedule</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="danger">Danger zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Section title="Profile">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Email</span>
              <span className="text-sm text-text">{email}</span>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="appearance">
          <Section title="Appearance">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Theme</span>
              <Select
                value={theme ?? "system"}
                onValueChange={setTheme}
              >
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["system", "light", "dark"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">
                Dense spacing
              </span>
              <Switch checked={dense} onCheckedChange={setDense} />
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="shortcuts">
          <Section title="Keyboard shortcuts">
            {Object.entries(shortcutGroups).map(([group, list]) => (
              <div key={group} className="flex flex-col gap-1.5">
                <h4 className="text-xs font-medium uppercase tracking-wide text-text-subtle">
                  {group}
                </h4>
                {list.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-1 text-sm"
                  >
                    <span className="text-text">{s.description}</span>
                    <Kbd keys={s.keys.replace(/>/g, " ")} />
                  </div>
                ))}
              </div>
            ))}
          </Section>
        </TabsContent>

        <TabsContent value="workspaces">
          <WorkspacesTab />
        </TabsContent>

        <TabsContent value="pay">
          <PayScheduleTab />
        </TabsContent>

        <TabsContent value="notifications">
          <Section title="Notifications">
            <p className="text-sm text-text-muted">
              Notification delivery is not available yet.
            </p>
          </Section>
        </TabsContent>

        <TabsContent value="data">
          <Section title="Data export">
            <p className="text-sm text-text-muted">
              Download a JSON copy of everything in your account.
            </p>
            <Button asChild size="sm" className="self-start">
              <a href="/api/export">Export data</a>
            </Button>
          </Section>
        </TabsContent>

        <TabsContent value="danger">
          <Section title="Danger zone">
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="destructive" size="sm">
                Sign out
              </Button>
            </form>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
