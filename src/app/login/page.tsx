import { createClient } from "@/lib/supabase/server";
import { fetchStores } from "@/lib/data/stores";
import { fetchVacancies } from "@/lib/data/vacancies";
import { fetchSettings } from "@/lib/data/settings";
import DashboardClient from "../dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
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
