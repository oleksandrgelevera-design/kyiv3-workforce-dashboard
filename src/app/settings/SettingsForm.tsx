"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Settings } from "@/lib/types";

const DAYS: { value: Settings["reportDay"]; label: string }[] = [
  { value: "monday", label: "Понеділок" },
  { value: "tuesday", label: "Вівторок" },
  { value: "wednesday", label: "Середа" },
  { value: "thursday", label: "Четвер" },
  { value: "friday", label: "П'ятниця" },
  { value: "saturday", label: "Субота" },
  { value: "sunday", label: "Неділя" },
];

// A short, practical list — not every IANA zone, just the ones this district
// is realistically deployed across. Add more here if needed.
const TIMEZONES = [
  "Europe/Kyiv",
  "Europe/Warsaw",
  "Europe/London",
  "Europe/Berlin",
  "UTC",
];

export default function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [districtName, setDistrictName] = useState(initialSettings.districtName);
  const [recipientsText, setRecipientsText] = useState(initialSettings.reportRecipients.join(", "));
  const [reportDay, setReportDay] = useState<Settings["reportDay"]>(initialSettings.reportDay);
  const [reportTime, setReportTime] = useState(initialSettings.reportTime);
  const [reportTimezone, setReportTimezone] = useState(initialSettings.reportTimezone);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const handleSave = async () => {
    setSaveState("saving");
    const supabase = createClient();
    const recipients = recipientsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("settings")
      .update({
        district_name: districtName,
        report_recipients: recipients,
        report_day: reportDay,
        report_time: reportTime,
        report_timezone: reportTimezone,
      })
      .eq("id", 1);

    setSaveState(error ? "error" : "saved");
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
      `}</style>
      <div style={styles.card}>
        <Link href="/dashboard" style={styles.back}>
          ← До дашборду
        </Link>
        <h1 style={styles.title}>Налаштування</h1>

        <label style={styles.label}>
          Назва дистрикту
          <input
            style={styles.input}
            value={districtName}
            onChange={(e) => setDistrictName(e.target.value)}
          />
        </label>

        <label style={styles.label}>
          Отримувачі тижневого звіту (email через кому)
          <textarea
            style={{ ...styles.input, minHeight: 64, resize: "vertical" as const }}
            value={recipientsText}
            onChange={(e) => setRecipientsText(e.target.value)}
            placeholder="dm@jysk.com, hr@jysk.com"
          />
        </label>

        <div style={styles.row}>
          <label style={{ ...styles.label, flex: 1 }}>
            День тижневого звіту
            <select
              style={styles.input}
              value={reportDay}
              onChange={(e) => setReportDay(e.target.value as Settings["reportDay"])}
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ ...styles.label, width: 120 }}>
            Час
            <input
              type="time"
              style={styles.input}
              value={reportTime}
              onChange={(e) => setReportTime(e.target.value)}
            />
          </label>
        </div>

        <label style={styles.label}>
          Часовий пояс
          <select
            style={styles.input}
            value={reportTimezone}
            onChange={(e) => setReportTimezone(e.target.value)}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>

        <button style={styles.button} onClick={handleSave} disabled={saveState === "saving"}>
          {saveState === "saving" ? "Збереження…" : "Зберегти"}
        </button>
        {saveState === "saved" ? <div style={styles.saved}>Збережено.</div> : null}
        {saveState === "error" ? <div style={styles.errorMsg}>Не вдалося зберегти. Спробуйте ще раз.</div> : null}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#F2F4F8",
    fontFamily: "'IBM Plex Sans', sans-serif",
    padding: "40px 20px",
    display: "flex",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "#FFFFFF",
    border: "1px solid #E1E6EE",
    borderRadius: 14,
    padding: "28px 28px 32px",
    boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 12px rgba(16,24,40,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  back: { fontSize: 12.5, color: "#0046AD", textDecoration: "none" },
  title: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: "#1C2433", margin: "4px 0 8px" },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#6B7684" },
  row: { display: "flex", gap: 12 },
  input: {
    background: "#EFF2F7",
    border: "1px solid #E1E6EE",
    borderRadius: 8,
    padding: "9px 11px",
    fontSize: 14,
    color: "#1C2433",
    outline: "none",
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  button: {
    background: "#0046AD",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
  saved: { color: "#0E8A5F", fontSize: 12.5 },
  errorMsg: { color: "#D2291C", fontSize: 12.5 },
};
