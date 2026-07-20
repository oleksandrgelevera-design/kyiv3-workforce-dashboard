import type { SupabaseClient } from "@supabase/supabase-js";
import type { Store, StoreRow } from "../types";
import { storeFromRow, storeToRow } from "./mappers";

export async function fetchStores(supabase: SupabaseClient): Promise<Store[]> {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("code", { ascending: true });
  if (error) throw error;
  return (data as StoreRow[]).map(storeFromRow);
}

export async function upsertStore(
  supabase: SupabaseClient,
  store: Store
): Promise<void> {
  const { error } = await supabase.from("stores").upsert(storeToRow(store));
  if (error) throw error;
}

/** Partial update — used by the frequent single-field edits (Фактично, ЦПХ, коментар, ...). */
export async function updateStoreField(
  supabase: SupabaseClient,
  code: string,
  patch: Partial<StoreRow>
): Promise<void> {
  const { error } = await supabase.from("stores").update(patch).eq("code", code);
  if (error) throw error;
}

export async function deleteStore(
  supabase: SupabaseClient,
  code: string
): Promise<void> {
  const { error } = await supabase.from("stores").delete().eq("code", code);
  if (error) throw error;
}
