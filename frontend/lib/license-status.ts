export type LicenseStatus = "VIGENTE" | "POR_VENCER" | "VENCIDA" | "SIN_FECHA";

const DAY_MS = 86_400_000;

function simpleDateEpoch(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function operationalDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Monterrey",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function licenseDaysRemaining(expiration: string, now = new Date()) {
  return Math.round((simpleDateEpoch(expiration) - simpleDateEpoch(operationalDate(now))) / DAY_MS);
}

export function licenseStatus(expiration: string | null | undefined, now = new Date()): LicenseStatus {
  if (!expiration) return "SIN_FECHA";
  const days = licenseDaysRemaining(expiration, now);
  if (days < 0) return "VENCIDA";
  if (days <= 30) return "POR_VENCER";
  return "VIGENTE";
}

export function formatLicenseDate(expiration: string) {
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${expiration}T00:00:00Z`));
}
