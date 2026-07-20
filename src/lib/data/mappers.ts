import type {
  Store,
  StoreRow,
  Vacancy,
  VacancyRow,
  Settings,
  SettingsRow,
} from "../types";

export function storeFromRow(row: StoreRow): Store {
  return {
    code: row.code,
    name: row.name,
    baseStakes: Number(row.base_stakes),
    baseHeadcount: row.base_headcount,
    seasonStakes: row.season_stakes === null ? null : Number(row.season_stakes),
    seasonHeadcount: row.season_headcount,
    actualStakes: row.actual_stakes === null ? null : Number(row.actual_stakes),
    actualHeadcount: row.actual_headcount,
    cpdCount: row.cpd_count,
    riskyCount: row.risky_count,
    hasDisabilityEmployee: row.has_disability_employee,
    comment: row.comment ?? "",
  };
}

export function storeToRow(store: Store): StoreRow {
  return {
    code: store.code,
    name: store.name,
    base_stakes: store.baseStakes,
    base_headcount: store.baseHeadcount,
    season_stakes: store.seasonStakes,
    season_headcount: store.seasonHeadcount,
    actual_stakes: store.actualStakes,
    actual_headcount: store.actualHeadcount,
    cpd_count: store.cpdCount,
    risky_count: store.riskyCount,
    has_disability_employee: store.hasDisabilityEmployee,
    comment: store.comment ?? "",
  };
}

export function vacancyFromRow(row: VacancyRow): Vacancy {
  return {
    id: row.id,
    storeCode: row.store_code,
    vacancyName: row.vacancy_name,
    position: row.position,
    employmentShare: Number(row.employment_share),
    openedDate: row.opened_date,
    hiredDate: row.hired_date,
    hireStatus: row.hire_status,
    responsiblePerson: row.responsible_person,
    priority: row.priority,
    minorEmployeePresent: row.minor_employee_present,
    searchChannels: row.search_channels ?? [],
    marketingPresence: row.marketing_presence ?? "",
    ambassadorActions: row.ambassador_actions ?? "",
    comments: row.comments ?? "",
    workUaContacts: row.work_ua_contacts,
    workUaUpdatedAt: row.work_ua_updated_at,
  };
}

export function vacancyToRow(v: Vacancy): VacancyRow {
  return {
    id: v.id,
    store_code: v.storeCode,
    vacancy_name: v.vacancyName,
    position: v.position,
    employment_share: v.employmentShare,
    opened_date: v.openedDate,
    hired_date: v.hiredDate,
    hire_status: v.hireStatus,
    responsible_person: v.responsiblePerson,
    priority: v.priority,
    minor_employee_present: v.minorEmployeePresent,
    search_channels: v.searchChannels ?? [],
    marketing_presence: v.marketingPresence ?? "",
    ambassador_actions: v.ambassadorActions ?? "",
    comments: v.comments ?? "",
    work_ua_contacts: v.workUaContacts,
    work_ua_updated_at: v.workUaUpdatedAt,
  };
}

export function settingsFromRow(row: SettingsRow): Settings {
  return {
    dashboardTitle: row.dashboard_title,
    districtName: row.district_name,
    reportRecipients: row.report_recipients ?? [],
    reportDay: row.report_day,
    reportTime: row.report_time?.slice(0, 5) ?? "08:00",
    reportTimezone: row.report_timezone,
  };
}

export function settingsToRow(s: Settings): Omit<SettingsRow, "id"> {
  return {
    dashboard_title: s.dashboardTitle,
    district_name: s.districtName,
    report_recipients: s.reportRecipients,
    report_day: s.reportDay,
    report_time: s.reportTime,
    report_timezone: s.reportTimezone,
  };
}
