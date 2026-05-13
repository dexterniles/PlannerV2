import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type ServerAuth = { userId: string; email: string };

export async function getServerAuth(): Promise<ServerAuth> {
  const h = await headers();
  const userId = h.get("x-auth-user-id");
  if (!userId) {
    redirect("/login");
  }
  return { userId, email: h.get("x-auth-user-email") ?? "" };
}

export async function getServerAuthOrNull(): Promise<ServerAuth | null> {
  const h = await headers();
  const userId = h.get("x-auth-user-id");
  if (!userId) return null;
  return { userId, email: h.get("x-auth-user-email") ?? "" };
}
