import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchSettings } from "@/lib/data/settings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const settings = await fetchSettings(supabase);

  return <SettingsForm initialSettings={settings} />;
}
