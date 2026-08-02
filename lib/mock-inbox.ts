import { DEFAULT_AGENTS } from "@/lib/mock-bot";

export type AgentTaskStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type AgentTask = {
  id: string;
  agentName: string;
  title: string;
  description: string;
  status: AgentTaskStatus;
  elapsedMinutes: number;
};

export const DEFAULT_AGENT_TASKS: AgentTask[] = [
  {
    id: "1",
    agentName: DEFAULT_AGENTS[1].name,
    title: "Analyze last 30 days of mentions",
    description: "Scanning sentiment trends across all monitored channels for anomalies.",
    status: "running",
    elapsedMinutes: 2,
  },
  {
    id: "2",
    agentName: DEFAULT_AGENTS[2].name,
    title: "Draft weekly summary report",
    description: "Compiling talking points from this week's metrics into a shareable report.",
    status: "queued",
    elapsedMinutes: 4,
  },
  {
    id: "3",
    agentName: DEFAULT_AGENTS[0].name,
    title: "Answer: \"Which country is trending negative?\"",
    description: "Looked up the country sentiment breakdown and prepared a response.",
    status: "completed",
    elapsedMinutes: 60,
  },
  {
    id: "4",
    agentName: DEFAULT_AGENTS[1].name,
    title: "Flag sentiment shift in APAC",
    description: "Investigating a possible spike in negative mentions from the APAC region.",
    status: "failed",
    elapsedMinutes: 180,
  },
  {
    id: "5",
    agentName: DEFAULT_AGENTS[2].name,
    title: "Draft monthly report",
    description: "Was compiling last month's talking points before being stopped.",
    status: "cancelled",
    elapsedMinutes: 1440,
  },
];
