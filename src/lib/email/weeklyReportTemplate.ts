import type { WeeklyReportData, StoreReportRow } from "./reportData";

const STATUS_LABEL: Record<StoreReportRow["status"], string> = {
  pending: "Дані не введено",
  peopleCritical: "Критична нестача людей",
  peopleWarning: "Не вистачає людей",
  deficit: "Дефіцит",
  surplus: "Надлишок",
  ok: "Норма",
};

const STATUS_COLOR: Record<StoreReportRow["status"], string> = {
  pending: "#B5590A",
  peopleCritical: "#D2291C",
  peopleWarning: "#B5590A",
  deficit: "#D2291C",
  surplus: "#0E8A5F",
  ok: "#6B7684",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function statCard(label: string, value: string | number, color = "#1C2433"): string {
  return `
    <td style="padding:14px 16px;background:#FFFFFF;border:1px solid #E1E6EE;border-radius:10px;">
      <div style="font-family:monospace;font-size:10px;letter-spacing:.06em;color:#6B7684;text-transform:uppercase;margin-bottom:8px;">${esc(
        String(label)
      )}</div>
      <div style="font-size:24px;font-weight:700;color:${color};">${esc(String(value))}</div>
    </td>`;
}

export function renderWeeklyReportEmail(data: WeeklyReportData, dashboardUrl: string): string {
  const dateLabel = new Date().toLocaleDateString("uk-UA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const rows = data.stores
    .slice()
    .sort((a, b) => b.needToHire - a.needToHire || b.openVacancies - a.openVacancies)
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #E1E6EE;font-family:monospace;font-weight:700;font-size:13px;">${esc(
          r.code
        )}<div style="font-family:'Segoe UI',Arial,sans-serif;font-weight:400;font-size:11.5px;color:#6B7684;">${esc(
          r.name
        )}</div></td>
        <td style="padding:10px 14px;border-bottom:1px solid #E1E6EE;text-align:center;font-weight:600;color:${
          r.needToHire > 0 ? "#D2291C" : "#1C2433"
        };">${r.needToHire}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E1E6EE;text-align:center;">${r.openVacancies}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E1E6EE;text-align:center;${
          r.oldestVacancyDays !== null && r.oldestVacancyDays > 30 ? "color:#D2291C;font-weight:600;" : ""
        }">${r.oldestVacancyDays !== null ? `${r.oldestVacancyDays} дн.` : "—"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E1E6EE;text-align:center;color:${
          STATUS_COLOR[r.status]
        };font-weight:600;font-size:12px;">${STATUS_LABEL[r.status]}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Тижневий звіт — ${esc(data.districtName)}</title>
</head>
<body style="margin:0;padding:0;background:#F2F4F8;font-family:'Segoe UI',Arial,sans-serif;color:#1C2433;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F4F8;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#F2F4F8;">
          <tr>
            <td style="padding-bottom:20px;">
              <span style="display:inline-block;background:#0046AD;color:#FFFFFF;font-weight:700;font-size:16px;padding:6px 12px;border-radius:8px;">JYSK</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:4px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;">Тижневий звіт — ${esc(data.districtName)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:20px;color:#6B7684;font-size:13px;">${esc(dateLabel)}</td>
          </tr>

          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="8">
                <tr>
                  ${statCard("Відкриті вакансії", data.openVacancies)}
                  ${statCard("Потрібно найняти", data.needToHireTotal, data.needToHireTotal > 0 ? "#D2291C" : "#1C2433")}
                  ${statCard("Всього працівників", data.totalEmployees ?? "—")}
                </tr>
                <tr>
                  ${statCard("З інвалідністю (магазинів)", data.disabledEmployeeStores)}
                  ${statCard("ЦПХ, осіб", data.flexibleEmployees)}
                  ${statCard(
                    "Середній вік вакансії",
                    data.averageVacancyAgeDays !== null ? `${data.averageVacancyAgeDays} дн.` : "—"
                  )}
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 0 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="8">
                <tr>
                  ${statCard(
                    "Магазинів з дефіцитом",
                    data.storesWithDeficit,
                    data.storesWithDeficit > 0 ? "#D2291C" : "#1C2433"
                  )}
                  ${statCard(
                    "Вакансій > 30 днів",
                    data.storesWithOverdueVacancies,
                    data.storesWithOverdueVacancies > 0 ? "#D2291C" : "#1C2433"
                  )}
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-top:24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E1E6EE;border-radius:10px;overflow:hidden;">
                <thead>
                  <tr>
                    <th align="left" style="padding:12px 14px;font-family:monospace;font-size:10px;letter-spacing:.06em;color:#6B7684;background:#EFF2F7;text-transform:uppercase;">Магазин</th>
                    <th align="center" style="padding:12px 14px;font-family:monospace;font-size:10px;letter-spacing:.06em;color:#6B7684;background:#EFF2F7;text-transform:uppercase;">Потрібно найняти</th>
                    <th align="center" style="padding:12px 14px;font-family:monospace;font-size:10px;letter-spacing:.06em;color:#6B7684;background:#EFF2F7;text-transform:uppercase;">Відкриті вакансії</th>
                    <th align="center" style="padding:12px 14px;font-family:monospace;font-size:10px;letter-spacing:.06em;color:#6B7684;background:#EFF2F7;text-transform:uppercase;">Найстарша вакансія</th>
                    <th align="center" style="padding:12px 14px;font-family:monospace;font-size:10px;letter-spacing:.06em;color:#6B7684;background:#EFF2F7;text-transform:uppercase;">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 0 8px;text-align:center;">
              <a href="${esc(dashboardUrl)}" style="display:inline-block;background:#0046AD;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:8px;">Відкрити дашборд</a>
            </td>
          </tr>
          <tr>
            <td style="padding-top:16px;text-align:center;color:#8A93A0;font-size:11px;">
              Автоматичний тижневий звіт · Kyiv 3 Workforce &amp; Recruitment Dashboard
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
