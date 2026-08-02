"use client";

import { useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/mock-bot";

export function ManageAgentsDialog({
  agents,
  onCreate,
  onRename,
  onDelete,
  triggerClassName,
}: {
  agents: Agent[];
  onCreate: (name: string, description: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  triggerClassName?: string;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleCreate() {
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim());
    setName("");
    setDescription("");
  }

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="outline" size="xs" className={cn(triggerClassName)} />}
      >
        Manage Agents
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Agents</DialogTitle>
          <DialogDescription>
            Create, rename, or remove the agents available in the switcher.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Input
                  value={agent.name}
                  onChange={(e) => onRename(agent.id, e.target.value)}
                  className="h-7 border-none px-0 font-medium shadow-none focus-visible:ring-0"
                />
                <span className="truncate text-xs text-muted-foreground">
                  {agent.description}
                </span>
              </div>
              <Button
                aria-label={`Delete ${agent.name}`}
                variant="ghost"
                size="icon-sm"
                disabled={agents.length <= 1}
                onClick={() => onDelete(agent.id)}
              >
                <Trash2Icon className="size-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <Input
            placeholder="Agent name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCreate} disabled={!name.trim()}>
            <PlusIcon className="size-3.5" />
            Add Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
