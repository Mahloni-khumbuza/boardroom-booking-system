export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function formatDate(date: string | Date, locale = 'en-ZA'): string {
  return new Date(date).toLocaleDateString(locale, {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  });
}

export function formatTime(date: string | Date, locale = 'en-ZA'): string {
  return new Date(date).toLocaleTimeString(locale, {
    hour:   '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: string | Date, locale = 'en-ZA'): string {
  return `${formatDate(date, locale)}, ${formatTime(date, locale)}`;
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
