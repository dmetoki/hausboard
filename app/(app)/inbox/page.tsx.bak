import { auth } from "@clerk/nextjs/server";
import { InboxConsole } from "@/components/inbox/inbox-console";
import { DEFAULT_AGENT_TASKS } from "@/lib/mock-inbox";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-metrics";

export default async function InboxPage() {
  await auth.protect();

  return (
    <div className="h-[calc(100dvh-4rem)] overflow-hidden">
      <InboxConsole notifications={MOCK_NOTIFICATIONS} tasks={DEFAULT_AGENT_TASKS} />
    </div>
  );
}
