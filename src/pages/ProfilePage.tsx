import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Globe, MapPin, Clock, Mail, Grid, List } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { User, Supercuration } from '../types';
import { useAuthStore } from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';

function formatDate(date: Timestamp | string) {
  const dateObj = date instanceof Timestamp ? date.toDate() : new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();
  const { isSubscribed, subscribe, unsubscribe } = useSubscriptionStore();
  const [user, setUser] = useState<User | null>(null);
  const [supercurations, setSupercurations] = useState<Supercuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'users', id));
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const userData = userDoc.data() as User;
        setUser(userData);

        // Fetch public supercurations
        const supercurationsQuery = query(
          collection(db, 'supercurations'),
          where('created_by', '==', id),
          where('is_public', '==', true)
        );
        const supercurationsSnapshot = await getDocs(supercurationsQuery);
        const supercurationsData = supercurationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Supercuration[];
        setSupercurations(supercurationsData);

      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleSubscribe = async () => {
    if (!user || !currentUser) return;
    
    try {
      setSubscribing(true);
      if (isSubscribed(user.id)) {
        await unsubscribe(user.id);
      } else {
        await subscribe(user.id);
      }
    } catch (err) {
      console.error('Subscription error:', err);
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || 'User not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-32 h-32 rounded-full border-4 border-white/10"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <p className="text-gray-400">{user.email}</p>
                </div>
                {currentUser && currentUser.id !== user.id && (
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className={`px-6 py-2 rounded-full font-medium text-sm flex items-center gap-2 transition-colors ${
                      isSubscribed(user.id)
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    {subscribing ? 'Processing...' : isSubscribed(user.id) ? 'Unsubscribe' : 'Subscribe'}
                  </button>
                )}
              </div>

              {user.bio && (
                <p className="text-lg text-gray-300 mb-6">{user.bio}</p>
              )}

              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {user.location}
                  </div>
                )}
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                  >
                    <Globe className="w-4 h-4" />
                    {new URL(user.website).hostname}
                  </a>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Joined {formatDate(user.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public Supercurations */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Public Supercurations
          </h2>
          <div className="flex items-center gap-2 border rounded-full p-1 bg-white">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full ${
                viewMode === 'grid'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full ${
                viewMode === 'list'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {supercurations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No public supercurations yet</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supercurations.map((supercuration) => (
              <Link
                key={supercuration.id}
                to={`/public/${supercuration.slug}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {supercuration.thumbnail_url && (
                  <img
                    src={supercuration.thumbnail_url}
                    alt=""
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-medium text-lg mb-2">{supercuration.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {supercuration.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{supercuration.links_count || 0} links</span>
                    <span>{formatDate(supercuration.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {supercurations.map((supercuration) => (
              <Link
                key={supercuration.id}
                to={`/public/${supercuration.slug}`}
                className="block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <h3 className="font-medium text-lg mb-2">{supercuration.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {supercuration.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{supercuration.links_count || 0} links</span>
                    <span>{formatDate(supercuration.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}