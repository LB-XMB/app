import { Typography, type TypographyColor } from '@/ui/components';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Relative date used across the forum, e.g. « il y a 12 min ». */
export function formatForumDate(value: string | null): string {
  if (!value) return '';
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return '';

  const elapsed = Date.now() - time;
  if (elapsed < MINUTE) return 'à l’instant';
  if (elapsed < HOUR) return `il y a ${Math.floor(elapsed / MINUTE)} min`;
  if (elapsed < DAY) return `il y a ${Math.floor(elapsed / HOUR)} h`;
  if (elapsed < 7 * DAY) return `il y a ${Math.floor(elapsed / DAY)} j`;

  const date = new Date(time);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(
    'fr-FR',
    sameYear
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' }
  );
}

export interface ForumDateProps {
  value: string | null;
  /** Marks a message edited after publication. */
  editedAt?: string | null;
  color?: TypographyColor;
}

/** Timestamp of a thread or a reply, with the « modifié » hint. */
export function ForumDate({ value, editedAt, color = 'tertiary' }: ForumDateProps) {
  const label = formatForumDate(value);
  if (!label) return null;

  const edited = editedAt && editedAt !== value;

  return (
    <Typography variant="caption" color={color} numberOfLines={1}>
      {edited ? `${label} · modifié` : label}
    </Typography>
  );
}
