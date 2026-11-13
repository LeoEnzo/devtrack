export function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(parseLocalDate(iso));
}

export function formatWeek(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(parseLocalDate(iso));
}

export function daysFromToday(iso: string): number {
  const today = parseLocalDate(todayIso()).getTime();
  const target = parseLocalDate(iso).getTime();
  return Math.round((target - today) / 86_400_000);
}

export function nextStepLabel(iso: string): string {
  const days = daysFromToday(iso);
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  if (days === -1) return "ontem";
  if (days < 0) return `há ${Math.abs(days)} dias`;
  return `em ${days} dias`;
}

export function timeAgo(iso: string): string {
  const days = -daysFromToday(iso.slice(0, 10));
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  if (days < 30) return `há ${Math.floor(days / 7)} sem.`;
  return `há ${Math.floor(days / 30)} meses`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
