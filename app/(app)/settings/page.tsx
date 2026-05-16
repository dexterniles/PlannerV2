import { SettingsView } from "@/components/features/settings/SettingsView";
import { getServerAuth } from "@/lib/server/auth";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const auth = await getServerAuth();
  return <SettingsView email={auth.email} />;
}
