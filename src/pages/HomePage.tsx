import { useState, useEffect } from 'react';
import {Clock, ArrowUpDown } from 'lucide-react';
import { useLinkStore } from '../store/linkStore';
import { useAuthStore } from '../store/authStore';
import { useCategoryStore } from '../store/categoryStore';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { EditLinkModal } from '../components/EditLinkModal';
import type { Link } from '../types';
import { cleanupInvalidLinks } from '../lib/firestore';
import { ShareForm } from '../components/link/ShareForm';
import { LinkDisplay } from '../components/link/link-display';

export function HomePage() {
  const { topics } = useCategoryStore();
  const { links, toggleLike, removeLink, fetchLinks } = useLinkStore();
  const [timeFilter, setTimeFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching links...');
        await fetchLinks();
        console.log('Links after fetch:', links);
      } catch (error) {
        console.error('Error fetching links:', error);
        // Add appropriate error handling UI
      }
    };
    
    fetchData();
  }, [fetchLinks]);

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
    { emoji: '💻', label: 'Dev' },
    { emoji: '🔗', label: 'Other' }
  ];

  const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most_liked', label: 'Most Liked' },
  ];

  const getFilteredLinks = () => {
    console.log('Current filters:', { timeFilter, formatFilter });
    
    if (!Array.isArray(links)) {
      console.error('Links is not an array:', links);
      return [];
    }

    // Validate each link has required properties
    const validLinks = links.filter(link => {
      if (!link.id) {
        console.warn('Link missing ID:', link);
        return false;
      }
      if (!link.created_at) {
        console.warn('Link missing created_at:', link);
        return false;
      }
      return true;
    });

    let filtered = [...validLinks];

    // Filter by format with additional logging
    if (formatFilter) {
      filtered = filtered.filter(link => {
        if (!Array.isArray(link.emoji_tags)) {
          console.warn(`Link ${link.id} has invalid emoji_tags:`, link.emoji_tags);
          return false;
        }
        const hasTag = link.emoji_tags.includes(formatFilter);
        console.log(`Link ${link.id} has format ${formatFilter}:`, hasTag);
        return hasTag;
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

    // Sort by created_at in descending order (newest first)
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'most_liked':
          return (b.likes || 0) - (a.likes || 0);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    console.log('Filtered results:', filtered);
    return filtered;
  };

  const filteredLinks = getFilteredLinks();
  console.log('Filtered Links:', filteredLinks);

  const handleEditComplete = async () => {
    try {
      // Refresh the links after an edit
      await fetchLinks();
      setEditingLink(null);
    } catch (error) {
      console.error('Error refreshing links after edit:', error);
    }
  };

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
        {getFilteredLinks().map((link) => {
          if (!link.id) {
            console.error('Attempting to render link without ID:', link);
            return null;
          }
          
          const isEditable = user?.id === link.created_by;
          
          return (
            <LinkDisplay
              key={link.id}
              link={link as Link}
              topics={topics}
              onToggleLike={toggleLike}
              onEdit={setEditingLink}
              onDelete={setShowDeleteConfirm}
              showUserInfo={true}
              editable={isEditable}
            />
          );
        })}
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => handleDelete(showDeleteConfirm)}
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
    </div>
  );
}