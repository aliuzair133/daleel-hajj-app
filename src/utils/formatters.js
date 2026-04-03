// Format a date to a readable string
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).format(date instanceof Date ? date : new Date(date));
}

// Format time (12-hour)
export function formatTime(date) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric', minute: '2-digit', hour12: true
  }).format(date instanceof Date ? date : new Date(date));
}

// Format countdown (e.g., "2h 34m")
export function formatCountdown(ms) {
  if (ms <= 0) return '0m';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Convert Western digits to Arabic-Indic numerals
export function toArabicNumerals(num) {
  return String(num).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// Get Hijri date string (approximate — for display only)
export function getHijriDate(date = new Date()) {
  // Use browser's Intl API for Hijri calendar
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(date);
  } catch {
    return '';
  }
}

// Capitalize first letter
export function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
