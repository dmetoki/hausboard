"use client";

import { useState } from "react";
import { Bell, Inbox as InboxIcon, Mail, MailOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconBadge } from "@/components/dashboard/icon-badge";
import { ManageAgentsDialog } from "@/components/bot/manage-agents-dialog";
import { cn } from "@/lib/utils";
import type { NotificationSeed } from "@/lib/mock-metrics";
import { DEFAULT_AGENTS, type Agent } from "@/lib/mock-bot";
import { type AgentTask, type AgentTaskStatus } from "@/lib/mock-inbox";

let nextAgentId = 0;
function createAgentId() {
  nextAgentId += 1;
  return `inbox-agent-${nextAgentId}`;
}

const STATUS_LABELS: Record<AgentTaskStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

// Same fixed-status-color, color-mix idiom as `StatusBadge` in
// components/dashboard/icon-badge.tsx — completed/failed/cancelled map onto
// the app's sentiment palette (good/critical/neutral), while queued/running
// borrow two steps off the generic categorical ramp since there's no
// dedicated "info"/"in progress" status color in app/globals.css.
const STATUS_COLORS: Record<AgentTaskStatus, string> = {
  queued: "--chart-5",
  running: "--chart-4",
  completed: "--chart-positive",
  failed: "--chart-negative",
  cancelled: "--chart-neutral",
};

function elapsedLabel(status: AgentTaskStatus, elapsedMinutes: number) {
  return status === "running" ? `for ${elapsedMinutes}m` : `${elapsedMinutes}m ago`;
}

// Hovering the pill swaps its label for the elapsed time — both strings sit
// stacked in the same grid cell so the pill's width is always the wider of
// the two, and a plain opacity crossfade swaps which one is visible instead
// of it ever resizing/jumping.
function StatusPill({
  status,
  elapsedMinutes,
  className,
}: {
  status: AgentTaskStatus;
  elapsedMinutes: number;
  className?: string;
}) {
  const color = STATUS_COLORS[status];

  return (
    <span
      className={cn(
        "group/pill grid w-fit shrink-0 cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        backgroundColor: `color-mix(in oklab, var(${color}) 16%, transparent)`,
        color: `var(${color})`,
      }}
    >
      <span className="col-start-1 row-start-1 opacity-100 transition-opacity group-hover/pill:opacity-0">
        {STATUS_LABELS[status]}
      </span>
      <span className="col-start-1 row-start-1 opacity-0 transition-opacity group-hover/pill:opacity-100">
        {elapsedLabel(status, elapsedMinutes)}
      </span>
    </span>
  );
}

function ListRow({
  icon,
  title,
  subtitle,
  time,
  active,
  unread,
  onClick,
}: {
  icon: typeof Bell;
  title: string;
  subtitle: string;
  time: string;
  active: boolean;
  unread?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-start gap-2.5 border-b border-border px-4 py-3 text-left transition-colors",
        active ? "bg-muted" : "hover:bg-muted/50",
      )}
    >
      <IconBadge icon={icon} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {unread && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
          <span
            className={cn(
              "truncate text-sm",
              unread ? "font-medium text-foreground" : "text-foreground",
            )}
          >
            {title}
          </span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">{time}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </button>
  );
}

// Tasks are managed entirely within their own row — status + Cancel live
// here, unlike notifications which route through the center detail pane —
// so acting on a task never disturbs whatever's currently selected there.
function TaskRow({ task, onCancel }: { task: AgentTask; onCancel: () => void }) {
  const cancelable = task.status === "queued" || task.status === "running";
  const color = STATUS_COLORS[task.status];

  return (
    <div className="relative flex flex-col gap-1.5 border-b border-border px-4 py-3 last:border-b-0">
      <div className="absolute top-3 right-4 flex items-center gap-1.5">
        <StatusPill status={task.status} elapsedMinutes={task.elapsedMinutes} />
        {cancelable && (
          <button
            type="button"
            aria-label="Cancel task"
            onClick={onCancel}
            className="cursor-pointer rounded-md p-1 transition-opacity hover:opacity-70"
            style={{
              backgroundColor: `color-mix(in oklab, var(${color}) 16%, transparent)`,
              color: `var(${color})`,
            }}
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      <span className="mb-1 truncate pr-24 text-sm text-foreground">{task.title}</span>
      <p className="text-xs text-muted-foreground">{task.description}</p>
    </div>
  );
}

export function InboxConsole({
  notifications: initialNotifications,
  tasks: initialTasks,
}: {
  notifications: NotificationSeed[];
  tasks: AgentTask[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [tasks, setTasks] = useState(initialTasks);
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function selectNotification(id: string) {
    setSelectedId(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function toggleRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
  }

  function cancelTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t)),
    );
  }

  function handleCreateAgent(name: string, description: string) {
    setAgents((prev) => [...prev, { id: createAgentId(), name, description }]);
  }

  function handleRenameAgent(id: string, name: string) {
    setAgents((prev) =>
      prev.map((agent) => (agent.id === id ? { ...agent, name } : agent)),
    );
  }

  function handleDeleteAgent(id: string) {
    if (agents.length <= 1) return;
    setAgents((prev) => prev.filter((agent) => agent.id !== id));
  }

  const selectedNotification = notifications.find((n) => n.id === selectedId);

  return (
    <div className="flex h-full">
      <div className="flex w-96 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-sm font-medium text-foreground">Notifications</h1>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          {notifications.map((notification) => (
            <ListRow
              key={notification.id}
              icon={Bell}
              title={notification.title}
              subtitle={notification.description}
              time={notification.time}
              unread={!notification.read}
              active={selectedId === notification.id}
              onClick={() => selectNotification(notification.id)}
            />
          ))}
        </ScrollArea>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedNotification ? (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-border p-6">
              <div className="min-w-0">
                <h2 className="text-lg font-medium text-foreground">
                  {selectedNotification.title}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedNotification.time}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleRead(selectedNotification.id)}
              >
                {selectedNotification.read ? (
                  <>
                    <Mail className="size-3.5" /> Mark unread
                  </>
                ) : (
                  <>
                    <MailOpen className="size-3.5" /> Mark read
                  </>
                )}
              </Button>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <p className="p-6 text-sm text-muted-foreground">
                {selectedNotification.description}
              </p>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <InboxIcon className="size-12 text-muted-foreground" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Select an item to view details</p>
          </div>
        )}
      </div>

      <div className="flex w-96 shrink-0 flex-col border-l border-border bg-muted/30">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-sm font-medium text-foreground">Agent Tasks</h2>
          <ManageAgentsDialog
            agents={agents}
            onCreate={handleCreateAgent}
            onRename={handleRenameAgent}
            onDelete={handleDeleteAgent}
          />
        </div>
        <ScrollArea className="min-h-0 flex-1">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onCancel={() => cancelTask(task.id)} />
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}
