import { create } from 'zustand';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    avatar_url?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Omit<User, 'id' | 'email' | 'created_at'>>) => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    try {
      // Add error handling for persistence
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (persistenceError) {
        console.warn('Failed to set persistence:', persistenceError);
        // Continue anyway as this isn't critical
      }
      
      return new Promise<void>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          try {
            if (firebaseUser) {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              
              if (userDoc.exists()) {
                set({ user: userDoc.data() as User, initialized: true });
              } else {
                // Create user document if it doesn't exist
                const userData: User = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email!,
                  name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
                  avatar_url: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${firebaseUser.email}`,
                  created_at: new Date().toISOString()
                };
                
                await setDoc(doc(db, 'users', firebaseUser.uid), userData);
                set({ user: userData, initialized: true });
              }
            } else {
              set({ user: null, initialized: true });
            }
          } catch (error) {
            console.error('Error during auth state change:', error);
            set({ user: null, initialized: true, error: 'Authentication failed' });
          } finally {
            unsubscribe();
            resolve();
          }
        });

        // Add timeout to prevent hanging
        setTimeout(() => {
          unsubscribe();
          set({ initialized: true, error: 'Authentication timed out' });
          resolve();
        }, 10000);
      });
    } catch (error) {
      console.error('Error during initialization:', error);
      set({ initialized: true, error: 'Failed to initialize auth' });
    }
  },

  setUser: (user) => set({ user }),
  
  clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        const userData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || email.split('@')[0],
          avatar_url: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
          created_at: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        set({ user: userData });
      } else {
        set({ user: userDoc.data() as User });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      set({ 
        error: error.code === 'auth/invalid-credential' 
          ? 'Invalid email or password'
          : 'Failed to sign in. Please try again.',
        user: null 
      });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  register: async (data) => {
    try {
      set({ loading: true, error: null });

      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Update Firebase auth profile
      await updateFirebaseProfile(firebaseUser, {
        displayName: data.name,
        photoURL: data.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.email}`
      });

      const userData: User = {
        id: firebaseUser.uid,
        email: data.email,
        name: data.name,
        avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.email}`,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      set({ user: userData });

    } catch (error: any) {
      console.error('Registration error:', error);
      set({ 
        error: error.code === 'auth/email-already-in-use'
          ? 'Email already in use'
          : 'Failed to create account. Please try again.',
        user: null 
      });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (data) => {
    try {
      set({ loading: true, error: null });

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // First update Firestore document
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, data, { merge: true });

      // Then update Firebase auth profile with only allowed fields
      if (data.name || data.avatar_url) {
        try {
          await updateFirebaseProfile(currentUser, {
            displayName: data.name || null,
            photoURL: data.avatar_url || null
          });
        } catch (error) {
          console.warn('Firebase auth profile update failed:', error);
          // Continue anyway as Firestore update succeeded
        }
      }

      // Fetch updated user data
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      set({ user: userDoc.data() as User });
    } catch (error: any) {
      console.error('Profile update error:', error);
      set({ error: 'Failed to update profile. Please try again.' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      set({ loading: true, error: null });
      await signOut(auth);
      set({ user: null });
    } catch (error: any) {
      console.error('Logout error:', error);
      set({ error: 'Failed to sign out. Please try again.' });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));