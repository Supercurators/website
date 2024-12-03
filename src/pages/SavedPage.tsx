import { useState, useEffect, useRef } from 'react';
import { ExternalLink, Heart, Star, Clock, Tag, Edit2, Trash2 } from 'lucide-react';
import { useLinkStore } from '../store/linkStore';
import { useCategoryStore } from '../store/categoryStore';
import { auth, db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, DocumentData } from 'firebase/firestore';
import { TopicManager } from '../components/TopicManager';
import { EditLinkModal } from '../components/EditLinkModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { TopicFilter } from '../components/TopicFilter';
import type { Link, Topic } from '../types';

export function SavedPage() {
  const { topics: rawTopics } = useCategoryStore();
  const topics = rawTopics.map(topic => ({
    id: topic.id,
    name: topic.name,
    color: topic.color,
    count: 0,
  })) as Topic[];
  const { toggleLike, removeLink } = useLinkStore();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [view, setView] = useState<'shared' | 'reposts'>('shared');
  const [showTopicManager, setShowTopicManager] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<string | null>(null);

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

  // Store the query in a ref to reuse it
  const linksQueryRef = useRef<ReturnType<typeof query> | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentUser = auth.currentUser;
        if (!currentUser) return;

        let linksQuery;
        if (view === 'shared') {
          linksQuery = query(
            collection(db, 'links'),
            where('created_by', '==', currentUser.uid),
            orderBy('created_at', 'desc')
          );
        } else {
          linksQuery = query(
            collection(db, 'links'),
            where('created_by', '==', currentUser.uid),
            where('original_post_id', '!=', null),
            orderBy('created_at', 'desc')
          );
        }

        // Store the query in ref
        linksQueryRef.current = linksQuery;

        const querySnapshot = await getDocs(linksQuery);
        const fetchedLinks: Link[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          liked: false,
          likes: doc.data().likes || 0
        })) as Link[];

        setLinks(fetchedLinks);
      } catch (err) {
        console.error('Error fetching links:', err);
        setError(err instanceof Error ? err.message : 'Failed to load links');
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, [view]);

  const handleDelete = async (id: string) => {
    try {
      await removeLink(id);
      setLinks(prev => prev.filter(link => link.id !== id));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  const getFilteredLinks = () => {
    let filtered = [...links];

    // Filter by topics
    if (selectedTopics.length > 0) {
      filtered = filtered.filter(link =>
        selectedTopics.some(topicId => link.topic_ids?.includes(topicId))
      );
    }

    // Filter by format
    if (formatFilter) {
      filtered = filtered.filter(link => 
        Array.isArray(link.emoji_tags) && link.emoji_tags.includes(formatFilter)
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

  const handleEditComplete = async (updatedLink: Link) => {
    try {
      // Immediately update the link in the current state
      setLinks(prevLinks => 
        prevLinks.map(link => 
          link.id === updatedLink.id ? updatedLink : link
        )
      );

      // Then refresh the data from server
      if (linksQueryRef.current) {
        const querySnapshot = await getDocs(linksQueryRef.current);
        const fetchedLinks: Link[] = querySnapshot.docs.map(doc => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            url: data.url,
            title: data.title,
            description: data.description,
            created_by: data.created_by,
            created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            updated_at: data.updated_at?.toDate?.()?.toISOString(),
            emoji_tags: data.emoji_tags || [],
            topic_ids: data.topic_ids || [],
            likes: data.likes || 0,
            liked: false,
            is_original_content: data.is_original_content || false,
            thumbnail_url: data.thumbnail_url,
            original_post_id: data.original_post_id,
            user: data.user,
            reposts_count: data.reposts_count || 0
          };
        });
        
        setLinks(fetchedLinks);
      }
      
      setEditingLink(null);
    } catch (error) {
      console.error('Error refreshing links after edit:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Feed</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setView('shared')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                view === 'shared'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Shared by me
            </button>
            <button
              onClick={() => setView('reposts')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                view === 'reposts'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Reposts
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
            <button
              onClick={() => setShowTopicManager(true)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <Tag className="w-4 h-4" />
              Manage Topics
            </button>
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

          {/* Replace the existing Topic Filters section with TopicFilter component */}
          <TopicFilter
            topics={topics}
            selectedTopics={selectedTopics}
            onTopicToggle={(topicId) => {
              setSelectedTopics(prev =>
                prev.includes(topicId)
                  ? prev.filter(id => id !== topicId)
                  : [...prev, topicId]
              );
            }}
          />
        </div>

        {/* Links Feed */}
        <div className="space-y-4">
          {error ? (
            <p className="text-center text-red-600 py-8">{error}</p>
          ) : getFilteredLinks().length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {view === 'shared' ? 'You haven\'t shared any links yet' : 'No reposts yet'}
            </p>
          ) : (
            getFilteredLinks().map((link) => (
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
                    <div className="flex items-start justify-between">
                      <div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:text-blue-600 block mb-1"
                        >
                          {link.title}
                          <ExternalLink className="inline-block w-3.5 h-3.5 ml-1 opacity-50" />
                        </a>
                        <p className="text-sm text-gray-500 mb-2">
                          {link.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="text-gray-400">
                            {new Date(link.created_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => toggleLike(link.id)}
                            className={`flex items-center gap-1 ${
                              link.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${link.liked ? 'fill-current' : ''}`} />
                            <span>{link.likes}</span>
                          </button>
                          {link.is_original_content && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              ORIGINAL
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingLink(link)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          title="Edit link"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(link.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {link.emoji_tags?.map((emoji) => (
                        <span key={emoji} className="text-lg">
                          {emoji}
                        </span>
                      ))}
                      {link.topic_ids?.map((topicId) => {
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
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modals */}
        {showTopicManager && (
          <TopicManager
            isOpen={true}
            onClose={() => setShowTopicManager(false)}
          />
        )}

        {editingLink && (
          <EditLinkModal
            isOpen={true}
            onClose={() => setEditingLink(null)}
            linkId={editingLink.id}
            onEditComplete={handleEditComplete}
          />
        )}

        {showDeleteConfirm && (
          <DeleteConfirmModal
            isOpen={true}
            onClose={() => setShowDeleteConfirm(null)}
            onConfirm={() => handleDelete(showDeleteConfirm)}
          />
        )}
      </div>
    </div>
  );
}