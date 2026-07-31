import type { SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, LoadingButton } from "@/components/auth/auth-form";

export function VerifyCodeCard({
  onSubmit,
  onReset,
  error,
  isLoading,
}: {
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onReset: () => void;
  error?: string;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full sm:w-96">
        <CardHeader>
          <CardTitle className="text-sm">Check your email</CardTitle>
          <CardDescription>
            Enter the verification code we sent you
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input id="code" name="code" required autoFocus />
              <FieldError message={error} />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <LoadingButton type="submit" className="w-full" loading={isLoading}>
              Verify
            </LoadingButton>
            <Button type="button" variant="link" size="sm" onClick={onReset}>
              Start over
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
