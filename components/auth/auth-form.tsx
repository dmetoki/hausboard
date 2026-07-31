import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
      or
    </div>
  );
}

export function LoadingButton({
  loading,
  children,
  ...props
}: ComponentProps<typeof Button> & { loading: boolean }) {
  return (
    <Button disabled={loading} {...props}>
      {loading ? <Icons.spinner className="size-4 animate-spin" /> : children}
    </Button>
  );
}

export function GoogleAuthButton({
  loading,
  onClick,
  label,
}: {
  loading: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <LoadingButton
      type="button"
      variant="outline"
      loading={loading}
      onClick={onClick}
    >
      <Icons.google className="size-4" />
      {label}
    </LoadingButton>
  );
}

export function AuthSwitchLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      variant="link"
      size="sm"
      className="mx-auto text-xs"
      render={<Link href={href} />}
      nativeButton={false}
    >
      {children}
    </Button>
  );
}
