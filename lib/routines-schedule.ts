import { CronExpressionParser } from "cron-parser";

export const DEFAULT_ROUTINE_TZ = "America/Mendoza";

function validTz(tz: string): string {
  try {
    new Intl.DateTimeFormat("es-AR", { timeZone: tz });
    return tz;
  } catch {
    return "America/Argentina/Mendoza";
  }
}

/** Próxima ejecución (ISO) o null si el cron es inválido/no hay. */
export function nextRun(
  cron: string | null | undefined,
  timezone: string | null | undefined = DEFAULT_ROUTINE_TZ,
  from: Date = new Date(),
): string | null {
  if (!cron?.trim()) return null;
  try {
    const expr = CronExpressionParser.parse(cron.trim(), {
      currentDate: from,
      tz: validTz(timezone || DEFAULT_ROUTINE_TZ),
    });
    return expr.next().toDate().toISOString();
  } catch {
    return null;
  }
}

export function isValidCron(cron: string): boolean {
  return nextRun(cron, DEFAULT_ROUTINE_TZ) !== null;
}
