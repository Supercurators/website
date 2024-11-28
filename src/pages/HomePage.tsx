import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ExternalLink, Heart, Star, Clock } from 'lucide-react';
import { useLinkStore } from '../store/linkStore';
import { useAuthStore } from '../store/authStore';
import { useCategoryStore } from '../store/categoryStore';
import { AIUrlExtractor } from '../components/AIUrlExtractor';
import { AddToSupercurationButton } from '../components/AddToSupercurationButton';
import { EditLinkModal } from '../components/EditLinkModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { RepostModal } from '../components/RepostModal';
import { EmojiTagSelector } from '../components/EmojiTagSelector';
import { LinkPreviewInput } from '../components/LinkPreviewInput';
import type { Link } from '../types';

const FORMATS = [
  { emoji: '📝', label: 'Article' },
  { emoji: '📺', label: 'Video' },
  { emoji: '🎧', label: 'Podcast' },
  { emoji: '📰', label: 'Newsletter' },
  { emoji: '🛠️', label: 'Tool' },
  { emoji: '📚', label: 'Tutorial' },
  { emoji: '🎨', label: 'Design' },
  { emoji: '🤖', label: 'AI' },
  { emoji: '💻', label: 'Dev' },
  { emoji: '🔗', label: 'Other' }
];

export function HomePage() {
  const { user } = useAuthStore();
  const { topics } = useCategoryStore();
  const { links, toggleLike, removeLink, fetchLinks, addLink } = useLinkStore();
  const [timeFilter, setTimeFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showEditLink, setShowEditLink] = useState<string | null>(null);
  const [showRepost, setShowRepost] = useState<Link | null>(null);
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [showAIExtractor, setShowAIExtractor] = useState(false);
  const [linkPreview, setLinkPreview] = useState<{
    url: string;
    title: string;
    description: string;
    thumbnail_url?: string;
  } | null>(null);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const getFilteredLinks = () => {
    if (!Array.isArray(links)) return [];
    
    let filtered = [...links];

    // Filter by format
    if (formatFilter) {
      filtered = filtered.filter(link => 
        link.emoji_tags?.includes(formatFilter)
      );
    }

    // Filter by time
    const now = new Date();
    switch (timeFilter) {
      case 'today':
        filtered = filtered.filter(link => {
          const date = new Date(link.created_at);
          return date.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        filtered = filtered.filter(link => new Date(link.created_at) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        filtered = filtered.filter(link => new Date(link.created_at) >= monthAgo);
        break;
    }

    return filtered;
  };

  const handleDelete = async (id: string) => {
    try {
      await removeLink(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  const handleShare = async (preview: {
    url: string;
    title: string;
    description: string;
    thumbnail_url?: string;
  }) => {
    setLinkPreview(preview);
    setShowEmojiSelector(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Share Form */}
      <div className="mb-8">
        <LinkPreviewInput onShare={handleShare} />
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <button
            onClick={() => setShowAIExtractor(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            Import multiple URLs from text or image
          </button>
        </div>

        {showAIExtractor && (
          <div className="mt-4">
            <AIUrlExtractor />
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative">
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="appearance-none pl-8 pr-4 py-1.5 bg-white border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
            <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Format Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFormatFilter(null)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              !formatFilter
                ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Formats
          </button>
          {FORMATS.map(({ emoji, label }) => (
            <button
              key={emoji}
              onClick={() => setFormatFilter(formatFilter === emoji ? null : emoji)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                formatFilter === emoji
                  ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Links Feed */}
      <div className="space-y-4">
        {getFilteredLinks().map((link) => (
          <div
            key={link.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                {link.thumbnail_url && (
                  <img
                    src={link.thumbnail_url}
                    alt=""
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {link.url ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:text-blue-600 flex items-center gap-1 group"
                        >
                          {link.title}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <h3 className="font-medium text-gray-900">{link.title}</h3>
                      )}
                      {link.is_original_content && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-medium ml-2">
                          <Star className="w-3 h-3 mr-1" />
                          ORIGINAL
                        </span>
                      )}
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {link.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        <RouterLink
                          to={`/profile/${link.created_by}`}
                          className="hover:text-blue-600"
                        >
                          Shared by {link.created_by === user?.id ? 'you' : link.user?.name}
                        </RouterLink>
                        <span>{new Date(link.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <AddToSupercurationButton link={link} />
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={() => toggleLike(link.id)}
                      className={`flex items-center gap-1 text-sm ${
                        link.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${link.liked ? 'fill-current' : ''}`} />
                      <span>{link.likes}</span>
                    </button>

                    {link.emoji_tags?.map((emoji) => (
                      <span key={emoji} className="text-base">
                        {emoji}
                      </span>
                    ))}

                    {link.topic_ids?.map((topicId) => {
                      const topic = topics.find(t => t.id === topicId);
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
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showEmojiSelector && linkPreview && (
        <EmojiTagSelector
          suggestedTags={[]}
          onClose={() => {
            setShowEmojiSelector(false);
            setLinkPreview(null);
          }}
          onSave={async (selectedEmojis, selectedTopics, isOriginal) => {
            try {
              await addLink({
                ...linkPreview,
                emoji_tags: selectedEmojis,
                topic_ids: selectedTopics,
                is_original_content: isOriginal,
                publish_to_feed: true
              });
              setShowEmojiSelector(false);
              setLinkPreview(null);
            } catch (err) {
              console.error('Error sharing link:', err);
            }
          }}
          preview={linkPreview}
        />
      )}

      {showEditLink && (
        <EditLinkModal
          isOpen={true}
          onClose={() => setShowEditLink(null)}
          linkId={showEditLink}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => handleDelete(showDeleteConfirm)}
        />
      )}

      {showRepost && (
        <RepostModal
          link={showRepost}
          onClose={() => setShowRepost(null)}
          onRepost={async () => {
            setShowRepost(null);
          }}
        />
      )}
    </div>
  );
}