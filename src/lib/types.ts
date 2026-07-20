// These shapes are intentionally identical (field names, nullability) to the
// objects the existing frontend (src/components/WorkforceApp.tsx) has always
// worked with — ported as-is from the original localStorage-based app so no
// component logic needed to change.

export interface Store {
  code: string;
  name: string;
  baseStakes: number;
  baseHeadcount: number;
  seasonStakes: number | null;
  seasonHeadcount: number | null;
  actualStakes: number | null;
  actualHeadcount: number | null;
  cpdCount: number | null;
  riskyCount: number | null;
  hasDisabilityEmployee: boolean | null;
  comment: string;
}

export type HireStatus = "open" | "filled" | "transferred" | "unclear";

export interface Vacancy {
  id: string;
  storeCode: string;
  vacancyName: string | null;
  position: string;
  employmentShare: number;
  openedDate: string; // YYYY-MM-DD
  hiredDate: string | null; // YYYY-MM-DD
  hireStatus: HireStatus;
  responsiblePerson: string | null;
  priority: number | null;
  minorEmployeePresent: number | null;
  searchChannels: string[];
  marketingPresence: string;
  ambassadorActions: string;
  comments: string;
  workUaContacts: number | null;
  workUaUpdatedAt: string | null;
}

export interface Settings {
  dashboardTitle: string;
  districtName: string;
  reportRecipients: string[];
  reportDay:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  reportTime: string; // "HH:MM"
  reportTimezone: string; // IANA tz, e.g. "Europe/Kyiv"
}

export type Role = "district_manager" | "hr" | "store_manager" | "viewer";

export interface Profile {
  id: string;
  email: string | null;
  role: Role;
}

// ---- Raw DB row shapes (snake_case, as returned by Supabase) --------------

export interface StoreRow {
  code: string;
  name: string;
  base_stakes: number;
  base_headcount: number;
  season_stakes: number | null;
  season_headcount: number | null;
  actual_stakes: number | null;
  actual_headcount: number | null;
  cpd_count: number | null;
  risky_count: number | null;
  has_disability_employee: boolean | null;
  comment: string;
}

export interface VacancyRow {
  id: string;
  store_code: string;
  vacancy_name: string | null;
  position: string;
  employment_share: number;
  opened_date: string;
  hired_date: string | null;
  hire_status: HireStatus;
  responsible_person: string | null;
  priority: number | null;
  minor_employee_present: number | null;
  search_channels: string[];
  marketing_presence: string;
  ambassador_actions: string;
  comments: string;
  work_ua_contacts: number | null;
  work_ua_updated_at: string | null;
}

export interface SettingsRow {
  id: number;
  dashboard_title: string;
  district_name: string;
  report_recipients: string[];
  report_day: Settings["reportDay"];
  report_time: string;
  report_timezone: string;
}
