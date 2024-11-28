import { create } from 'zustand';
import { collection, addDoc, deleteDoc, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { Subscription } from '../types';

interface SubscriptionState {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  isSubscribed: (publisherId: string) => boolean;
  subscribe: (publisherId: string) => Promise<void>;
  unsubscribe: (publisherId: string) => Promise<void>;
  fetchSubscriptions: () => Promise<void>;
  fetchSubscribers: () => Promise<Subscription[]>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  loading: false,
  error: null,

  isSubscribed: (publisherId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    return get().subscriptions.some(
      sub => sub.publisher_id === publisherId && sub.subscriber_id === currentUser.uid
    );
  },

  subscribe: async (publisherId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        set({ error: 'You must be logged in to subscribe' });
        return;
      }

      // Check if already subscribed
      if (get().isSubscribed(publisherId)) {
        return;
      }

      const subscriptionData: Omit<Subscription, 'id'> = {
        subscriber_id: currentUser.uid,
        publisher_id: publisherId,
        subscriber_email: currentUser.email!,
        subscriber_name: currentUser.displayName || currentUser.email!.split('@')[0],
        created_at: new Date().toISOString()
      };

      // Add subscription document
      const docRef = await addDoc(collection(db, 'subscriptions'), subscriptionData);

      // Update subscriber counts
      await Promise.all([
        updateDoc(doc(db, 'users', currentUser.uid), {
          subscriptions_count: increment(1)
        }),
        updateDoc(doc(db, 'users', publisherId), {
          subscribers_count: increment(1)
        })
      ]);

      // Update local state
      set(state => ({
        subscriptions: [...state.subscriptions, { id: docRef.id, ...subscriptionData }],
        error: null
      }));
    } catch (error: any) {
      console.error('Error subscribing:', error);
      set({ error: 'Failed to subscribe' });
      throw error;
    }
  },

  unsubscribe: async (publisherId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        set({ error: 'You must be logged in to unsubscribe' });
        return;
      }

      const subscription = get().subscriptions.find(
        sub => sub.publisher_id === publisherId && sub.subscriber_id === currentUser.uid
      );

      if (!subscription) return;

      // Delete subscription document
      await deleteDoc(doc(db, 'subscriptions', subscription.id));

      // Update subscriber counts
      await Promise.all([
        updateDoc(doc(db, 'users', currentUser.uid), {
          subscriptions_count: increment(-1)
        }),
        updateDoc(doc(db, 'users', publisherId), {
          subscribers_count: increment(-1)
        })
      ]);

      // Update local state
      set(state => ({
        subscriptions: state.subscriptions.filter(sub => sub.id !== subscription.id),
        error: null
      }));
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      set({ error: 'Failed to unsubscribe' });
      throw error;
    }
  },

  fetchSubscriptions: async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      set({ loading: true });

      const subscriptionsQuery = query(
        collection(db, 'subscriptions'),
        where('subscriber_id', '==', currentUser.uid)
      );

      const snapshot = await getDocs(subscriptionsQuery);
      const subscriptions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subscription[];

      set({ subscriptions, error: null });
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      set({ error: 'Failed to fetch subscriptions' });
    } finally {
      set({ loading: false });
    }
  },

  fetchSubscribers: async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const subscribersQuery = query(
        collection(db, 'subscriptions'),
        where('publisher_id', '==', currentUser.uid)
      );

      const snapshot = await getDocs(subscribersQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subscription[];
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return [];
    }
  }
}));