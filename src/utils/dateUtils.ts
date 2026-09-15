/**
 * Utility functions for Date of Birth (DOB) parsing, normalization, and formatting.
 */

/**
 * Normalizes any ambiguous DOB string into canonical YYYY-MM-DD format.
 * Accepts formats:
 *  - YYYY-MM-DD (e.g. "2013-12-30")
 *  - YYYY/MM/DD, YYYY.MM.DD
 *  - DD-MM-YYYY (e.g. "30-12-2013")
 *  - DD/MM/YYYY, DD.MM.YYYY
 *  - D-M-YYYY (e.g. "5-4-2015")
 *  - DDMMYYYY (e.g. "30122013")
 *  - YYYYMMDD (e.g. "20131230")
 *
 * Returns canonical "YYYY-MM-DD" if valid, or null if unparseable.
 */
export function normalizeDOB(input?: string | null): string | null {
  if (!input) return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Replace common separators (/ . space) with standard hyphen (-)
  const standardized = trimmed.replace(/[\/\.\s]+/g, "-");

  // 1. Check YYYY-MM-DD or YYYY-M-D
  const ymdMatch = standardized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);

    if (isValidCalendarDate(year, month, day)) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  // 2. Check DD-MM-YYYY or D-M-YYYY
  const dmyMatch = standardized.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    if (isValidCalendarDate(year, month, day)) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  // 3. Check 8-digit numeric string without separators (e.g. 30122013 or 20131230)
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.length === 8) {
    // Try YYYYMMDD first
    const yearYMD = parseInt(digitsOnly.substring(0, 4), 10);
    const monthYMD = parseInt(digitsOnly.substring(4, 6), 10);
    const dayYMD = parseInt(digitsOnly.substring(6, 8), 10);

    if (yearYMD >= 1900 && yearYMD <= 2099 && isValidCalendarDate(yearYMD, monthYMD, dayYMD)) {
      return `${yearYMD}-${String(monthYMD).padStart(2, "0")}-${String(dayYMD).padStart(2, "0")}`;
    }

    // Try DDMMYYYY
    const dayDMY = parseInt(digitsOnly.substring(0, 2), 10);
    const monthDMY = parseInt(digitsOnly.substring(2, 4), 10);
    const yearDMY = parseInt(digitsOnly.substring(4, 8), 10);

    if (yearDMY >= 1900 && yearDMY <= 2099 && isValidCalendarDate(yearDMY, monthDMY, dayDMY)) {
      return `${yearDMY}-${String(monthDMY).padStart(2, "0")}-${String(dayDMY).padStart(2, "0")}`;
    }
  }

  return null;
}

/**
 * Validates basic calendar bounds for year, month, and day.
 */
function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2099) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Verify month length (handles Feb leap years, 30-day months)
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
