import { create } from 'zustand';
import { 
  collection, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { sanitizeForFirestore } from '../lib/firestore';
import type { Supercuration, TagCategory } from '../types';

interface SupercurationState {
  supercurations: Supercuration[];
  loading: boolean;
  error: string | null;
  fetchSupercurations: () => Promise<void>;
  addSupercuration: (data: { 
    title: string; 
    description: string;
    thumbnail_url?: string;
    topics: string[];
    tagCategories?: TagCategory[];
  }) => Promise<Supercuration>;
  updateSupercuration: (id: string, data: Partial<Supercuration>) => Promise<void>;
  removeSupercuration: (id: string) => Promise<void>;
}

export const useSupercurationStore = create<SupercurationState>((set, get) => ({
  supercurations: [],
  loading: false,
  error: null,

  fetchSupercurations: async () => {
    try {
      set({ loading: true, error: null });

      const supercurationsQuery = query(
        collection(db, 'supercurations'),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(supercurationsQuery);
      const supercurations: Supercuration[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        tagCategories: doc.data().tagCategories || []
      })) as Supercuration[];

      set({ supercurations, error: null });
    } catch (error) {
      console.error('Error fetching supercurations:', error);
      set({ error: 'Failed to fetch supercurations' });
    } finally {
      set({ loading: false });
    }
  },

  addSupercuration: async (data) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Must be logged in to create supercurations');
      }

      const supercurationData = sanitizeForFirestore({
        ...data,
        created_by: currentUser.uid,
        created_at: serverTimestamp(),
        links_count: 0,
        tagCategories: data.tagCategories || [],
        user: {
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
          avatar_url: currentUser.photoURL || `https://api.dicebear.com/7.x/avatars/svg?seed=${currentUser.email}`
        }
      });

      const docRef = await addDoc(collection(db, 'supercurations'), supercurationData);

      const newSupercuration: Supercuration = {
        id: docRef.id,
        ...supercurationData,
        created_at: new Date().toISOString()
      } as Supercuration;

      set(state => ({
        supercurations: [newSupercuration, ...state.supercurations],
        error: null
      }));

      return newSupercuration;
    } catch (error) {
      console.error('Error adding supercuration:', error);
      throw error;
    }
  },

  updateSupercuration: async (id, data) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Must be logged in to update supercurations');
      }

      const supercurationRef = doc(db, 'supercurations', id);
      const sanitizedData = sanitizeForFirestore(data);
      await updateDoc(supercurationRef, sanitizedData);

      set(state => ({
        supercurations: state.supercurations.map(s =>
          s.id === id ? { ...s, ...data } : s
        ),
        error: null
      }));
    } catch (error) {
      console.error('Error updating supercuration:', error);
      throw error;
    }
  },

  removeSupercuration: async (id) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Must be logged in to remove supercurations');
      }

      await deleteDoc(doc(db, 'supercurations', id));

      set(state => ({
        supercurations: state.supercurations.filter(s => s.id !== id),
        error: null
      }));
    } catch (error) {
      console.error('Error removing supercuration:', error);
      throw error;
    }
  }
}));