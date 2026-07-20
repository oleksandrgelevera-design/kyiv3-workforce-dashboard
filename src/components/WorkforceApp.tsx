"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Plus, Trash2, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Loader2,
  Users, Briefcase, ChevronDown, ChevronUp, Building2, MessageCircle, LogOut,
} from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Store, Vacancy, Settings } from "@/lib/types";
import { storeFromRow, vacancyFromRow, settingsFromRow } from "@/lib/data/mappers";

const TARGET_DAYS = 30;

/* Фактичні дані зі скріншота ДМ ("Аналіз штату по дистриктах"), розділ Kyiv South.
   Зверніть увагу: J100 у цьому скріншоті відсутній (він у списку "Kyiv North" на
   тому ж аркуші) — тому факт для J100 не імпортується, лишається "очікує факту". */
const ACTUAL_FACTS: Record<string, { actualStakes: number; actualHeadcount: number }> = {
  J017: { actualStakes: 6.5, actualHeadcount: 9 },
  J019: { actualStakes: 6.25, actualHeadcount: 7 },
  J030: { actualStakes: 5.55, actualHeadcount: 7 },

  J061: { actualStakes: 7.75, actualHeadcount: 10 },
  J063: { actualStakes: 4.5, actualHeadcount: 5 },
  J068: { actualStakes: 5.0, actualHeadcount: 7 },
  J087: { actualStakes: 13.5, actualHeadcount: 16 },
  J097: { actualStakes: 8.5, actualHeadcount: 11 },
  J099: { actualStakes: 5.0, actualHeadcount: 6 },
  J116: { actualStakes: 5.75, actualHeadcount: 7 },
  J010: { actualStakes: 5.75, actualHeadcount: 7 },
  J022: { actualStakes: 9.25, actualHeadcount: 13 },
  J080: { actualStakes: 6.5, actualHeadcount: 8 },
};

/* Магазини поза початковим офіційним списком 11, які знайшлись у ваших нових скріншотах
   (J010, J022, J080). Норми (базово/сезон) — з листа "Аналіз DM-RM", факт — з вашого
   скріншота "Аналіз штату по дистриктах". J118 з реєстру вакансій НЕ додано: для нього
   немає жодної норми штату в жодному з файлів — щоб її не вигадувати, він пропущений
   (див. пояснення в чаті). */
const EXTRA_STORES: Store[] = [
  { code: "J010", name: "Ukraina, Kyiv", baseStakes: 6.5, baseHeadcount: 9, seasonStakes: 8.5, seasonHeadcount: 12, actualStakes: 5.75, actualHeadcount: 7, cpdCount: null, riskyCount: null, hasDisabilityEmployee: null, comment: "" },
  { code: "J022", name: "Gulliver, Kyiv", baseStakes: 8, baseHeadcount: 12, seasonStakes: 10.5, seasonHeadcount: 15, actualStakes: 9.25, actualHeadcount: 13, cpdCount: null, riskyCount: null, hasDisabilityEmployee: null, comment: "" },
  { code: "J080", name: "Good Life, Kyiv", baseStakes: 6.75, baseHeadcount: 10, seasonStakes: 8.75, seasonHeadcount: 13, actualStakes: 6.5, actualHeadcount: 8, cpdCount: null, riskyCount: null, hasDisabilityEmployee: null, comment: "" },
];



const EXTRA_VACANCIES: Vacancy[] = [
  { id: "v_extra_01", storeCode: "J010", position: "LR", employmentShare: 0.75, openedDate: "2026-05-28", hiredDate: "2026-07-13", hireStatus: "filled", responsiblePerson: "DepSM", priority: 2, minorEmployeePresent: null, searchChannels: [], marketingPresence: "", ambassadorActions: "", comments: "", workUaContacts: 39.0, workUaUpdatedAt: null, vacancyName: null },
  { id: "v_extra_02", storeCode: "J010", position: "SA", employmentShare: 0.75, openedDate: "2026-03-04", hiredDate: "2026-07-02", hireStatus: "filled", responsiblePerson: "SM", priority: null, minorEmployeePresent: null, searchChannels: ["ворк", "приведи друга + стажери"], marketingPresence: "А1,брошурки на касах, А4 по залу + стажери А1,А4", ambassadorActions: "знайти людину)))", comments: "", workUaContacts: 39.0, workUaUpdatedAt: null, vacancyName: null },
  { id: "v_extra_03", storeCode: "J022", position: "LR", employmentShare: 1.0, openedDate: "2026-02-24", hiredDate: "2026-05-28", hireStatus: "filled", responsiblePerson: "SMT", priority: null, minorEmployeePresent: null, searchChannels: ["ворк"], marketingPresence: "А1,брошурки на касах, А4 по залу + стажери А1,А4+павук", ambassadorActions: "", comments: "Два рази на тиждень розвома з Сергієм, важливо щоб DepSM теж цим займався", workUaContacts: null, workUaUpdatedAt: null, vacancyName: null },
  { id: "v_extra_04", storeCode: "J022", position: "SA", employmentShare: 0.75, openedDate: "2026-04-09", hiredDate: "2026-05-04", hireStatus: "filled", responsiblePerson: "SMT", priority: null, minorEmployeePresent: null, searchChannels: ["ворк"], marketingPresence: "А1,брошурки на касах, А4 по залу + стажери А1,А4", ambassadorActions: "", comments: "", workUaContacts: null, workUaUpdatedAt: null, vacancyName: null },
  { id: "v_extra_05", storeCode: "J080", position: "SA", employmentShare: 0.5, openedDate: "2026-03-12", hiredDate: "2026-05-18", hireStatus: "filled", responsiblePerson: "SM", priority: null, minorEmployeePresent: null, searchChannels: [], marketingPresence: "А1,брошурки на касах, А4 по залу + постер в ТЦ великий", ambassadorActions: "справляється сам", comments: "Один раз на тиждень дзвінок від амасадора", workUaContacts: null, workUaUpdatedAt: null, vacancyName: null },
  { id: "v_extra_06", storeCode: "J080", position: "SA", employmentShare: 0.25, openedDate: "2026-05-13", hiredDate: "2026-05-28", hireStatus: "filled", responsiblePerson: "SM", priority: null, minorEmployeePresent: null, searchChannels: ["ворк", "особиста реклама", "приведи друга"], marketingPresence: "А1,брошурки на касах, А4 по залу + стажери А1,А4", ambassadorActions: "", comments: "", workUaContacts: null, workUaUpdatedAt: null, vacancyName: null },
  { id: "v_extra_07", storeCode: "J080", position: "SA", employmentShare: 0.75, openedDate: "2026-05-13", hiredDate: null, hireStatus: "open", responsiblePerson: "SM", priority: null, minorEmployeePresent: null, searchChannels: ["ворк", "особиста реклама", "приведи друга"], marketingPresence: "А1,брошурки на касах, А4 по залу + стажери А1,А4", ambassadorActions: "", comments: "", workUaContacts: null, workUaUpdatedAt: null, vacancyName: null },
  { id: "v_extra_08", storeCode: "J080", position: "SA", employmentShare: 0.5, openedDate: "2026-05-27", hiredDate: null, hireStatus: "open", responsiblePerson: "SM.DepSM", priority: null, minorEmployeePresent: null, searchChannels: [], marketingPresence: "А1,брошурки на касах, А4 по залу + стажери А1,А4", ambassadorActions: "", comments: "", workUaContacts: null, workUaUpdatedAt: null, vacancyName: null },
  { id: "v_extra_09", storeCode: "J022", position: "SA", employmentShare: 0.5, openedDate: "2026-06-30", hiredDate: null, hireStatus: "open", responsiblePerson: "SMT", priority: null, minorEmployeePresent: null, searchChannels: [], marketingPresence: "", ambassadorActions: "", comments: "", workUaContacts: null, workUaUpdatedAt: null, vacancyName: null },
  { id: "v_extra_10", storeCode: "J080", position: "SA", employmentShare: 0.75, openedDate: "2026-05-28", hiredDate: "2026-07-04", hireStatus: "filled", responsiblePerson: null, priority: null, minorEmployeePresent: null, searchChannels: [], marketingPresence: "", ambassadorActions: "", comments: "", workUaContacts: null, workUaUpdatedAt: null, vacancyName: null },
  { id: "v_extra_11", storeCode: "J080", position: "SA", employmentShare: 0.75, openedDate: "2026-07-08", hiredDate: null, hireStatus: "open", responsiblePerson: null, priority: null, minorEmployeePresent: null, searchChannels: [], marketingPresence: "", ambassadorActions: "", comments: "", workUaContacts: null, workUaUpdatedAt: null, vacancyName: null },
  { id: "v_extra_12", storeCode: "J010", position: "SA", employmentShare: 0.5, openedDate: "2026-07-12", hiredDate: null, hireStatus: "open", responsiblePerson: null, priority: null, minorEmployeePresent: null, searchChannels: [], marketingPresence: "", ambassadorActions: "", comments: "", workUaContacts: null, workUaUpdatedAt: null, vacancyName: null },
];

const POSITION_OPTIONS = ["LR", "SA", "AR", "SM", "DepSM"];
const RESPONSIBLE_OPTIONS = ["SM", "DepSM", "SM.DepSM", "SMT"];
const CHANNEL_SUGGESTIONS = ["work.ua", "Rabota.ua", "Telegram", "Instagram", "OLX", "Referral", "Ambassador"];
const HIRE_STATUS = {
  open: { label: "Відкрита", color: "var(--signal-warn)" },
  filled: { label: "Закрита (найм)", color: "var(--signal-surplus)" },
  transferred: { label: "Переведення", color: "var(--ink-muted)" },
  unclear: { label: "Незрозуміло", color: "var(--signal-deficit)" },
};

function round1(n: number) {
  return Math.round(n * 100) / 100;
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysBetween(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.round((d2 - d1) / 86400000);
}

function statusOf(store) {
  if (store.actualStakes === null || store.actualStakes === undefined || store.actualStakes === "") return "pending";
  const diffStakes = round1(store.actualStakes - store.baseStakes);
  if (store.actualHeadcount !== null && store.actualHeadcount !== undefined && store.actualHeadcount !== "") {
    const diffHeadcount = round1(store.actualHeadcount - store.baseHeadcount);
    if (diffHeadcount <= -3) return "peopleCritical";
    if (diffHeadcount <= -1) return "peopleWarning";
  }
  if (diffStakes < -0.01) return "deficit";
  if (diffStakes > 0.01) return "surplus";
  return "ok";
}
const STATUS_META = {
  pending: { label: "Дані не введено", color: "var(--signal-warn)", Icon: AlertCircle },
  peopleCritical: { label: "Критична нестача людей", color: "var(--signal-deficit)", Icon: TrendingDown },
  peopleWarning: { label: "Не вистачає людей", color: "var(--signal-warn)", Icon: AlertCircle },
  deficit: { label: "Дефіцит", color: "var(--signal-deficit)", Icon: TrendingDown },
  surplus: { label: "Надлишок", color: "var(--signal-surplus)", Icon: TrendingUp },
  ok: { label: "Норма", color: "var(--ink-muted)", Icon: CheckCircle2 },
};

function vacancyDerived(v) {
  const status = v.hireStatus || "open";
  let daysOpen = null;
  let overdue = false;
  let timeToFill = null;
  if (status === "open") {
    daysOpen = daysBetween(v.openedDate, todayStr());
    overdue = daysOpen > TARGET_DAYS;
  } else if (status === "filled" && v.hiredDate) {
    timeToFill = daysBetween(v.openedDate, v.hiredDate);
  }
  return { status, daysOpen, overdue, timeToFill };
}

/* ---------- shared bits ---------- */

function StatCard({ eyebrow, value, unit, tone }) {
  return (
    <div className="stat-card">
      <div className="stat-eyebrow">{eyebrow}</div>
      <div className="stat-value" style={tone ? { color: tone } : undefined}>
        {value}
        {unit ? <span className="stat-unit">{unit}</span> : null}
      </div>
    </div>
  );
}

function NumberField({ value, placeholder, onCommit }) {
  const [local, setLocal] = useState(value === null || value === undefined ? "" : String(value));
  useEffect(() => setLocal(value === null || value === undefined ? "" : String(value)), [value]);
  const commit = () => {
    if (local.trim() === "") return onCommit(null);
    const num = parseFloat(local.replace(",", "."));
    if (!isNaN(num)) onCommit(round1(num));
    else setLocal(value === null || value === undefined ? "" : String(value));
  };
  return (
    <input
      className="num-field"
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  );
}

function TextCommitField({ value, placeholder, onCommit, multiline, className }) {
  const [local, setLocal] = useState(value || "");
  useEffect(() => setLocal(value || ""), [value]);
  const commit = () => onCommit(local);
  if (multiline) {
    return (
      <textarea
        className={className || "text-field textarea"}
        placeholder={placeholder}
        value={local}
        rows={3}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
      />
    );
  }
  return (
    <input
      className={className || "text-field"}
      type="text"
      placeholder={placeholder}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  );
}

/* ---------- District (Store Registry) ---------- */

function AddStoreCard({ onAdd, onCancel }) {
  const [form, setForm] = useState({ code: "", name: "", baseStakes: "", baseHeadcount: "", seasonStakes: "", seasonHeadcount: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    const baseStakes = parseFloat(form.baseStakes.replace(",", "."));
    const baseHeadcount = parseFloat(form.baseHeadcount.replace(",", "."));
    if (!code) return setError("Вкажіть код магазину.");
    if (!name) return setError("Вкажіть назву магазину.");
    if (isNaN(baseStakes) || isNaN(baseHeadcount)) return setError("Норма ставок і людей — обов'язкові числа.");
    const seasonStakes = form.seasonStakes.trim() === "" ? null : parseFloat(form.seasonStakes.replace(",", "."));
    const seasonHeadcount = form.seasonHeadcount.trim() === "" ? null : parseFloat(form.seasonHeadcount.replace(",", "."));
    onAdd({
      code, name,
      baseStakes: round1(baseStakes), baseHeadcount: round1(baseHeadcount),
      seasonStakes: seasonStakes === null || isNaN(seasonStakes) ? null : round1(seasonStakes),
      seasonHeadcount: seasonHeadcount === null || isNaN(seasonHeadcount) ? null : round1(seasonHeadcount),
      actualStakes: null, actualHeadcount: null, cpdCount: null, riskyCount: null, hasDisabilityEmployee: null, comment: "",
    });
  };

  return (
    <div className="tag-card new-card">
      <div className="tag-strip tag-strip--new"><span className="tag-strip-code">+</span></div>
      <div className="perforation" />
      <div className="tag-body">
        <div className="new-form-grid">
          <label className="field-label">Код<input className="text-field" placeholder="J000" value={form.code} onChange={set("code")} /></label>
          <label className="field-label field-label--wide">Назва<input className="text-field" placeholder="Назва, місто" value={form.name} onChange={set("name")} /></label>
          <label className="field-label">Норма ставок<input className="text-field" placeholder="0.00" value={form.baseStakes} onChange={set("baseStakes")} /></label>
          <label className="field-label">Норма людей<input className="text-field" placeholder="0" value={form.baseHeadcount} onChange={set("baseHeadcount")} /></label>
          <label className="field-label">Сезон ставок<input className="text-field" placeholder="необов'язково" value={form.seasonStakes} onChange={set("seasonStakes")} /></label>
          <label className="field-label">Сезон людей<input className="text-field" placeholder="необов'язково" value={form.seasonHeadcount} onChange={set("seasonHeadcount")} /></label>
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <div className="new-form-actions">
          <button className="btn btn--ghost" onClick={onCancel}>Скасувати</button>
          <button className="btn btn--solid" onClick={submit}>Додати магазин</button>
        </div>
      </div>
    </div>
  );
}

function StoreTag({ store, openVacancyCount, oldestOpenDays, onUpdate, onDelete }) {
  const status = statusOf(store);
  const meta = STATUS_META[status];
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const hasComment = !!(store.comment && store.comment.trim());

  const diffStakes = store.actualStakes == null ? null : round1(store.actualStakes - store.baseStakes);
  const diffHeadcount = store.actualHeadcount == null ? null : round1(store.actualHeadcount - store.baseHeadcount);
  const pctStakes = diffStakes === null || store.baseStakes === 0 ? null : round1((diffStakes / store.baseStakes) * 100);

  return (
    <div className="tag-card" style={{ "--status-color": meta.color }}>
      <div className="tag-strip">
        <span className="tag-strip-label">МАГАЗИН</span>
        <span className="tag-strip-code">{store.code}</span>
        <span className="tag-strip-dot" />
      </div>
      <div className="perforation" />
      <div className="tag-body">
        <div className="tag-header">
          <div>
            <div className="tag-name">{store.name}</div>
            <div className="tag-status" style={{ color: meta.color }}><meta.Icon size={13} strokeWidth={2.5} />{meta.label}</div>
          </div>
          <div className="tag-header-actions">
            <button
              className={`icon-btn ${hasComment ? "icon-btn--active" : ""}`}
              title="Коментар до магазину"
              onClick={() => setCommentOpen((o) => !o)}
            >
              <MessageCircle size={15} />
            </button>
            {!confirmingDelete ? (
              <button className="icon-btn" title="Видалити магазин" onClick={() => setConfirmingDelete(true)}><Trash2 size={15} /></button>
            ) : (
              <div className="confirm-delete">
                <span>Видалити?</span>
                <button className="icon-btn icon-btn--danger" onClick={() => onDelete(store.code)}>Так</button>
                <button className="icon-btn" onClick={() => setConfirmingDelete(false)}>Ні</button>
              </div>
            )}
          </div>
        </div>

        {commentOpen ? (
          <div className="comment-box">
            <TextCommitField
              value={store.comment}
              placeholder="Коментар до магазину…"
              multiline
              onCommit={(v) => onUpdate(store.code, "comment", v)}
            />
          </div>
        ) : null}

        <div className="data-grid">
          <div className="data-col-head" />
          <div className="data-col-head">Ставок</div>
          <div className="data-col-head">Людей</div>

          <div className="data-row-label">Норма (базово)</div>
          <div className="data-cell data-cell--readonly">{store.baseStakes}</div>
          <div className="data-cell data-cell--readonly">{store.baseHeadcount}</div>

          <div className="data-row-label">Норма (сезон)</div>
          <div className="data-cell data-cell--readonly data-cell--muted">{store.seasonStakes == null ? "уточнити" : store.seasonStakes}</div>
          <div className="data-cell data-cell--readonly data-cell--muted">{store.seasonHeadcount == null ? "уточнити" : store.seasonHeadcount}</div>

          <div className="data-row-label data-row-label--emph">Фактично</div>
          <div className="data-cell"><NumberField value={store.actualStakes} placeholder="—" onCommit={(v) => onUpdate(store.code, "actualStakes", v)} /></div>
          <div className="data-cell"><NumberField value={store.actualHeadcount} placeholder="—" onCommit={(v) => onUpdate(store.code, "actualHeadcount", v)} /></div>

          <div className="data-row-label">Різниця</div>
          <div className="data-cell data-cell--readonly" style={{ color: diffStakes == null ? undefined : diffStakes < 0 ? "var(--signal-deficit)" : diffStakes > 0 ? "var(--signal-surplus)" : undefined }}>
            {diffStakes == null ? "—" : diffStakes > 0 ? `+${diffStakes}` : diffStakes}
          </div>
          <div className="data-cell data-cell--readonly" style={{ color: diffHeadcount == null ? undefined : diffHeadcount < 0 ? "var(--signal-deficit)" : diffHeadcount > 0 ? "var(--signal-surplus)" : undefined }}>
            {diffHeadcount == null ? "—" : diffHeadcount > 0 ? `+${diffHeadcount}` : diffHeadcount}
          </div>
        </div>

        {pctStakes !== null ? (
          <div className="pct-bar-wrap">
            <div className="pct-bar-track">
              <div className="pct-bar-fill" style={{ width: `${Math.min(Math.abs(pctStakes), 100)}%`, background: pctStakes < 0 ? "var(--signal-deficit)" : "var(--signal-surplus)", marginLeft: pctStakes < 0 ? "auto" : 0 }} />
            </div>
            <span className="pct-label">{pctStakes > 0 ? "+" : ""}{pctStakes}% від норми</span>
          </div>
        ) : null}

        <div className="hr-block">
          <div className="hr-block-row hr-block-row--readonly">
            <span className="hr-block-label"><Briefcase size={12} /> Відкритих вакансій</span>
            <span className="hr-block-value hr-block-value--count">
              {openVacancyCount}{openVacancyCount > 0 ? ` (${oldestOpenDays} дн.)` : ""}
            </span>
          </div>
          <div className="hr-block-row">
            <span className="hr-block-label">ЦПХ (к-сть)</span>
            <NumberField value={store.cpdCount} placeholder="—" onCommit={(v) => onUpdate(store.code, "cpdCount", v)} />
          </div>
          <div className="hr-block-row">
            <span className="hr-block-label">Ризикованих (к-сть)</span>
            <NumberField value={store.riskyCount} placeholder="—" onCommit={(v) => onUpdate(store.code, "riskyCount", v)} />
          </div>
          <div className="hr-block-row">
            <span className="hr-block-label">Працівник з інвалідністю</span>
            <div className="yn-toggle">
              <button className={`yn-btn ${store.hasDisabilityEmployee === true ? "yn-btn--active-yes" : ""}`} onClick={() => onUpdate(store.code, "hasDisabilityEmployee", true)}>Так</button>
              <button className={`yn-btn ${store.hasDisabilityEmployee === false ? "yn-btn--active-no" : ""}`} onClick={() => onUpdate(store.code, "hasDisabilityEmployee", false)}>Ні</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DistrictView({ stores, vacancies, updateStore, addStore, deleteStore, adding, setAdding, importActuals, addExtraStoresAndVacancies }) {
  const withActual = stores.filter((s) => s.actualStakes != null);
  const totalBaseStakes = round1(stores.reduce((a, s) => a + s.baseStakes, 0));
  const totalActualStakes = round1(withActual.reduce((a, s) => a + s.actualStakes, 0));
  const totalGap = round1(totalActualStakes - withActual.reduce((a, s) => a + s.baseStakes, 0));
  const deficitCount = stores.filter((s) => ["deficit", "peopleWarning", "peopleCritical"].includes(statusOf(s))).length;
  const openVacancyCountByStore = {};
  const oldestOpenDaysByStore = {};
  vacancies.forEach((v) => {
    const d = vacancyDerived(v);
    if (d.status === "open") {
      openVacancyCountByStore[v.storeCode] = (openVacancyCountByStore[v.storeCode] || 0) + 1;
      if (!(v.storeCode in oldestOpenDaysByStore) || d.daysOpen > oldestOpenDaysByStore[v.storeCode]) {
        oldestOpenDaysByStore[v.storeCode] = d.daysOpen;
      }
    }
  });
  const [confirmingImport, setConfirmingImport] = useState(false);
  const [confirmingExtra, setConfirmingExtra] = useState(false);
  const importableCount = stores.filter((s) => ACTUAL_FACTS[s.code]).length;
  const existingCodes = new Set(stores.map((s) => s.code));
  const extraStoresCount = EXTRA_STORES.filter((s) => !existingCodes.has(s.code)).length;

  const withActualHC = stores.filter((s) => s.actualHeadcount != null);
  const totalEmployees = withActualHC.reduce((a, s) => a + s.actualHeadcount, 0);
  const disabilityStoreCount = stores.filter((s) => s.hasDisabilityEmployee === true).length;
  const totalCpd = stores.reduce((a, s) => a + (s.cpdCount || 0), 0);

  return (
    <>
      <section className="stat-strip">
        <StatCard eyebrow="НОРМА, СТАВОК" value={totalBaseStakes} />
        <StatCard eyebrow="ФАКТ ВВЕДЕНО ПО" value={withActual.length} unit={` / ${stores.length}`} />
        <StatCard eyebrow="ГАП, СТАВОК" value={withActual.length ? (totalGap > 0 ? `+${totalGap}` : totalGap) : "—"} tone={totalGap < 0 ? "var(--signal-deficit)" : totalGap > 0 ? "var(--signal-surplus)" : undefined} />
        <StatCard eyebrow="МАГАЗИНІВ З ДЕФІЦИТОМ" value={deficitCount} tone={deficitCount > 0 ? "var(--signal-deficit)" : undefined} />
        <StatCard eyebrow="ВСЬОГО ПРАЦІВНИКІВ" value={withActualHC.length ? totalEmployees : "—"} />
        <StatCard eyebrow="З ІНВАЛІДНІСТЮ, МАГАЗИНІВ" value={disabilityStoreCount} />
        <StatCard eyebrow="ЦПХ, ОСІБ" value={totalCpd} />
      </section>

      {importableCount > 0 ? (
        <div className="import-row">
          {!confirmingImport ? (
            <button className="btn btn--ghost import-btn" onClick={() => setConfirmingImport(true)}>
              <CheckCircle2 size={13} /> Залити факт зі скріншота ДМ ({importableCount} магазинів)
            </button>
          ) : (
            <div className="import-confirm">
              <span>Перезаписати "Фактично" для {importableCount} магазинів даними зі скріншота?</span>
              <button className="btn btn--solid" onClick={() => { importActuals(); setConfirmingImport(false); }}>Так, залити</button>
              <button className="btn btn--ghost" onClick={() => setConfirmingImport(false)}>Скасувати</button>
            </div>
          )}
        </div>
      ) : null}

      {extraStoresCount > 0 ? (
        <div className="import-row">
          {!confirmingExtra ? (
            <button className="btn btn--ghost import-btn" onClick={() => setConfirmingExtra(true)}>
              <Plus size={13} /> Додати ще магазини з нового скріншота ({extraStoresCount}: {EXTRA_STORES.filter((s) => !existingCodes.has(s.code)).map((s) => s.code).join(", ")})
            </button>
          ) : (
            <div className="import-confirm">
              <span>Додати {extraStoresCount} магазин(и) з нормами, фактом і вакансіями з ваших скріншотів?</span>
              <button className="btn btn--solid" onClick={() => { addExtraStoresAndVacancies(); setConfirmingExtra(false); }}>Так, додати</button>
              <button className="btn btn--ghost" onClick={() => setConfirmingExtra(false)}>Скасувати</button>
            </div>
          )}
        </div>
      ) : null}

      <section className="registry-grid">
        {stores.map((s) => (
          <StoreTag key={s.code} store={s} openVacancyCount={openVacancyCountByStore[s.code] || 0} oldestOpenDays={oldestOpenDaysByStore[s.code]} onUpdate={updateStore} onDelete={deleteStore} />
        ))}
        {adding ? (
          <AddStoreCard onAdd={addStore} onCancel={() => setAdding(false)} />
        ) : (
          <button className="tag-card add-card" onClick={() => setAdding(true)}><Plus size={22} /><span>Додати магазин</span></button>
        )}
      </section>
    </>
  );
}

/* ---------- Vacancies (Recruitment module) ---------- */

function ChannelTags({ value, onChange }) {
  const list = value || [];
  const [input, setInput] = useState("");
  const add = (tag) => {
    const t = tag.trim();
    if (!t || list.includes(t)) return;
    onChange([...list, t]);
    setInput("");
  };
  const remove = (t) => onChange(list.filter((x) => x !== t));
  return (
    <div>
      <div className="channel-tags">
        {list.map((t) => (
          <span key={t} className="channel-tag">
            {t}<button onClick={() => remove(t)}>×</button>
          </span>
        ))}
        <input
          className="channel-input"
          placeholder="+ канал"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(input); } }}
        />
      </div>
      <div className="channel-suggestions">
        {CHANNEL_SUGGESTIONS.filter((c) => !list.includes(c)).map((c) => (
          <button key={c} className="channel-suggestion" onClick={() => add(c)}>{c}</button>
        ))}
      </div>
    </div>
  );
}

function AddVacancyForm({ stores, onAdd, onCancel }) {
  const [form, setForm] = useState({
    storeCode: stores[0]?.code || "",
    position: "SA",
    employmentShare: "0.5",
    openedDate: todayStr(),
    hireStatus: "open",
    hiredDate: "",
  });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (!form.storeCode) return setError("Оберіть магазин.");
    if (!form.openedDate) return setError("Вкажіть дату відкриття.");
    if (form.hireStatus === "filled" && !form.hiredDate) return setError("Вкажіть дату закриття (найму).");
    onAdd({
      id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      storeCode: form.storeCode,
      vacancyName: null,
      position: form.position,
      employmentShare: parseFloat(form.employmentShare) || 0.5,
      openedDate: form.openedDate,
      hiredDate: form.hireStatus === "filled" ? form.hiredDate : null,
      hireStatus: form.hireStatus,
      responsiblePerson: null,
      priority: null,
      minorEmployeePresent: null,
      searchChannels: [],
      marketingPresence: "",
      ambassadorActions: "",
      comments: "",
      workUaContacts: null,
      workUaUpdatedAt: null,
    });
  };

  return (
    <div className="vacancy-card new-card">
      <div className="vacancy-strip" style={{ "--status-color": "var(--ink-muted)" }} />
      <div className="vacancy-body">
        <div className="vac-form-grid">
          <label className="field-label">Магазин
            <select className="text-field" value={form.storeCode} onChange={set("storeCode")}>
              {stores.map((s) => <option key={s.code} value={s.code}>{s.code} · {s.name}</option>)}
            </select>
          </label>
          <label className="field-label">Посада
            <select className="text-field" value={form.position} onChange={set("position")}>
              {POSITION_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="field-label">Зайнятість (ставка)
            <input className="text-field" value={form.employmentShare} onChange={set("employmentShare")} placeholder="0.5" />
          </label>
          <label className="field-label">Дата відкриття
            <input type="date" className="text-field" value={form.openedDate} onChange={set("openedDate")} />
          </label>
          <label className="field-label">Статус
            <select className="text-field" value={form.hireStatus} onChange={set("hireStatus")}>
              {Object.entries(HIRE_STATUS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
            </select>
          </label>
          {form.hireStatus === "filled" ? (
            <label className="field-label">Дата закриття (найму)
              <input type="date" className="text-field" value={form.hiredDate} onChange={set("hiredDate")} />
            </label>
          ) : null}
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <div className="new-form-actions">
          <button className="btn btn--ghost" onClick={onCancel}>Скасувати</button>
          <button className="btn btn--solid" onClick={submit}>Зберегти вакансію</button>
        </div>
      </div>
    </div>
  );
}

function VacancyRow({ vacancy, store, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const d = vacancyDerived(vacancy);
  const statusMeta = HIRE_STATUS[d.status];

  const setStatus = (newStatus) => {
    onUpdate(vacancy.id, "hireStatus", newStatus);
  };

  return (
    <>
      <tr className="vac-row" style={{ "--status-color": d.overdue ? "var(--signal-deficit)" : statusMeta.color }}>
        <td className="vac-td vac-td--store">
          <span className="vac-store-code">{vacancy.storeCode}</span>
          {store ? <span className="vac-store-name">{store.name}</span> : null}
        </td>
        <td className="vac-td vac-td--center">{vacancy.employmentShare} ставки</td>
        <td className="vac-td vac-td--center"><span className="vac-position">{vacancy.position}</span></td>
        <td className="vac-td vac-td--center">
          <input
            type="date"
            className="date-input-inline"
            value={vacancy.openedDate || ""}
            onChange={(e) => onUpdate(vacancy.id, "openedDate", e.target.value)}
          />
        </td>
        <td className="vac-td vac-td--center">
          <div className="close-date-cell">
            <select className="status-select status-select--sm" style={{ color: statusMeta.color }} value={d.status} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(HIRE_STATUS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
            </select>
            {vacancy.hireStatus === "filled" ? (
              <input
                type="date"
                className="date-input-inline"
                value={vacancy.hiredDate || ""}
                onChange={(e) => onUpdate(vacancy.id, "hiredDate", e.target.value || null)}
              />
            ) : null}
          </div>
        </td>
        <td className="vac-td vac-td--center">
          {vacancy.hireStatus === "filled" ? (
            d.timeToFill != null ? (
              <span className={d.timeToFill > TARGET_DAYS ? "overdue-flag" : "target-ok"}>
                {d.timeToFill} дн. <span className="target-muted">(ціль {TARGET_DAYS})</span>
              </span>
            ) : (
              <span className="overdue-flag">вкажіть дату</span>
            )
          ) : d.status === "open" ? (
            <span className={d.overdue ? "overdue-flag" : "target-muted"}>
              {d.daysOpen} дн. {d.overdue ? "· прострочено" : `(ціль ${TARGET_DAYS})`}
            </span>
          ) : (
            <span className="target-muted">—</span>
          )}
        </td>
        <td className="vac-td vac-td--actions">
          {!confirmingDelete ? (
            <button className="icon-btn" onClick={() => setConfirmingDelete(true)}><Trash2 size={14} /></button>
          ) : (
            <div className="confirm-delete">
              <button className="icon-btn icon-btn--danger" onClick={() => onDelete(vacancy.id)}>Так</button>
              <button className="icon-btn" onClick={() => setConfirmingDelete(false)}>Ні</button>
            </div>
          )}
          <button className="icon-btn" onClick={() => setExpanded((e) => !e)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </td>
      </tr>

      {expanded ? (
        <tr className="vac-detail-row">
          <td className="vac-td vac-detail-td" colSpan={7}>
            <div className="vac-expanded-grid">
              <div><span className="exp-label">Відповідальний:</span>
                <select
                  className="text-field vac-inline-select"
                  value={vacancy.responsiblePerson || ""}
                  onChange={(e) => onUpdate(vacancy.id, "responsiblePerson", e.target.value || null)}
                >
                  <option value="">—</option>
                  {RESPONSIBLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><span className="exp-label">Пріоритет:</span>
                <select
                  className="text-field vac-inline-select"
                  value={vacancy.priority ?? ""}
                  onChange={(e) => onUpdate(vacancy.id, "priority", e.target.value === "" ? null : Number(e.target.value))}
                >
                  <option value="">—</option><option value="1">1</option><option value="2">2</option><option value="3">3</option>
                </select>
              </div>
              <div><span className="exp-label">Неповнолітніх:</span> {vacancy.minorEmployeePresent ?? "—"}</div>
              <div><span className="exp-label">Маркетинг:</span> {vacancy.marketingPresence || "—"}</div>
            </div>
            <div className="channel-tags" style={{ marginTop: 8 }}>
              {(vacancy.searchChannels || []).length ? vacancy.searchChannels.map((c) => <span key={c} className="channel-tag channel-tag--static">{c}</span>) : <span className="exp-label">канали не вказано</span>}
            </div>
            {vacancy.ambassadorActions ? <div className="vac-note"><span className="exp-label">Амбасадор:</span> {vacancy.ambassadorActions}</div> : null}
            {vacancy.comments ? <div className="vac-note"><span className="exp-label">Коментар:</span> {vacancy.comments}</div> : null}
            <div className="work-block">
              <div className="work-block-label"><Building2 size={12} /> Активність work.ua (цей місяць)</div>
              <div className="work-block-row">
                <NumberField
                  value={vacancy.workUaContacts}
                  placeholder="к-сть контактів"
                  onCommit={(v) => { onUpdate(vacancy.id, "workUaContacts", v); onUpdate(vacancy.id, "workUaUpdatedAt", v == null ? null : todayStr()); }}
                />
                <span className="work-block-date">{vacancy.workUaUpdatedAt ? `оновлено ${vacancy.workUaUpdatedAt}` : "не оновлювалось"}</span>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function VacanciesView({ stores, vacancies, addVacancy, updateVacancy, deleteVacancy, adding, setAdding }) {
  const [filter, setFilter] = useState("all");
  const storeByCode = Object.fromEntries(stores.map((s) => [s.code, s]));

  const derivedList = vacancies.map((v) => ({ v, d: vacancyDerived(v) }));
  const openCount = derivedList.filter((x) => x.d.status === "open").length;
  const overdueCount = derivedList.filter((x) => x.d.overdue).length;
  const filledWithTime = derivedList.filter((x) => x.d.status === "filled" && x.d.timeToFill != null);
  const avgTimeToFill = filledWithTime.length ? round1(filledWithTime.reduce((a, x) => a + x.d.timeToFill, 0) / filledWithTime.length) : null;

  const filtered = derivedList.filter(({ d }) => {
    if (filter === "all") return true;
    if (filter === "open") return d.status === "open";
    if (filter === "closed") return d.status !== "open";
    return true;
  });

  return (
    <>
      <section className="stat-strip">
        <StatCard eyebrow="ВІДКРИТІ ВАКАНСІЇ" value={openCount} />
        <StatCard eyebrow="ПРОСТРОЧЕНО (&gt;30 ДН.)" value={overdueCount} tone={overdueCount > 0 ? "var(--signal-deficit)" : undefined} />
        <StatCard eyebrow="СЕРЕДНІЙ TIME-TO-FILL" value={avgTimeToFill ?? "—"} unit={avgTimeToFill != null ? " дн." : ""} tone={avgTimeToFill != null ? (avgTimeToFill > TARGET_DAYS ? "var(--signal-deficit)" : "var(--signal-surplus)") : undefined} />
        <StatCard eyebrow="ЦІЛЬ TIME-TO-FILL" value={TARGET_DAYS} unit=" дн." />
      </section>

      <div className="filter-row">
        {[["all", "Всі"], ["open", "Відкриті"], ["closed", "Закриті"]].map(([k, label]) => (
          <button key={k} className={`filter-chip ${filter === k ? "filter-chip--active" : ""}`} onClick={() => setFilter(k)}>{label}</button>
        ))}
        <button className="btn btn--solid vac-add-btn" onClick={() => setAdding(true)}><Plus size={14} /> Відкрити вакансію</button>
      </div>

      {adding ? <AddVacancyForm stores={stores} onAdd={(v) => { addVacancy(v); setAdding(false); }} onCancel={() => setAdding(false)} /> : null}

      {filtered.length === 0 && !adding ? (
        <div className="empty-state">
          <Briefcase size={20} />
          <span>{vacancies.length === 0 ? "Ще немає жодної вакансії в дистрикті." : "Немає вакансій за цим фільтром."}</span>
        </div>
      ) : (
        <div className="vac-table-wrap">
          <table className="vac-table">
            <thead>
              <tr>
                <th>Магазин</th>
                <th>Тип зайнятості</th>
                <th>Посада</th>
                <th>Дата відкриття</th>
                <th>Дата закриття</th>
                <th>Ціль (30 днів)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ v }) => (
                <VacancyRow key={v.id} vacancy={v} store={storeByCode[v.storeCode]} onUpdate={updateVacancy} onDelete={deleteVacancy} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function EditableTitle({ value, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  if (editing) {
    return (
      <input
        className="page-title-input"
        autoFocus
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={() => { setEditing(false); const v = local.trim() || value; setLocal(v); onCommit(v); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") { setLocal(value); setEditing(false); }
        }}
      />
    );
  }
  return (
    <h1 className="page-title page-title--editable" onClick={() => setEditing(true)} title="Натисніть, щоб перейменувати">
      {value}
    </h1>
  );
}

/* ---------- App shell ---------- */

interface WorkforceAppProps {
  initialStores: Store[];
  initialVacancies: Vacancy[];
  initialSettings: Settings;
  userEmail: string;
  onSignOut: () => void;
}

export default function App({
  initialStores,
  initialVacancies,
  initialSettings,
  userEmail,
  onSignOut,
}: WorkforceAppProps) {
  const [tab, setTab] = useState("district");
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [vacancies, setVacancies] = useState<Vacancy[]>(initialVacancies);
  const [dashboardTitle, setDashboardTitle] = useState<string>(initialSettings.dashboardTitle);
  const [addingStore, setAddingStore] = useState(false);
  const [addingVacancy, setAddingVacancy] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const importFileRef = useRef<HTMLInputElement>(null);
  const storeFieldTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const vacancyFieldTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // ---------------------------------------------------------------------
  // Realtime: any INSERT/UPDATE/DELETE on stores/vacancies/settings from
  // ANY connected user (or this tab, harmlessly) is applied to local state
  // immediately — this is what makes "manager A edits, manager B sees it
  // instantly" work, with no page refresh.
  // ---------------------------------------------------------------------
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel("kyiv3-district-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stores" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setStores((prev) => prev.filter((s) => s.code !== (payload.old as any).code));
          } else {
            const incoming = storeFromRow(payload.new as any);
            setStores((prev) => {
              const exists = prev.some((s) => s.code === incoming.code);
              return exists
                ? prev.map((s) => (s.code === incoming.code ? incoming : s))
                : [...prev, incoming].sort((a, b) => a.code.localeCompare(b.code));
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vacancies" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setVacancies((prev) => prev.filter((v) => v.id !== (payload.old as any).id));
          } else {
            const incoming = vacancyFromRow(payload.new as any);
            setVacancies((prev) => {
              const exists = prev.some((v) => v.id === incoming.id);
              return exists
                ? prev.map((v) => (v.id === incoming.id ? incoming : v))
                : [incoming, ...prev];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "settings" },
        (payload) => {
          const incoming = settingsFromRow(payload.new as any);
          setDashboardTitle(incoming.dashboardTitle);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------
  // Title
  // ---------------------------------------------------------------------
  const updateTitle = (value: string) => {
    setDashboardTitle(value);
    setSaveState("saving");
    if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(async () => {
      const { error } = await supabase
        .from("settings")
        .update({ dashboard_title: value })
        .eq("id", 1);
      setSaveState(error ? "error" : "saved");
    }, 300);
  };

  // ---------------------------------------------------------------------
  // Stores
  // ---------------------------------------------------------------------
  const FIELD_TO_COLUMN: Record<string, string> = {
    actualStakes: "actual_stakes",
    actualHeadcount: "actual_headcount",
    cpdCount: "cpd_count",
    riskyCount: "risky_count",
    hasDisabilityEmployee: "has_disability_employee",
    comment: "comment",
  };

  const updateStore = (code: string, field: string, value: unknown) => {
    setStores((prev) => prev.map((s) => (s.code === code ? { ...s, [field]: value } : s)));

    const column = FIELD_TO_COLUMN[field] ?? field;
    setSaveState("saving");
    const timerKey = `${code}:${field}`;
    if (storeFieldTimers.current[timerKey]) clearTimeout(storeFieldTimers.current[timerKey]);
    storeFieldTimers.current[timerKey] = setTimeout(async () => {
      const { error } = await supabase.from("stores").update({ [column]: value }).eq("code", code);
      setSaveState(error ? "error" : "saved");
    }, 300);
  };

  const addStore = async (newStore: Store) => {
    setStores((prev) => (prev.some((s) => s.code === newStore.code) ? prev : [...prev, newStore]));
    setAddingStore(false);
    setSaveState("saving");
    const { error } = await supabase.from("stores").insert({
      code: newStore.code,
      name: newStore.name,
      base_stakes: newStore.baseStakes,
      base_headcount: newStore.baseHeadcount,
      season_stakes: newStore.seasonStakes,
      season_headcount: newStore.seasonHeadcount,
      actual_stakes: newStore.actualStakes,
      actual_headcount: newStore.actualHeadcount,
      cpd_count: newStore.cpdCount,
      risky_count: newStore.riskyCount,
      has_disability_employee: newStore.hasDisabilityEmployee,
      comment: newStore.comment,
    });
    setSaveState(error ? "error" : "saved");
  };

  const deleteStore = async (code: string) => {
    setStores((prev) => prev.filter((s) => s.code !== code));
    setSaveState("saving");
    const { error } = await supabase.from("stores").delete().eq("code", code);
    setSaveState(error ? "error" : "saved");
  };

  const importActuals = async () => {
    const patches = stores
      .filter((s) => ACTUAL_FACTS[s.code])
      .map((s) => ({ code: s.code, ...ACTUAL_FACTS[s.code] }));
    setStores((prev) =>
      prev.map((s) => (ACTUAL_FACTS[s.code] ? { ...s, ...ACTUAL_FACTS[s.code] } : s))
    );
    setSaveState("saving");
    const results = await Promise.all(
      patches.map((p) =>
        supabase
          .from("stores")
          .update({ actual_stakes: p.actualStakes, actual_headcount: p.actualHeadcount })
          .eq("code", p.code)
      )
    );
    setSaveState(results.some((r) => r.error) ? "error" : "saved");
  };

  const addExtraStoresAndVacancies = async () => {
    const existingCodes = new Set(stores.map((s) => s.code));
    const storesToAdd = EXTRA_STORES.filter((s) => !existingCodes.has(s.code));
    const existingVacIds = new Set(vacancies.map((v) => v.id));
    const vacsToAdd = EXTRA_VACANCIES.filter((v) => !existingVacIds.has(v.id));
    if (storesToAdd.length === 0 && vacsToAdd.length === 0) return;

    setStores((prev) => [...prev, ...storesToAdd]);
    setVacancies((prev) => [...vacsToAdd, ...prev]);
    setSaveState("saving");

    const storeInsert = storesToAdd.length
      ? supabase.from("stores").insert(
          storesToAdd.map((s) => ({
            code: s.code,
            name: s.name,
            base_stakes: s.baseStakes,
            base_headcount: s.baseHeadcount,
            season_stakes: s.seasonStakes,
            season_headcount: s.seasonHeadcount,
            actual_stakes: s.actualStakes,
            actual_headcount: s.actualHeadcount,
            cpd_count: s.cpdCount,
            risky_count: s.riskyCount,
            has_disability_employee: s.hasDisabilityEmployee,
            comment: s.comment,
          }))
        )
      : Promise.resolve({ error: null });

    const vacInsert = vacsToAdd.length
      ? supabase.from("vacancies").insert(
          vacsToAdd.map((v) => ({
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
            search_channels: v.searchChannels,
            marketing_presence: v.marketingPresence,
            ambassador_actions: v.ambassadorActions,
            comments: v.comments,
            work_ua_contacts: v.workUaContacts,
            work_ua_updated_at: v.workUaUpdatedAt,
          }))
        )
      : Promise.resolve({ error: null });

    const [r1, r2] = await Promise.all([storeInsert, vacInsert]);
    setSaveState(r1.error || r2.error ? "error" : "saved");
  };

  // ---------------------------------------------------------------------
  // Vacancies
  // ---------------------------------------------------------------------
  const VAC_FIELD_TO_COLUMN: Record<string, string> = {
    vacancyName: "vacancy_name",
    openedDate: "opened_date",
    hiredDate: "hired_date",
    hireStatus: "hire_status",
    responsiblePerson: "responsible_person",
    minorEmployeePresent: "minor_employee_present",
    marketingPresence: "marketing_presence",
    ambassadorActions: "ambassador_actions",
    workUaContacts: "work_ua_contacts",
    workUaUpdatedAt: "work_ua_updated_at",
    priority: "priority",
    comments: "comments",
  };

  const addVacancy = async (v: Vacancy) => {
    setVacancies((prev) => [v, ...prev]);
    setSaveState("saving");
    const { error } = await supabase.from("vacancies").insert({
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
      search_channels: v.searchChannels,
      marketing_presence: v.marketingPresence,
      ambassador_actions: v.ambassadorActions,
      comments: v.comments,
      work_ua_contacts: v.workUaContacts,
      work_ua_updated_at: v.workUaUpdatedAt,
    });
    setSaveState(error ? "error" : "saved");
  };

  const updateVacancy = (id: string, field: string, value: unknown) => {
    setVacancies((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));

    const column = VAC_FIELD_TO_COLUMN[field] ?? field;
    setSaveState("saving");
    const timerKey = `${id}:${field}`;
    if (vacancyFieldTimers.current[timerKey]) clearTimeout(vacancyFieldTimers.current[timerKey]);
    vacancyFieldTimers.current[timerKey] = setTimeout(async () => {
      const { error } = await supabase.from("vacancies").update({ [column]: value }).eq("id", id);
      setSaveState(error ? "error" : "saved");
    }, 300);
  };

  const deleteVacancy = async (id: string) => {
    setVacancies((prev) => prev.filter((v) => v.id !== id));
    setSaveState("saving");
    const { error } = await supabase.from("vacancies").delete().eq("id", id);
    setSaveState(error ? "error" : "saved");
  };

  // ---------------------------------------------------------------------
  // Manual backup (Export/Import) — still handy even with a shared DB:
  // Export downloads a point-in-time JSON snapshot; Import bulk-writes a
  // previously exported file back into Supabase (visible to everyone once
  // it lands, thanks to Realtime).
  // ---------------------------------------------------------------------
  const exportData = () => {
    const payload = { dashboardTitle, stores, vacancies, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kyiv3-workforce-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => importFileRef.current && importFileRef.current.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!Array.isArray(data.stores) || !Array.isArray(data.vacancies)) {
          window.alert("Файл не схожий на резервну копію цього застосунку (немає stores/vacancies).");
          return;
        }
        if (
          !window.confirm(
            "Замінити дані в спільній базі даними з цього файлу? Це перезапише те, що зараз бачать усі користувачі."
          )
        ) {
          return;
        }
        setSaveState("saving");
        setStores(data.stores);
        setVacancies(data.vacancies);
        const storeRows = (data.stores as Store[]).map((s) => ({
          code: s.code,
          name: s.name,
          base_stakes: s.baseStakes,
          base_headcount: s.baseHeadcount,
          season_stakes: s.seasonStakes,
          season_headcount: s.seasonHeadcount,
          actual_stakes: s.actualStakes,
          actual_headcount: s.actualHeadcount,
          cpd_count: s.cpdCount,
          risky_count: s.riskyCount,
          has_disability_employee: s.hasDisabilityEmployee,
          comment: s.comment,
        }));
        const vacancyRows = (data.vacancies as Vacancy[]).map((v) => ({
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
          search_channels: v.searchChannels,
          marketing_presence: v.marketingPresence,
          ambassador_actions: v.ambassadorActions,
          comments: v.comments,
          work_ua_contacts: v.workUaContacts,
          work_ua_updated_at: v.workUaUpdatedAt,
        }));
        const [r1, r2] = await Promise.all([
          supabase.from("stores").upsert(storeRows),
          supabase.from("vacancies").upsert(vacancyRows),
        ]);
        if (typeof data.dashboardTitle === "string" && data.dashboardTitle.trim()) {
          setDashboardTitle(data.dashboardTitle);
          await supabase.from("settings").update({ dashboard_title: data.dashboardTitle }).eq("id", 1);
        }
        setSaveState(r1.error || r2.error ? "error" : "saved");
      } catch (err: any) {
        window.alert("Не вдалося прочитати файл: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
  };

  return (
    <div className="app-root">
      <StyleBlock />
      <header className="page-header">
        <div className="page-header-main">
          <div className="brand-badge" aria-label="JYSK">JYSK</div>
          <div>
            <EditableTitle value={dashboardTitle} onCommit={updateTitle} />
            {tab === "vacancies" ? (
              <div className="page-sub">{`${vacancies.length} вакансій · ціль закриття — ${TARGET_DAYS} днів`}</div>
            ) : null}
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn--ghost header-io-btn" onClick={exportData} title="Зберегти знімок даних у файл">
            Зберегти у файл
          </button>
          <button className="btn btn--ghost header-io-btn" onClick={triggerImport} title="Завантажити раніше збережений файл">
            Завантажити з файлу
          </button>
          <input ref={importFileRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={handleImportFile} />
          <div className={`save-indicator save-indicator--${saveState}`}>
            {saveState === "saving" ? <><Loader2 className="spin" size={13} /> збереження…</>
              : saveState === "saved" ? <><CheckCircle2 size={13} /> збережено</>
              : saveState === "error" ? <><AlertCircle size={13} /> помилка збереження</>
              : <span>&nbsp;</span>}
          </div>
          <div className="user-chip" title={userEmail}>
            <Users size={13} />
            <span className="user-chip-email">{userEmail}</span>
            <button className="icon-btn" onClick={handleSignOut} title="Вийти">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </header>

      <nav className="tab-nav">
        <button className={`tab-btn ${tab === "district" ? "tab-btn--active" : ""}`} onClick={() => setTab("district")}>
          <Building2 size={14} /> Дистрикт
        </button>
        <button className={`tab-btn ${tab === "vacancies" ? "tab-btn--active" : ""}`} onClick={() => setTab("vacancies")}>
          <Briefcase size={14} /> Вакансії
        </button>
        <a className="tab-btn" href="/settings">
          Налаштування
        </a>
      </nav>

      {tab === "district" ? (
        <DistrictView stores={stores} vacancies={vacancies} updateStore={updateStore} addStore={addStore} deleteStore={deleteStore} adding={addingStore} setAdding={setAddingStore} importActuals={importActuals} addExtraStoresAndVacancies={addExtraStoresAndVacancies} />
      ) : (
        <VacanciesView stores={stores} vacancies={vacancies} addVacancy={addVacancy} updateVacancy={updateVacancy} deleteVacancy={deleteVacancy} adding={addingVacancy} setAdding={setAddingVacancy} />
      )}
    </div>
  );
}

function StyleBlock() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600;700&display=swap');

      :root {
        --bg-void: #F2F4F8; --bg-panel: #FFFFFF; --bg-panel-raised: #EFF2F7;
        --line: #E1E6EE; --ink: #1C2433; --ink-muted: #6B7684;
        --signal-deficit: #D2291C; --signal-surplus: #0E8A5F; --signal-warn: #B5590A;
        --brand-blue: #0046AD; --brand-blue-dark: #00337D; --on-dark: #FFFFFF;
        --shadow-card: 0 1px 2px rgba(16,24,40,0.04), 0 4px 12px rgba(16,24,40,0.06);
        --shadow-sm: 0 1px 2px rgba(16,24,40,0.06);
      }
      .app-root { background: var(--bg-void); color: var(--ink); font-family: 'IBM Plex Sans', sans-serif; min-height: 100vh; padding: 32px 28px 60px; box-sizing: border-box; }
      .app-root * { box-sizing: border-box; }
      .loading-root { display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--ink-muted); font-size: 14px; }
      .spin { animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }

      .page-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--line); padding-bottom: 20px; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
      .page-header-main { display: flex; align-items: center; gap: 16px; }
      .brand-badge {
        background: var(--brand-blue); color: var(--on-dark); font-family: 'Space Grotesk', sans-serif;
        font-weight: 700; font-size: 18px; letter-spacing: 0.02em; padding: 8px 14px; border-radius: 8px;
        box-shadow: var(--shadow-sm); flex-shrink: 0;
      }
      .eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; color: var(--ink-muted); margin-bottom: 6px; }
      .page-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 27px; margin: 0; letter-spacing: -0.01em; color: var(--ink); }
      .page-title--editable { cursor: pointer; border-bottom: 1px dashed transparent; }
      .page-title--editable:hover { border-bottom-color: var(--ink-muted); }
      .page-title-input {
        font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 27px; letter-spacing: -0.01em;
        color: var(--ink); background: var(--bg-panel-raised); border: 1px solid var(--brand-blue); border-radius: 6px;
        padding: 2px 8px; outline: none; width: min(560px, 90vw);
      }
      .page-sub { color: var(--ink-muted); font-size: 13px; margin-top: 6px; }
      .save-indicator { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--ink-muted); display: flex; align-items: center; gap: 6px; min-width: 100px; justify-content: flex-end; }
      .save-indicator--saved { color: var(--signal-surplus); }
      .save-indicator--error { color: var(--signal-deficit); }

      .header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
      .header-io-btn { font-size: 11.5px; padding: 6px 10px; white-space: nowrap; }
      .user-chip {
        display: flex; align-items: center; gap: 6px; background: var(--bg-panel-raised);
        border: 1px solid var(--line); border-radius: 999px; padding: 4px 6px 4px 10px;
        font-size: 11.5px; color: var(--ink-muted);
      }
      .user-chip-email { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .tab-nav { display: flex; gap: 6px; margin-bottom: 22px; }
      .tab-btn { display: flex; align-items: center; gap: 6px; background: var(--bg-panel); border: 1px solid var(--line); color: var(--ink-muted); padding: 8px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; box-shadow: var(--shadow-sm); text-decoration: none; }
      .tab-btn--active { background: var(--brand-blue); color: var(--on-dark); border-color: var(--brand-blue); }

      .stat-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px; background: var(--line); border: 1px solid var(--line); margin-bottom: 22px; border-radius: 10px; overflow: hidden; box-shadow: var(--shadow-card); }
      .stat-card { background: var(--bg-panel); padding: 14px 16px; }
      .stat-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.08em; color: var(--ink-muted); margin-bottom: 8px; }
      .stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 25px; font-weight: 600; color: var(--ink); }
      .stat-unit { font-size: 14px; color: var(--ink-muted); margin-left: 3px; font-weight: 500; }

      .registry-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 16px; }

      .tag-card { display: flex; background: var(--bg-panel); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; position: relative; animation: rise .25s ease; box-shadow: var(--shadow-card); }
      @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .tag-strip { width: 40px; flex-shrink: 0; background: var(--bg-panel-raised); border-right: 1px solid var(--line); display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 10px; padding: 14px 0; position: relative; }
      .tag-strip::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--status-color, var(--line)); }
      .tag-strip-label { writing-mode: vertical-rl; transform: rotate(180deg); font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.14em; color: var(--ink-muted); }
      .tag-strip-code { writing-mode: vertical-rl; transform: rotate(180deg); font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 15px; color: var(--ink); }
      .tag-strip-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--status-color, var(--line)); margin-top: auto; }
      .tag-strip--new { background: transparent; }
      .tag-strip--new .tag-strip-code { writing-mode: horizontal-tb; transform: none; font-size: 20px; color: var(--ink-muted); }
      .perforation { width: 0; border-left: 1px dashed var(--line); margin: 12px 0; }
      .tag-body { flex: 1; padding: 14px 16px 16px; min-width: 0; }
      .tag-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 12px; }
      .tag-header-actions { display: flex; align-items: center; gap: 6px; }
      .tag-name { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 15px; line-height: 1.25; }
      .tag-status { display: flex; align-items: center; gap: 5px; font-size: 11.5px; margin-top: 5px; font-weight: 500; }

      .comment-box { margin-bottom: 12px; }
      .comment-box textarea { width: 100%; }

      .icon-btn { background: var(--bg-panel); border: 1px solid var(--line); color: var(--ink-muted); border-radius: 6px; padding: 5px 7px; cursor: pointer; display: flex; align-items: center; font-size: 11.5px; gap: 4px; white-space: nowrap; }
      .icon-btn:hover { border-color: var(--brand-blue); color: var(--brand-blue); }
      .icon-btn--danger { color: var(--signal-deficit); border-color: var(--signal-deficit); }
      .icon-btn--active { color: var(--brand-blue); border-color: var(--brand-blue); background: #EAF1FC; }
      .confirm-delete { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--ink-muted); }

      .data-grid { display: grid; grid-template-columns: 1fr 68px 68px; row-gap: 6px; column-gap: 8px; align-items: center; }
      .data-col-head { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; letter-spacing: 0.06em; color: var(--ink-muted); text-align: center; padding-bottom: 2px; }
      .data-row-label { font-size: 12px; color: var(--ink-muted); }
      .data-row-label--emph { color: var(--ink); font-weight: 600; }
      .data-cell { font-family: 'IBM Plex Mono', monospace; font-size: 13px; text-align: center; background: var(--bg-panel-raised); border-radius: 5px; padding: 5px 2px; }
      .data-cell--readonly { background: transparent; color: var(--ink); }
      .data-cell--muted { color: var(--ink-muted); font-size: 11px; }

      .num-field { width: 100%; background: var(--bg-panel-raised); border: 1px solid var(--line); color: var(--ink); font-family: 'IBM Plex Mono', monospace; font-size: 13px; text-align: center; border-radius: 5px; padding: 5px 2px; outline: none; }
      .num-field:focus { border-color: var(--brand-blue); }
      .num-field::placeholder { color: #A4ABB6; }

      .pct-bar-wrap { margin-top: 12px; }
      .pct-bar-track { height: 4px; background: var(--bg-panel-raised); border-radius: 2px; overflow: hidden; display: flex; }
      .pct-bar-fill { height: 100%; border-radius: 2px; }
      .pct-label { display: block; margin-top: 6px; font-size: 11px; color: var(--ink-muted); font-family: 'IBM Plex Mono', monospace; }

      .work-block { margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--line); }
      .work-block-label { display: flex; align-items: center; gap: 5px; font-size: 10.5px; letter-spacing: 0.04em; color: var(--ink-muted); margin-bottom: 6px; font-family: 'IBM Plex Mono', monospace; }
      .work-block-row { display: flex; align-items: center; gap: 8px; }
      .work-block-row .num-field { width: 90px; flex-shrink: 0; }
      .work-block-date { font-size: 10.5px; color: var(--ink-muted); }

      .hr-block { margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--line); display: flex; flex-direction: column; gap: 8px; }
      .hr-block-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .hr-block-row .num-field { width: 64px; flex-shrink: 0; }
      .hr-block-label { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ink-muted); }
      .hr-block-row--readonly { padding-bottom: 2px; }
      .hr-block-value--count { font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 14px; color: var(--ink); }
      .yn-toggle { display: flex; gap: 4px; }
      .yn-btn { background: var(--bg-panel-raised); border: 1px solid var(--line); color: var(--ink-muted); border-radius: 5px; padding: 4px 10px; font-size: 11.5px; cursor: pointer; }
      .yn-btn--active-yes { background: var(--brand-blue); color: var(--on-dark); border-color: var(--brand-blue); }
      .yn-btn--active-no { background: var(--bg-panel-raised); color: var(--ink); border-color: var(--ink-muted); }

      .import-row { margin-bottom: 16px; }
      .import-btn { display: flex; align-items: center; gap: 6px; }
      .import-confirm { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 12.5px; color: var(--ink-muted); background: var(--bg-panel); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; box-shadow: var(--shadow-sm); }

      .add-card { border: 1.5px dashed var(--line); background: transparent; color: var(--ink-muted); display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; font-size: 13.5px; min-height: 120px; border-radius: 12px; }
      .add-card:hover { border-color: var(--brand-blue); color: var(--brand-blue); }
      .new-card { border-style: dashed; }
      .new-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .field-label--wide { grid-column: span 2; }
      .field-label { font-size: 11px; color: var(--ink-muted); display: flex; flex-direction: column; gap: 5px; }
      .text-field { background: var(--bg-panel-raised); border: 1px solid var(--line); color: var(--ink); border-radius: 6px; padding: 7px 9px; font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; outline: none; }
      .text-field:focus { border-color: var(--brand-blue); }
      .textarea { resize: vertical; font-family: 'IBM Plex Sans', sans-serif; }
      .form-error { color: var(--signal-deficit); font-size: 11.5px; margin-top: 10px; }
      .new-form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
      .btn { border-radius: 6px; padding: 7px 14px; font-size: 12.5px; font-weight: 500; cursor: pointer; border: 1px solid var(--line); font-family: 'IBM Plex Sans', sans-serif; }
      .btn--ghost { background: transparent; color: var(--ink-muted); }
      .btn--ghost:hover { color: var(--ink); border-color: var(--ink-muted); }
      .btn--solid { background: var(--brand-blue); color: var(--on-dark); border-color: var(--brand-blue); display: flex; align-items: center; gap: 6px; }
      .btn--solid:hover { background: var(--brand-blue-dark); border-color: var(--brand-blue-dark); }

      /* vacancies */
      .filter-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
      .filter-chip { background: var(--bg-panel); border: 1px solid var(--line); color: var(--ink-muted); padding: 6px 12px; border-radius: 999px; font-size: 12px; cursor: pointer; }
      .filter-chip--active { background: var(--brand-blue); color: var(--on-dark); border-color: var(--brand-blue); }
      .vac-add-btn { margin-left: auto; }

      .vacancy-card { display: flex; background: var(--bg-panel); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; animation: rise .2s ease; margin-bottom: 16px; box-shadow: var(--shadow-card); }
      .vacancy-strip { width: 4px; flex-shrink: 0; background: var(--status-color, var(--line)); }
      .vacancy-body { flex: 1; padding: 14px 16px; min-width: 0; }

      .vac-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

      /* vacancy table */
      .vac-table-wrap { overflow-x: auto; background: var(--bg-panel); border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow-card); }
      .vac-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
      .vac-table thead th {
        text-align: left; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.06em;
        color: var(--ink-muted); padding: 12px 14px; border-bottom: 1px solid var(--line); background: var(--bg-panel-raised);
        white-space: nowrap;
      }
      .vac-row td { border-bottom: 1px solid var(--line); position: relative; }
      .vac-row:last-child td { border-bottom: none; }
      .vac-row::before { content: ""; }
      .vac-row td:first-child { border-left: 3px solid var(--status-color, var(--line)); }
      .vac-td { padding: 10px 14px; vertical-align: middle; }
      .vac-td--center { text-align: center; }
      .vac-td--store { display: flex; flex-direction: column; gap: 2px; }
      .vac-td--actions { display: flex; align-items: center; justify-content: flex-end; gap: 6px; white-space: nowrap; }
      .vac-store-code { font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 13px; }
      .vac-store-name { font-size: 11.5px; color: var(--ink-muted); }
      .vac-position { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; background: var(--bg-panel-raised); padding: 2px 7px; border-radius: 5px; color: var(--ink-muted); }
      .vac-name-input { width: 100%; min-width: 140px; }
      .status-select { background: var(--bg-panel-raised); border: 1px solid var(--line); border-radius: 6px; padding: 4px 8px; font-size: 12px; font-weight: 600; }
      .status-select--sm { font-size: 11px; padding: 3px 6px; }
      .close-date-cell { display: flex; flex-direction: column; align-items: center; gap: 5px; }
      .date-input-inline { background: var(--bg-panel-raised); border: 1px solid var(--line); color: var(--ink); border-radius: 5px; padding: 3px 6px; font-size: 11.5px; font-family: 'IBM Plex Mono', monospace; }
      .overdue-flag { color: var(--signal-deficit); font-weight: 600; }
      .target-ok { color: var(--signal-surplus); font-weight: 600; }
      .target-muted { color: var(--ink-muted); }

      .vac-detail-row td { background: var(--bg-panel-raised); border-bottom: 1px solid var(--line); }
      .vac-detail-td { padding: 14px 16px; font-size: 12.5px; color: var(--ink-muted); }
      .vac-expanded-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; align-items: center; }
      .vac-inline-select { padding: 4px 6px; font-size: 12px; margin-left: 6px; display: inline-block; width: auto; }
      .exp-label { color: var(--ink); font-weight: 500; margin-right: 4px; }
      .vac-note { margin-top: 8px; }

      .channel-tags { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
      .channel-tag { background: var(--bg-panel); border: 1px solid var(--line); border-radius: 999px; padding: 3px 8px; font-size: 11.5px; display: flex; align-items: center; gap: 5px; }
      .channel-tag button { background: none; border: none; color: var(--ink-muted); cursor: pointer; font-size: 13px; line-height: 1; padding: 0; }
      .channel-tag--static { color: var(--ink-muted); }
      .channel-input { background: transparent; border: none; outline: none; color: var(--ink); font-size: 12px; width: 90px; }
      .channel-suggestions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
      .channel-suggestion { background: transparent; border: 1px dashed var(--line); color: var(--ink-muted); border-radius: 999px; padding: 3px 8px; font-size: 11px; cursor: pointer; }
      .channel-suggestion:hover { color: var(--brand-blue); border-color: var(--brand-blue); }

      .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 50px 0; color: var(--ink-muted); font-size: 13px; border: 1.5px dashed var(--line); border-radius: 12px; }

      @media (max-width: 720px) {
        .stat-strip { grid-template-columns: repeat(2, 1fr); }
        .new-form-grid, .vac-form-grid { grid-template-columns: 1fr; }
        .field-label--wide { grid-column: span 1; }
        .vac-expanded-grid { grid-template-columns: 1fr 1fr; }
        .page-header-main { gap: 10px; }
        .brand-badge { font-size: 14px; padding: 6px 10px; }
        .page-title, .page-title-input { font-size: 21px; }
      }
    `}</style>
  );
}
