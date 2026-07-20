import type { SupabaseClient } from "@supabase/supabase-js";
import type { Settings, SettingsRow } from "../types";
import { settingsFromRow, settingsToRow } from "./mappers";

export async function fetchSettings(
  supabase: SupabaseClient
): Promise<Settings> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return settingsFromRow(data as SettingsRow);
}

export async function updateSettings(
  supabase: SupabaseClient,
  patch: Partial<Settings>
): Promise<void> {
  const rowPatch = settingsToRow({ ...(await fetchSettings(supabase)), ...patch });
  const { error } = await supabase.from("settings").update(rowPatch).eq("id", 1);
  if (error) throw error;
}
