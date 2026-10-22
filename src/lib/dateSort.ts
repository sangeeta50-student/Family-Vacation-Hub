const clean = (value = "") => value
  .replace(/[\u00a0\u202f]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export const dateSortValue = (date?: string, time?: string): number => {
  const dateText = clean(date).replace(
    /^(?:Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?),?\s+/i,
    ""
  );
  if (!dateText || !/\d/.test(dateText)) return Number.POSITIVE_INFINITY;

  let day: number;
  const iso = dateText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, year, month, dateOfMonth] = iso.map(Number);
    day = Date.UTC(year, month - 1, dateOfMonth);
    const parsed = new Date(day);
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== dateOfMonth
    ) return Number.POSITIVE_INFINITY;
  } else {
    const withYear = /\b\d{4}\b/.test(dateText)
      ? dateText
      : `${dateText}, ${new Date().getFullYear()}`;
    const parsed = new Date(withYear);
    if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
    day = Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  const timeText = clean(time).replace(/[.\s]/g, "");
  const match = timeText.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?([ap]m)?$/i);
  if (match) {
    const [, hourText, minuteText = "0", secondText = "0", period] = match;
    let hour = Number(hourText);
    const minute = Number(minuteText);
    const second = Number(secondText);
    const validHour = period ? hour >= 1 && hour <= 12 : hour <= 23;
    if (validHour && minute <= 59 && second <= 59) {
      if (period) hour = hour % 12 + (period.toLowerCase() === "pm" ? 12 : 0);
      return day + ((hour * 60 + minute) * 60 + second) * 1000;
    }
  }

  // Unknown times follow timed entries on the same calendar date.
  return day + 86400000 - 1;
};
