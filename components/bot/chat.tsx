"use client";

import { useState } from "react";
import { BotIcon, CameraIcon, GlobeIcon, Loader2Icon } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Marker, MarkerIcon, MarkerContent } from "@/components/ui/marker";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/mock-bot";

export function Chat({
  messages,
  isReplying,
  onSubmit,
}: {
  messages: ChatMessage[];
  isReplying: boolean;
  onSubmit: (text: string) => void;
}) {
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  function handleSubmit(message: PromptInputMessage) {
    if (!message.text.trim()) return;
    onSubmit(message.text);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Conversation>
        <ConversationContent className={messages.length === 0 ? "min-h-full" : undefined}>
          {messages.length === 0 ? (
            <ConversationEmptyState className="h-full flex-1">
              <BotIcon className="size-16 text-muted-foreground" strokeWidth={1} />
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Agent Central</h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Manage your agents and chat with them here
                </p>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  <MessageResponse>{message.content}</MessageResponse>
                </MessageContent>
              </Message>
            ))
          )}
          {isReplying && (
            <Message from="assistant">
              <MessageContent>
                <Marker>
                  <MarkerIcon>
                    <Loader2Icon className="animate-spin" />
                  </MarkerIcon>
                  <MarkerContent>Thinking...</MarkerContent>
                </Marker>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-4">
        <PromptInput
          onSubmit={handleSubmit}
          multiple
          accept="image/*,application/pdf"
        >
          <PromptInputBody>
            <PromptInputAttachments>
              {(attachment) => (
                <PromptInputAttachment data={attachment} key={attachment.id} />
              )}
            </PromptInputAttachments>
            <PromptInputTextarea />
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent className="min-w-64">
                    <PromptInputActionAddAttachments className="whitespace-nowrap text-xs" />
                    <PromptInputActionMenuItem className="whitespace-nowrap text-xs">
                      <CameraIcon className="mr-2 size-4" /> Take screenshot
                    </PromptInputActionMenuItem>
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputButton
                  aria-pressed={webSearchEnabled}
                  className={cn(webSearchEnabled && "bg-muted text-foreground")}
                  onClick={() => setWebSearchEnabled((prev) => !prev)}
                >
                  <GlobeIcon className="size-4" />
                  Search
                </PromptInputButton>
                <PromptInputSpeechButton />
              </PromptInputTools>
              <PromptInputSubmit variant="outline" disabled={isReplying} />
            </PromptInputFooter>
          </PromptInputBody>
        </PromptInput>
      </div>
    </div>
  );
}
