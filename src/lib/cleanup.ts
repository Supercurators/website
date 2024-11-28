import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function cleanupAllData() {
  try {
    // Delete all collections in order
    const collections = ['likes', 'links', 'users'];
    
    for (const collectionName of collections) {
      const querySnapshot = await getDocs(collection(db, collectionName));
      await Promise.all(querySnapshot.docs.map(doc => deleteDoc(doc.ref)));
    }

    return { success: true };
  } catch (error) {
    console.error('Cleanup error:', error);
    return { success: false, error };
  }
}