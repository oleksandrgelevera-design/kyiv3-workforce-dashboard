import type { SupabaseClient } from "@supabase/supabase-js";
import type { Vacancy, VacancyRow } from "../types";
import { vacancyFromRow, vacancyToRow } from "./mappers";

export async function fetchVacancies(
  supabase: SupabaseClient
): Promise<Vacancy[]> {
  const { data, error } = await supabase
    .from("vacancies")
    .select("*")
    .order("opened_date", { ascending: false });
  if (error) throw error;
  return (data as VacancyRow[]).map(vacancyFromRow);
}

export async function insertVacancy(
  supabase: SupabaseClient,
  vacancy: Vacancy
): Promise<void> {
  const { error } = await supabase.from("vacancies").insert(vacancyToRow(vacancy));
  if (error) throw error;
}

export async function updateVacancyField(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<VacancyRow>
): Promise<void> {
  const { error } = await supabase.from("vacancies").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteVacancy(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("vacancies").delete().eq("id", id);
  if (error) throw error;
}
