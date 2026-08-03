import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { BotConsole } from "@/components/bot/bot-console";

export const metadata: Metadata = {
  title: "Bot",
};

export default async function BotPage() {
  await auth.protect();

  return (
    <div className="h-[calc(100dvh-4rem)]">
      <BotConsole />
    </div>
  );
}
