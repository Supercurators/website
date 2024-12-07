import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLinkStore } from '../store/linkStore';
import { useAuthStore } from '../store/authStore';
import { Link as LinkType } from '../types';
import { ArrowLeft, Calendar, Share2, Pencil } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LinkContentEdit } from '../components/link/link-content-edit';
import { ShareModal } from '../components/link/ShareModal';

export function LinkDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [link, setLink] = useState<LinkType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateLink } = useLinkStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [userData, setUserData] = useState<{ name: string; avatar_url: string; bio?: string } | null>(null);
  
  // Check if the current user is the author of the link
  const isAuthor = user?.id === link?.user?.id;

  const fetchLinkDetail = async () => {
    if (!slug) return;

    try {
      setIsLoading(true);
      const linkRef = doc(db, 'links', slug);
      const linkDoc = await getDoc(linkRef);

      if (!linkDoc.exists()) {
        setError('Link not found');
        return;
      }

      const data = linkDoc.data();
      
      // Get like status if user is logged in
      let isLiked = false;
      if (user) {
        const likeRef = doc(db, 'likes', `${linkDoc.id}_${user.id}`);
        const likeDoc = await getDoc(likeRef);
        isLiked = likeDoc.exists();
      }

      setLink({
        id: linkDoc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        liked: isLiked,
        likes: data.likes || 0,
        emoji_tags: data.emoji_tags || [],
        topic_ids: data.topic_ids || [],
        supercuration_ids: data.supercuration_ids || [],
        user: data.user || {
          id: data.created_by,
          name: 'Unknown User',
          avatar_url: `https://api.dicebear.com/7.x/avatars/svg?seed=${data.created_by}`
        }
      } as LinkType);
    } catch (err) {
      console.error('Error fetching link:', err);
      setError('Failed to load link details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkDetail();
  }, [slug]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!link?.user?.id) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', link.user.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserData({
            name: userData.name,
            avatar_url: userData.avatar_url,
            bio: userData.bio
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, [link?.user?.id]);

  const handleBack = () => {
    navigate(-1); // This will go back to the previous page in history
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{error || 'Link not found'}</h1>
        <RouterLink to="/home" className="text-blue-600 hover:underline">
          Return to Home
        </RouterLink>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      {/* Main content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <img
              src={userData?.avatar_url || `https://api.dicebear.com/7.x/avatars/svg?seed=${link.user?.id}`}
              alt={userData?.name || 'User'}
              className="w-10 h-10 rounded-full object-cover bg-gray-100"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://api.dicebear.com/7.x/avatars/svg?seed=${link.user?.id}`;
              }}
            />
            <div className="ml-3">
              <h2 className="font-medium">
                <RouterLink 
                  to={`/profile/${link.user?.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {userData?.name || link.user?.name || 'Anonymous User'}
                </RouterLink>
                {isAuthor && <span className="ml-2 text-sm text-gray-500">(You)</span>}
              </h2>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>

        {/* Link content */}
        <h1 className="text-2xl font-bold mb-4">{link.title}</h1>
        
        {link.description && (
          <p className="text-gray-700 mb-6">{link.description}</p>
        )}

        {link.thumbnail_url && (
          <img
            src={link.thumbnail_url}
            alt={link.title}
            className="w-full rounded-lg mb-6"
          />
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {link.emoji_tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-600 hover:bg-gray-100"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>

          {isAuthor && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-600 hover:bg-gray-100"
            >
              <Pencil className="w-5 h-5" />
              Edit
            </button>
          )}

          {link.url && (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            >
              {link.linkText || 'Visit Link'}
            </a>
          )}
        </div>
      </div>

      {isEditing && link && (
        <LinkContentEdit
          suggestedTags={[]}
          preview={{
            title: link.title,
            description: link.description,
            thumbnail_url: link.thumbnail_url,
            url: link.url
          }}
          initialEmojis={link.emoji_tags}
          initialTopics={link.topic_ids}
          initialIsOriginal={false}
          initialSelectedSupercurations={link.supercuration_ids}
          isEditing={true}
          onClose={() => setIsEditing(false)}
          onSave={async (selectedEmojis, selectedTopics, isOriginal, postData, _, __, selectedSupercurations) => {
            try {
              await updateLink(link.id, {
                ...postData,
                emoji_tags: selectedEmojis,
                topic_ids: selectedTopics,
                is_original_content: isOriginal,
                supercuration_ids: selectedSupercurations
              });
              
              setIsEditing(false);
              await fetchLinkDetail();
            } catch (error) {
              console.error('Error updating link:', error);
            }
          }}
        />
      )}

      {isShareModalOpen && (
        <ShareModal
          url={window.location.href}
          title={link.title}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
} 