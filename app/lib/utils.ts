import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { startOfDay, addDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TIMEZONE = "America/Sao_Paulo";

export const getDayInterval = (date: Date = new Date()) => {
  const zonedDate = toZonedTime(date, TIMEZONE);
  const start = fromZonedTime(startOfDay(zonedDate), TIMEZONE);
  const end = fromZonedTime(startOfDay(addDays(zonedDate, 1)), TIMEZONE);
  return { start, end };
};
