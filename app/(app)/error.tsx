"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm text-muted-foreground">Something went wrong.</p>
      <Button variant="outline" size="sm" onClick={() => unstable_retry()}>
        Try again
      </Button>
    </div>
  );
}
