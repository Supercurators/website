import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Globe, MapPin, Clock, Mail, Lock } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '../types';
import { useCategoryStore } from '../store/categoryStore';
import { useLinkStore } from '../store/linkStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useAuthStore } from '../store/authStore';

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();
  const { topics } = useCategoryStore();
  const { links } = useLinkStore();
  const { isSubscribed, subscribe, unsubscribe } = useSubscriptionStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const userDoc = await getDoc(doc(db, 'users', id));
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const userProfile: User = {
          id: userDoc.id,
          email: userData.email || '',
          name: userData.name || 'Anonymous User',
          avatar_url: userData.avatar_url || `https://api.dicebear.com/7.x/avatars/svg?seed=${userData.email}`,
          bio: userData.bio || undefined,
          location: userData.location || undefined,
          website: userData.website || undefined,
          created_at: userData.created_at || new Date().toISOString(),
          subscribers_count: userData.subscribers_count || 0,
          subscriptions_count: userData.subscriptions_count || 0
        };

        setUser(userProfile);
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

  const getUserLinks = () => {
    if (!id || !isSubscribed(id)) return [];
    return links.filter(link => link.created_by === id);
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

  const userLinks = getUserLinks();
  const subscribed = isSubscribed(user.id);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        <div className="px-6 pb-6">
          <div className="relative -mt-16 mb-4">
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-32 h-32 rounded-full border-4 border-white object-cover bg-gray-100"
            />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{user.subscribers_count} subscribers</span>
                <span>•</span>
                <span>{user.subscriptions_count} subscriptions</span>
              </div>
            </div>
            {currentUser && currentUser.id !== user.id && (
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className={`px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 ${
                  subscribed
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Mail className="w-4 h-4" />
                {subscribing ? 'Processing...' : subscribed ? 'Unsubscribe' : 'Subscribe'}
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="space-y-4">
            {user.bio && (
              <div>
                <h2 className="font-medium text-gray-900 mb-2">About my curation topics</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{user.bio}</p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
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
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                  <Globe className="w-4 h-4" />
                  {new URL(user.website).hostname}
                </a>
              )}
              <div className="text-gray-400">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-4">
        {!subscribed ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center space-y-4">
            <div className="flex justify-center">
              <Lock className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold">Subscribe to See Shared Links</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Subscribe to {user.name}'s profile to access their curated collection of links and receive updates via email.
            </p>
            {currentUser ? (
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Mail className="w-4 h-4" />
                Subscribe with {currentUser.email}
              </button>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 inline-flex items-center gap-2"
              >
                Sign in to Subscribe
              </Link>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold">Shared Links ({userLinks.length})</h2>
            {userLinks.map((link) => (
              <div
                key={link.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden p-4"
              >
                <div className="flex gap-4">
                  {link.thumbnail_url && (
                    <img
                      src={link.thumbnail_url}
                      alt=""
                      className="w-24 h-24 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-blue-600 block mb-1"
                    >
                      {link.title}
                    </a>
                    <p className="text-sm text-gray-500 mb-2">
                      {link.description}
                    </p>
                    <div className="text-sm text-gray-400">
                      {new Date(link.created_at).toLocaleDateString()}
                    </div>

                    {link.topic_ids?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {link.topic_ids.map((topicId) => {
                          const topic = topics.find((t) => t.id === topicId);
                          if (!topic) return null;
                          return (
                            <span
                              key={topic.id}
                              className="px-2 py-0.5 text-xs rounded-full"
                              style={{
                                backgroundColor: `${topic.color}15`,
                                color: topic.color
                              }}
                            >
                              {topic.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}