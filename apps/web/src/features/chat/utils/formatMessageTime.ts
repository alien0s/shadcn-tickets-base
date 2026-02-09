/**
 * Formata timestamps de mensagens para UI.
 * - Hoje: HH:mm
 * - Ontem: Ontem HH:mm
 * - Outros: dd/MM HH:mm
 */
export function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = startOfDay(now).getTime() - startOfDay(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (diffDays === 0) return time;
  if (diffDays === 1) return `Ontem ${time}`;

  const day = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);

  return `${day} ${time}`;
}
