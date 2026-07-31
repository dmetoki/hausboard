"use client";

import { useState, type SubmitEvent } from "react";
import { useSignUp } from "@clerk/nextjs";
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

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const [googleLoading, setGoogleLoading] = useState(false);

  const isLoading = fetchStatus === "fetching";

  async function completeSignUp() {
    await signUp.finalize({
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

    const { error } = await signUp.password({ emailAddress, password });
    if (error) return;

    if (signUp.status === "complete") {
      await completeSignUp();
    } else if (
      signUp.status === "missing_requirements" &&
      signUp.unverifiedFields.includes("email_address")
    ) {
      await signUp.verifications.sendEmailCode();
    }
  }

  async function handleVerify(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const code = formData.get("code") as string;

    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) return;

    if (signUp.status === "complete") await completeSignUp();
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    const { error } = await signUp.sso({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectCallbackUrl: "/sso-callback",
    });
    if (error) setGoogleLoading(false);
  }

  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address")
  ) {
    return (
      <VerifyCodeCard
        onSubmit={handleVerify}
        onReset={() => signUp.reset()}
        error={errors.fields.code?.message}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full sm:w-96">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Welcome! Please fill in details to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <GoogleAuthButton
            loading={googleLoading}
            onClick={handleGoogleSignUp}
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
              <FieldError message={errors.fields.emailAddress?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
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
            <AuthSwitchLink href="/sign-in">
              Already have an account? Sign in
            </AuthSwitchLink>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
