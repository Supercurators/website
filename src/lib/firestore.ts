import { serverTimestamp } from 'firebase/firestore';
import type { Link, Supercuration } from '../types';

export function sanitizeForFirestore(data: Partial<Link | Supercuration>) {
  // Remove undefined values and empty arrays
  const sanitized = Object.entries(data).reduce((acc, [key, value]) => {
    if (value === undefined) return acc;
    if (Array.isArray(value) && value.length === 0) return acc;
    if (value === null) return acc;
    acc[key] = value;
    return acc;
  }, {} as Record<string, any>);

  // Add timestamp if not present
  if (!sanitized.created_at) {
    sanitized.created_at = serverTimestamp();
  }

  return sanitized;
}

export function validateLinkData(data: Partial<Link>): boolean {
  return Boolean(
    data.title &&
    typeof data.title === 'string' &&
    data.description &&
    typeof data.description === 'string'
  );
}