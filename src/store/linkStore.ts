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
  enableNetwork,
  disableNetwork,
  serverTimestamp,
  where,
  getDoc,
  increment,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { sanitizeForFirestore, validateLinkData } from '../lib/firestore';
import type { Link } from '../types';

interface LinkState {
  links: Link[];
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  fetchLinks: () => Promise<void>;
  addLink: (data: AddLinkData) => Promise<void>;
  updateLink: (id: string, data: Partial<Link>) => Promise<void>;
  removeLink: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  setOfflineStatus: (status: boolean) => Promise<void>;
}

interface AddLinkData {
  url?: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  emoji_tags: string[];
  topic_ids: string[];
  is_original_content: boolean;
  supercuration_ids?: string[];
  publish_to_feed?: boolean;
}

export const useLinkStore = create<LinkState>((set, get) => ({
  links: [],
  loading: false,
  error: null,
  isOffline: !navigator.onLine,

  fetchLinks: async () => {
    try {
      set({ loading: true, error: null });

      const linksQuery = query(
        collection(db, 'links'),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(linksQuery);
      const currentUser = auth.currentUser;
      const links: Link[] = [];

      let userLikes: string[] = [];
      if (currentUser) {
        const likesQuery = query(
          collection(db, 'likes'),
          where('userId', '==', currentUser.uid)
        );
        const likesSnapshot = await getDocs(likesQuery);
        userLikes = likesSnapshot.docs.map(doc => doc.data().linkId);
      }

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        links.push({
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          liked: userLikes.includes(doc.id),
          likes: data.likes || 0,
          emoji_tags: data.emoji_tags || [],
          topic_ids: data.topic_ids || [],
          supercuration_ids: data.supercuration_ids || [],
          user: data.user || {
            id: data.created_by,
            name: 'Unknown User',
            avatar_url: `https://api.dicebear.com/7.x/avatars/svg?seed=${data.created_by}`
          }
        } as Link);
      });

      set({ links, error: null });
    } catch (error: any) {
      console.error('Error fetching links:', error);
      set({ error: 'Failed to fetch links' });
    } finally {
      set({ loading: false });
    }
  },

  addLink: async (data: AddLinkData) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Must be logged in to share links');
      }

      if (!validateLinkData(data)) {
        throw new Error('Invalid link data');
      }

      const linkData = sanitizeForFirestore({
        ...data,
        created_by: currentUser.uid,
        user: {
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
          avatar_url: currentUser.photoURL || `https://api.dicebear.com/7.x/avatars/svg?seed=${currentUser.email}`
        }
      });

      const docRef = await addDoc(collection(db, 'links'), linkData);

      const newLink: Link = {
        id: docRef.id,
        ...data,
        created_by: currentUser.uid,
        created_at: new Date().toISOString(),
        liked: false,
        likes: 0,
        reposts_count: 0,
        user: linkData.user
      };

      set(state => ({
        links: [newLink, ...state.links],
        error: null
      }));

      if (data.supercuration_ids?.length) {
        const batch = writeBatch(db);
        for (const supercurationId of data.supercuration_ids) {
          const supercurationRef = doc(db, 'supercurations', supercurationId);
          batch.update(supercurationRef, {
            links_count: increment(1)
          });
        }
        await batch.commit();
      }
    } catch (error) {
      console.error('Error sharing link:', error);
      throw error;
    }
  },

  updateLink: async (id: string, data: Partial<Link>) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Must be logged in to update links');
      }

      const linkRef = doc(db, 'links', id);
      await updateDoc(linkRef, sanitizeForFirestore(data));

      set(state => ({
        links: state.links.map(link =>
          link.id === id ? { ...link, ...data } : link
        ),
        error: null
      }));
    } catch (error) {
      console.error('Error updating link:', error);
      throw error;
    }
  },

  removeLink: async (id: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Must be logged in to delete links');
      }

      const linkRef = doc(db, 'links', id);
      const linkDoc = await getDoc(linkRef);
      const linkData = linkDoc.data();

      await deleteDoc(linkRef);

      if (linkData?.supercuration_ids?.length) {
        const batch = writeBatch(db);
        for (const supercurationId of linkData.supercuration_ids) {
          const supercurationRef = doc(db, 'supercurations', supercurationId);
          batch.update(supercurationRef, {
            links_count: increment(-1)
          });
        }
        await batch.commit();
      }

      set(state => ({
        links: state.links.filter(link => link.id !== id),
        error: null
      }));
    } catch (error) {
      console.error('Error removing link:', error);
      throw error;
    }
  },

  toggleLike: async (id: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Must be logged in to like links');
      }

      const likeId = `${id}_${currentUser.uid}`;
      const likeRef = doc(db, 'likes', likeId);
      const linkRef = doc(db, 'links', id);
      const likeDoc = await getDoc(likeRef);

      if (likeDoc.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(linkRef, {
          likes: increment(-1)
        });

        set(state => ({
          links: state.links.map(l =>
            l.id === id
              ? { ...l, liked: false, likes: l.likes - 1 }
              : l
          ),
          error: null
        }));
      } else {
        await setDoc(likeRef, {
          userId: currentUser.uid,
          linkId: id,
          createdAt: serverTimestamp()
        });
        await updateDoc(linkRef, {
          likes: increment(1)
        });

        set(state => ({
          links: state.links.map(l =>
            l.id === id
              ? { ...l, liked: true, likes: l.likes + 1 }
              : l
          ),
          error: null
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  setOfflineStatus: async (status: boolean) => {
    try {
      if (status) {
        await disableNetwork(db);
      } else {
        await enableNetwork(db);
        await get().fetchLinks();
      }
      set({ isOffline: status });
    } catch (error) {
      console.error('Error updating network status:', error);
    }
  }
}));