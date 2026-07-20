import { createClient } from "@/lib/supabase/server";
import { fetchStores } from "@/lib/data/stores";
import { fetchVacancies } from "@/lib/data/vacancies";
import { fetchSettings } from "@/lib/data/settings";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic"; // always read fresh data, never cache this page

export default async function DashboardPage() {
  const supabase = await createClient();

  const [stores, vacancies, settings] = await Promise.all([
    fetchStores(supabase),
    fetchVacancies(supabase),
    fetchSettings(supabase),
  ]);

  return (
    <DashboardClient
      initialStores={stores}
      initialVacancies={vacancies}
      initialSettings={settings}
      userEmail="Guest"
    />
  );
}
