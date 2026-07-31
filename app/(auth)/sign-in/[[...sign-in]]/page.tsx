"use client";

import { useState, type SubmitEvent } from "react";
import { useSignIn } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FieldError,
  LoadingButton,
  GoogleAuthButton,
  OrDivider,
  AuthSwitchLink,
} from "@/components/auth/auth-form";
import { VerifyCodeCard } from "@/components/auth/verify-code-card";

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const [googleLoading, setGoogleLoading] = useState(false);

  const isLoading = fetchStatus === "fetching";

  async function completeSignIn() {
    await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        window.location.href = decorateUrl("/");
      },
    });
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const emailAddress = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await signIn.password({ emailAddress, password });
    if (error) return;

    if (signIn.status === "complete") {
      await completeSignIn();
    } else if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      await signIn.mfa.sendEmailCode();
    }
  }

  async function handleVerify(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const code = formData.get("code") as string;

    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) return;

    if (signIn.status === "complete") await completeSignIn();
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectCallbackUrl: "/sso-callback",
    });
    if (error) setGoogleLoading(false);
  }

  if (
    signIn.status === "needs_second_factor" ||
    signIn.status === "needs_client_trust"
  ) {
    return (
      <VerifyCodeCard
        onSubmit={handleVerify}
        onReset={() => signIn.reset()}
        error={errors.fields.code?.message}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full sm:w-96">
        <CardHeader>
          <CardTitle>Sign in to Hausboard</CardTitle>
          <CardDescription>
            Welcome back! Please sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <GoogleAuthButton
            loading={googleLoading}
            onClick={handleGoogleSignIn}
            label="Continue with Google"
          />
          <OrDivider />
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
              <FieldError message={errors.fields.identifier?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
              <FieldError message={errors.fields.password?.message} />
            </div>
            <LoadingButton
              type="submit"
              className="w-full text-xs"
              loading={isLoading}
            >
              Continue
            </LoadingButton>
            <AuthSwitchLink href="/sign-up">
              Don&apos;t have an account? Sign up
            </AuthSwitchLink>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
