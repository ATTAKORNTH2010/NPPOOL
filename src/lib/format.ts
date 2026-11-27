/**
 * Thai display formats (ADR-0008, BR-UI-02/03). Values are stored as UTC
 * timestamps; everything shown to users is converted to Asia/Bangkok and the
 * year is shown in the Buddhist era. Keep all date formatting here.
 */
const TIME_ZONE = "Asia/Bangkok";

const dateFormatter = new Intl.DateTimeFormat("th-TH-u-ca-buddhist-nu-latn", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function part(formatter: Intl.DateTimeFormat, date: Date, type: Intl.DateTimeFormatPartTypes): string {
  return formatter.formatToParts(date).find((p) => p.type === type)?.value ?? "";
}

/** dd/MM/yyyy (พ.ศ.) in Thai time, e.g. 27/11/2569 */
export function formatDateTh(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "";
  return `${part(dateFormatter, date, "day")}/${part(dateFormatter, date, "month")}/${part(dateFormatter, date, "year")}`;
}

/** HH:mm (24 h) in Thai time */
export function formatTimeTh(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "";
  return `${part(timeFormatter, date, "hour")}:${part(timeFormatter, date, "minute")}`;
}

/** dd/MM/yyyy HH:mm (พ.ศ., 24 h) in Thai time */
export function formatDateTimeTh(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "";
  return `${formatDateTh(date)} ${formatTimeTh(date)}`;
}

/**
 * #,##0.00 for display only. Money values from Postgres numeric arrive as
 * strings; never do arithmetic on the converted number.
 */
export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? moneyFormatter.format(n) : "";
}
