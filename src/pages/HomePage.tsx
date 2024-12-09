import { useState, useEffect, useCallback, useRef } from 'react';
import {Clock, ArrowUpDown } from 'lucide-react';
import { useLinkStore } from '../store/linkStore';
import { useAuthStore } from '../store/authStore';
import { useCategoryStore } from '../store/categoryStore';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { LinkContentEdit } from '../components/link/link-content-edit';
import type { Link } from '../types';
import { cleanupInvalidLinks } from '../lib/firestore';
import { ShareForm } from '../components/link/ShareForm';
import { LinkDisplay } from '../components/link/link-display';

export function HomePage() {
  const { topics } = useCategoryStore();
  const { 
    links, 
    toggleLike, 
    removeLink, 
    fetchLinks, 
    fetchMoreLinks,
    resetAndFetchLinks,
    isLoading,
    hasMore,
    updateLink
  } = useLinkStore();
  const [timeFilter, setTimeFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const { user } = useAuthStore();

  // Add intersection observer
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !isLoading) {
      fetchMoreLinks(sortBy as 'newest' | 'oldest' | 'most_liked');
    }
  }, [fetchMoreLinks, hasMore, isLoading, sortBy]);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.5,
    });

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  // Initial fetch with sort order
  useEffect(() => {
    fetchLinks(10, sortBy as 'newest' | 'oldest' | 'most_liked');
  }, [fetchLinks, sortBy]);

  useEffect(() => {
    if (links && !isCleaningUp) {
      const invalidLinks = links.filter(link => !link.id);
      if (invalidLinks.length > 0) {
        console.warn('Found links without IDs:', invalidLinks);
        setIsCleaningUp(true);
        
        cleanupInvalidLinks()
          .then(count => {
            if (count > 0) {
              console.log(`Cleaned up ${count} invalid links`);
              fetchLinks();
            }
          })
          .catch(error => {
            console.error('Failed to cleanup invalid links:', error);
          })
          .finally(() => {
            setIsCleaningUp(false);
          });
      }
    }
  }, [links]);

  const handleDelete = async (id: string) => {
    try {
      await removeLink(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  const FORMATS = [
    { emoji: '📝', label: 'Article' },
    { emoji: '📺', label: 'Video' },
    { emoji: '🎧', label: 'Podcast' },
    { emoji: '📰', label: 'Newsletter' },
    { emoji: '🛠️', label: 'Tool' },
    { emoji: '📚', label: 'Tutorial' },
    { emoji: '🎨', label: 'Design' },
    { emoji: '🤖', label: 'AI' },
    { emoji: '', label: 'Dev' },
    { emoji: '🔗', label: 'Other' }
  ];

  const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most_liked', label: 'Most Liked' },
  ];

  const getFilteredLinks = () => {
    if (!Array.isArray(links)) {
      console.error('Links is not an array:', links);
      return [];
    }

    let filtered = [...links];

    // Filter by format
    if (formatFilter) {
      filtered = filtered.filter(link => {
        if (!Array.isArray(link.emoji_tags)) return false;
        return link.emoji_tags.includes(formatFilter);
      });
    }

    // Filter by time
    if (timeFilter !== 'all') {
      const now = new Date();
      switch (timeFilter) {
        case 'today':
          filtered = filtered.filter(link => {
            const date = new Date(link.created_at);
            return date.toDateString() === now.toDateString();
          });
          break;
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          filtered = filtered.filter(link => 
            new Date(link.created_at) >= weekAgo
          );
          break;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          filtered = filtered.filter(link => 
            new Date(link.created_at) >= monthAgo
          );
          break;
      }
    }

    return filtered;
  };

  const filteredLinks = getFilteredLinks();
  const showLoadingIndicator = isLoading && (!filteredLinks || filteredLinks.length === 0);
  const showLoadMoreIndicator = isLoading && filteredLinks.length > 0;

  const handleEditComplete = async (
    selectedEmojis: string[],
    selectedTopics: string[],
    isOriginal: boolean,
    postData: {
      url?: string;
      title: string;
      description: string;
      thumbnail_url?: string;
    },
    supercurationTags?: string[],
    currentSupercurationId?: string,
    selectedSupercurations?: string[]
  ) => {
    try {
      // Determine which supercuration IDs to use
      const supercurationIds = currentSupercurationId 
        ? [currentSupercurationId]
        : selectedSupercurations || [];

      // Prepare the update data matching ShareForm structure
      const updateData = {
        ...postData,
        emoji_tags: selectedEmojis,
        topic_ids: selectedTopics,
        is_original_content: isOriginal,
        publish_to_feed: true,
        supercuration_ids: supercurationIds,
        ...(currentSupercurationId && supercurationTags ? {
          supercuration_tags: {
            [currentSupercurationId]: supercurationTags
          }
        } : {})
      };

      // Update in Firestore and refresh links
      if (editingLink?.id) {
        await updateLink(editingLink.id, updateData);
        await fetchLinks();
        setEditingLink(null);
      }
    } catch (error) {
      console.error('Error updating link:', error);
    }
  };

  // When sort order changes, refetch links
  useEffect(() => {
    resetAndFetchLinks(10, sortBy as 'newest' | 'oldest' | 'most_liked');
  }, [sortBy, resetAndFetchLinks]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Share Form */}
      <ShareForm supercurationId={undefined} />

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 space-y-4">
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

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-8 pr-4 py-1.5 bg-white border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
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
        {showLoadingIndicator && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        )}

        {filteredLinks.map((link) => (
          <LinkDisplay
            key={link.id}
            link={link}
            topics={topics}
            onToggleLike={toggleLike}
            onEdit={setEditingLink}
            onDelete={setShowDeleteConfirm}
            showUserInfo={true}
            editable={user?.id === link.created_by}
          />
        ))}
        
        {/* Infinite scroll observer and loading indicator */}
        <div ref={observerTarget} className="h-10 flex items-center justify-center">
          {showLoadMoreIndicator && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
          )}
        </div>
        
        {!hasMore && filteredLinks.length > 0 && (
          <div className="text-center text-gray-500 py-4">
            No more links to load
          </div>
        )}

        {!isLoading && filteredLinks.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No links found
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => handleDelete(showDeleteConfirm)}
        />
      )}

      {editingLink && (
        <LinkContentEdit
          onClose={() => setEditingLink(null)}
          onSave={(selectedEmojis, selectedTopics, isOriginal, postData, supercurationTags, currentSupercurationId, selectedSupercurations) => 
            handleEditComplete(selectedEmojis, selectedTopics, isOriginal, postData, supercurationTags, currentSupercurationId, selectedSupercurations)
          }
          preview={{
            url: editingLink.url,
            title: editingLink.title,
            description: editingLink.description,
            thumbnail_url: editingLink.thumbnail_url,
          }}
          suggestedTags={[]}
          isEditing={true}
          initialEmojis={editingLink.emoji_tags}
          initialTopics={editingLink.topic_ids}
          initialIsOriginal={editingLink.is_original_content}
        />
      )}
    </div>
  );
}