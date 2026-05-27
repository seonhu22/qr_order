export function formatDateTimeForDisplay(value?: string | null) {
  if (!value) {
    return '';
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return '';
  }

  const normalizedValue = trimmedValue.replace('T', ' ').replace(/Z$/, '');
  const [datePart = '', timePart = ''] = normalizedValue.split(' ');

  if (!datePart || !timePart) {
    return normalizedValue;
  }

  const normalizedTimePart = timePart.split('.')[0] ?? timePart;

  return `${datePart} ${normalizedTimePart}`;
}
