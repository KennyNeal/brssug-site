export function formatDateTime(value: string | null) {
  if (!value) {
    return 'Date to be announced';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date to be announced';
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}