import type { Store, Vacancy } from "@/lib/types";

const TARGET_DAYS = 30;

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function round1(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Mirrors vacancyDerived() in WorkforceApp.tsx — same business rule, same numbers. */
function vacancyDerived(v: Vacancy) {
  const status = v.hireStatus || "open";
  let daysOpen: number | null = null;
  let overdue = false;
  let timeToFill: number | null = null;
  if (status === "open") {
    daysOpen = daysBetween(v.openedDate, todayStr());
    overdue = daysOpen > TARGET_DAYS;
  } else if (status === "filled" && v.hiredDate) {
    timeToFill = daysBetween(v.openedDate, v.hiredDate);
  }
  return { status, daysOpen, overdue, timeToFill };
}

/** Mirrors statusOf() in WorkforceApp.tsx — people-shortage takes priority over stakes. */
function staffingStatus(store: Store): "pending" | "peopleCritical" | "peopleWarning" | "deficit" | "surplus" | "ok" {
  if (store.actualStakes === null || store.actualStakes === undefined) return "pending";
  const diffStakes = round1(store.actualStakes - store.baseStakes);
  if (store.actualHeadcount !== null && store.actualHeadcount !== undefined) {
    const diffHeadcount = round1(store.actualHeadcount - store.baseHeadcount);
    if (diffHeadcount <= -3) return "peopleCritical";
    if (diffHeadcount <= -1) return "peopleWarning";
  }
  if (diffStakes < -0.01) return "deficit";
  if (diffStakes > 0.01) return "surplus";
  return "ok";
}

export interface StoreReportRow {
  code: string;
  name: string;
  needToHire: number; // people short (positive number, 0 if none/unknown)
  openVacancies: number;
  oldestVacancyDays: number | null;
  status: "pending" | "peopleCritical" | "peopleWarning" | "deficit" | "surplus" | "ok";
}

export interface WeeklyReportData {
  districtName: string;
  openVacancies: number;
  needToHireTotal: number;
  totalEmployees: number | null;
  disabledEmployeeStores: number;
  flexibleEmployees: number;
  averageVacancyAgeDays: number | null;
  storesWithDeficit: number;
  storesWithOverdueVacancies: number;
  stores: StoreReportRow[];
}

export function buildWeeklyReportData(
  districtName: string,
  stores: Store[],
  vacancies: Vacancy[]
): WeeklyReportData {
  const openVacanciesByStore = new Map<string, number>();
  const oldestOpenDaysByStore = new Map<string, number>();
  let openVacancies = 0;
  const openAges: number[] = [];

  for (const v of vacancies) {
    const d = vacancyDerived(v);
    if (d.status === "open") {
      openVacancies += 1;
      openVacanciesByStore.set(v.storeCode, (openVacanciesByStore.get(v.storeCode) ?? 0) + 1);
      if (d.daysOpen !== null) {
        openAges.push(d.daysOpen);
        const current = oldestOpenDaysByStore.get(v.storeCode) ?? -1;
        if (d.daysOpen > current) oldestOpenDaysByStore.set(v.storeCode, d.daysOpen);
      }
    }
  }

  const averageVacancyAgeDays = openAges.length
    ? round1(openAges.reduce((a, b) => a + b, 0) / openAges.length)
    : null;

  const withActualHeadcount = stores.filter((s) => s.actualHeadcount !== null && s.actualHeadcount !== undefined);
  const totalEmployees = withActualHeadcount.length
    ? withActualHeadcount.reduce((a, s) => a + (s.actualHeadcount as number), 0)
    : null;

  const disabledEmployeeStores = stores.filter((s) => s.hasDisabilityEmployee === true).length;
  const flexibleEmployees = stores.reduce((a, s) => a + (s.cpdCount ?? 0), 0);

  const storeRows: StoreReportRow[] = stores.map((s) => {
    const status = staffingStatus(s);
    const needToHire =
      s.actualHeadcount !== null && s.actualHeadcount !== undefined
        ? Math.max(0, s.baseHeadcount - s.actualHeadcount)
        : 0;
    return {
      code: s.code,
      name: s.name,
      needToHire,
      openVacancies: openVacanciesByStore.get(s.code) ?? 0,
      oldestVacancyDays: oldestOpenDaysByStore.get(s.code) ?? null,
      status,
    };
  });

  const storesWithDeficit = storeRows.filter((r) =>
    ["deficit", "peopleWarning", "peopleCritical"].includes(r.status)
  ).length;
  const storesWithOverdueVacancies = storeRows.filter(
    (r) => r.oldestVacancyDays !== null && r.oldestVacancyDays > TARGET_DAYS
  ).length;

  const needToHireTotal = storeRows.reduce((a, r) => a + r.needToHire, 0);

  return {
    districtName,
    openVacancies,
    needToHireTotal,
    totalEmployees,
    disabledEmployeeStores,
    flexibleEmployees,
    averageVacancyAgeDays,
    storesWithDeficit,
    storesWithOverdueVacancies,
    stores: storeRows,
  };
}
