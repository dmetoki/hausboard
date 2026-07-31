"use client";

import { useEffect } from "react";
import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/nextjs";
import { Icons } from "@/components/icons";

export default function SSOCallbackPage() {
  const { isLoaded, isSignedIn } = useAuth();

  // AuthenticateWithRedirectCallback resolves the OAuth callback (required) and
  // also attempts its own post-auth redirect, but that redirect is a soft
  // client-side navigation that can race ahead of the session cookie actually
  // landing — "/" then re-runs auth.protect() server-side and bounces back to
  // sign-in before the cookie is present. This watcher forces a hard reload
  // once the client-side auth state flips, which guarantees the cookie is set
  // by the time the next request is made. Both exist deliberately: the
  // component's redirect props are a harmless fallback if this watcher were
  // ever removed, not dead weight to clean up.
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      window.location.href = "/";
    }
  }, [isLoaded, isSignedIn]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/"
        signUpForceRedirectUrl="/"
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
      />
      <Icons.spinner className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
