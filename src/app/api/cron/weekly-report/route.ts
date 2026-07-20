import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { storeFromRow, vacancyFromRow } from "@/lib/data/mappers";
import { buildWeeklyReportData } from "@/lib/email/reportData";
import { renderWeeklyReportEmail } from "@/lib/email/weeklyReportTemplate";
import type { StoreRow, VacancyRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * This route is meant to be hit by a Vercel Cron schedule (see vercel.json)
 * running frequently (default here: hourly). Because the report day/time is
 * user-configurable from /settings, and Vercel Cron schedules are static, we
 * don't try to reconfigure the cron itself — instead this route wakes up
 * often and only actually sends when "now" (in the configured timezone)
 * matches the configured day + hour, and it hasn't already sent one for
 * that calendar day (tracked via settings.last_report_sent_at).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: settingsRow, error: settingsError } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (settingsError || !settingsRow) {
    return NextResponse.json({ error: "Could not load settings" }, { status: 500 });
  }

  const {
    district_name,
    report_recipients,
    report_day,
    report_time,
    report_timezone,
    last_report_sent_at,
  } = settingsRow as {
    district_name: string;
    report_recipients: string[];
    report_day: string;
    report_time: string;
    report_timezone: string;
    last_report_sent_at: string | null;
  };

  if (!report_recipients || report_recipients.length === 0) {
    return NextResponse.json({ skipped: "No recipients configured" });
  }

  // ---- Determine current day/hour/date in the configured timezone -------
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: report_timezone,
    weekday: "long",
    hour: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const currentWeekday = (parts.weekday ?? "").toLowerCase();
  const currentHour = parseInt(parts.hour ?? "0", 10);
  const currentDateKey = `${parts.year}-${parts.month}-${parts.day}`; // local calendar date

  const targetHour = parseInt(report_time.split(":")[0] ?? "8", 10);

  const isTargetDay = currentWeekday === report_day;
  const isTargetHour = currentHour === targetHour;

  const lastSentDateKey = last_report_sent_at
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: report_timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .formatToParts(new Date(last_report_sent_at))
        .reduce((acc, p) => (p.type !== "literal" ? { ...acc, [p.type]: p.value } : acc), {} as any)
    : null;
  const lastSentKey = lastSentDateKey ? `${lastSentDateKey.year}-${lastSentDateKey.month}-${lastSentDateKey.day}` : null;

  if (!isTargetDay || !isTargetHour) {
    return NextResponse.json({ skipped: "Not the configured day/hour", currentWeekday, currentHour });
  }
  if (lastSentKey === currentDateKey) {
    return NextResponse.json({ skipped: "Already sent today" });
  }

  // ---- Load data and build the report ------------------------------------
  const [{ data: storeRows }, { data: vacancyRows }] = await Promise.all([
    supabase.from("stores").select("*"),
    supabase.from("vacancies").select("*"),
  ]);

  const stores = ((storeRows ?? []) as StoreRow[]).map(storeFromRow);
  const vacancies = ((vacancyRows ?? []) as VacancyRow[]).map(vacancyFromRow);
  const reportData = buildWeeklyReportData(district_name, stores, vacancies);

  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    : "/dashboard";
  const html = renderWeeklyReportEmail(reportData, dashboardUrl);

  // ---- Send via Resend ----------------------------------------------------
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: sendError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Kyiv 3 Dashboard <onboarding@resend.dev>",
    to: report_recipients,
    subject: `Тижневий звіт — ${district_name}`,
    html,
  });

  if (sendError) {
    return NextResponse.json({ error: "Resend failed", details: sendError }, { status: 500 });
  }

  await supabase.from("settings").update({ last_report_sent_at: now.toISOString() }).eq("id", 1);

  return NextResponse.json({ sent: true, recipients: report_recipients.length });
}
