import { redirect } from "next/navigation";

// The homepage has no content of its own yet — for now it just routes to
// the one real section. `/brand-reputation` enforces its own auth via
// `auth.protect()`, so this redirect doesn't need to check auth itself.
export default function Home() {
  redirect("/brand-reputation");
}
