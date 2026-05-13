import Image from "next/image";
import { redirect } from "next/navigation";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { getServerAuthOrNull } from "@/lib/server/auth";

import { LoginForm } from "./login-form";

type SearchParams = Promise<{ next?: string }>;

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const auth = await getServerAuthOrNull();
  const { next } = await searchParams;
  if (auth) {
    redirect(next ?? "/");
  }

  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-10">
      <div
        className="w-full max-w-[380px] rounded-lg border bg-card p-8 shadow-sm"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <div className="flex flex-col items-center gap-2 pb-6">
          <Image
            src="/logo.png"
            alt="Planner"
            width={32}
            height={32}
            priority
            className="h-8 w-8"
          />
          <p className="text-xs text-muted-foreground">Sign in to continue</p>
        </div>
        <LoginForm next={next} />
      </div>
      <ThemeToggle className="fixed bottom-4 right-4" />
    </main>
  );
}
