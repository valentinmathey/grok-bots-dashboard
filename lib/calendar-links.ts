/** https://… → webcal://… para que iOS/macOS abran el diálogo nativo de suscripción. */
export function toWebcalUrl(feedUrl: string): string {
  return feedUrl.replace(/^https?:\/\//i, "webcal://");
}

/** Link que abre Google Calendar con el diálogo para agregar el calendario por URL. */
export function googleCalendarSubscribeUrl(feedUrl: string): string {
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(toWebcalUrl(feedUrl))}`;
}
