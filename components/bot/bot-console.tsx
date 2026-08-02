"use client";

import { useState } from "react";
import { Chat } from "@/components/bot/chat";
import { ManageAgentsDialog } from "@/components/bot/manage-agents-dialog";
import { cn } from "@/lib/utils";
import { DEFAULT_AGENTS, generateMockReply, type Agent, type ChatMessage } from "@/lib/mock-bot";

let nextId = 0;
function createId(prefix: string) {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

export function BotConsole() {
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [activeAgentId, setActiveAgentId] = useState(DEFAULT_AGENTS[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isReplying, setIsReplying] = useState(false);

  const activeAgent =
    agents.find((agent) => agent.id === activeAgentId) ?? agents[0];

  async function handleSubmit(text: string) {
    const userMessage: ChatMessage = {
      id: createId("user"),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsReplying(true);

    const reply = await generateMockReply(activeAgent, text);

    setMessages((prev) => [
      ...prev,
      { id: createId("assistant"), role: "assistant", content: reply },
    ]);
    setIsReplying(false);
  }

  function handleCreateAgent(name: string, description: string) {
    setAgents((prev) => [
      ...prev,
      { id: createId("agent"), name, description },
    ]);
  }

  function handleRenameAgent(id: string, name: string) {
    setAgents((prev) =>
      prev.map((agent) => (agent.id === id ? { ...agent, name } : agent)),
    );
  }

  function handleDeleteAgent(id: string) {
    if (agents.length <= 1) return;
    const next = agents.filter((agent) => agent.id !== id);
    setAgents(next);
    if (activeAgentId === id) {
      setActiveAgentId(next[0].id);
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex h-full min-w-0 flex-1 justify-center overflow-hidden">
        <div className="flex h-full w-full max-w-3xl flex-col">
          <Chat messages={messages} isReplying={isReplying} onSubmit={handleSubmit} />
        </div>
      </div>

      <aside className="hidden w-80 shrink-0 flex-col gap-4 border-l border-border py-4 pr-6 pl-4 lg:flex">
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {agents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => setActiveAgentId(agent.id)}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors",
                agent.id === activeAgentId
                  ? "border-border bg-muted"
                  : "border-transparent hover:bg-muted/50",
              )}
            >
              <div className="truncate text-xs font-medium text-foreground">
                {agent.name}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {agent.description}
              </div>
            </button>
          ))}
        </div>

        <ManageAgentsDialog
          agents={agents}
          onCreate={handleCreateAgent}
          onRename={handleRenameAgent}
          onDelete={handleDeleteAgent}
        />
      </aside>
    </div>
  );
}
