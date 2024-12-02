import { serverTimestamp } from 'firebase/firestore';
import type { Link, Supercuration } from '../types';
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

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

export async function cleanupInvalidLinks() {
  try {
    // Query for documents where id is null, undefined, or empty string
    const linksRef = collection(db, 'links');
    const invalidLinksQuery = query(linksRef, 
      where('id', '==', null)
    );

    const querySnapshot = await getDocs(invalidLinksQuery);
    
    console.log(`Found ${querySnapshot.size} invalid links`);
    
    // Delete each invalid document
    const deletePromises = querySnapshot.docs.map(async (doc) => {
      console.log('Deleting invalid link with doc ID:', doc.id);
      try {
        await deleteDoc(doc.ref);
        return true;
      } catch (error) {
        console.error('Error deleting doc:', doc.id, error);
        return false;
      }
    });

    const results = await Promise.all(deletePromises);
    const deletedCount = results.filter(Boolean).length;
    
    console.log(`Successfully deleted ${deletedCount} invalid links`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up invalid links:', error);
    throw error;
  }
}