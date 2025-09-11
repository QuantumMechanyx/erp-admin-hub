import { format, formatDistanceToNow } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"

const PACIFIC_TIMEZONE = "America/Los_Angeles"

export function formatInPacificTime(date: Date | string, formatStr: string = "MMM d, yyyy 'at' h:mm a"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return formatInTimeZone(dateObj, PACIFIC_TIMEZONE, formatStr)
}

export function formatDistanceToNowPacific(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  // Convert to Pacific time for consistency, but formatDistanceToNow works with any date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

export function getCurrentPacificTime(): Date {
  return new Date()
}

export function formatDateForDisplay(date: Date | string): string {
  return formatInPacificTime(date, "MMM d, yyyy")
}

export function formatDateTimeForDisplay(date: Date | string): string {
  return formatInPacificTime(date, "MMM d, yyyy 'at' h:mm a")
}

export function formatDateForMeetingTitle(): string {
  return formatInPacificTime(new Date(), "M/d/yyyy")
}

export function formatLongDateForHeader(): string {
  return formatInPacificTime(new Date(), "EEEE, MMMM d, yyyy")
}