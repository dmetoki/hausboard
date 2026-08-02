export type Agent = {
  id: string;
  name: string;
  description: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: "general-assistant",
    name: "General Assistant",
    description: "Answers questions about your brand reputation dashboard",
  },
  {
    id: "sentiment-analyst",
    name: "Sentiment Analyst",
    description: "Digs into sentiment trends and flags shifts worth a look",
  },
  {
    id: "report-writer",
    name: "Report Writer",
    description: "Drafts summaries and talking points from your metrics",
  },
];

const REPLY_TEMPLATES = [
  (agent: Agent, text: string) =>
    `As the **${agent.name}**, here's what I found on "${text}": sentiment has been broadly stable this period, with a slight uptick in positive mentions across social channels.\n\n- Positive mentions: up 4%\n- Negative mentions: flat\n- Top channel: Twitter`,
  (agent: Agent, text: string) =>
    `Looking into "${text}" — I'd flag the country breakdown as the most interesting angle right now. A few markets are trending more negative than the global average, which might be worth a deeper dive.`,
  (agent: Agent, text: string) =>
    `Here's a quick summary for "${text}":\n\n1. Overall volume is up this period\n2. Impressions are concentrated in a handful of high-reach posts\n3. No major negative spikes detected\n\nLet me know if you'd like this broken down by channel.`,
  (agent: Agent, text: string) =>
    `Good question about "${text}". Based on the current dashboard data, I don't see anything alarming — but I'm ${agent.name.toLowerCase()}, so take my read with that lens in mind.`,
];

// Swappable seam: a real backend integration only needs to replace this one
// function — same shape (async, takes the agent + user text, returns the
// reply text) that `fetchMockPosts` follows for the Posts table.
export async function generateMockReply(
  agent: Agent,
  userText: string,
): Promise<string> {
  const delay = 500 + Math.random() * 900;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const template =
    REPLY_TEMPLATES[Math.floor(Math.random() * REPLY_TEMPLATES.length)];
  return template(agent, userText.trim());
}
