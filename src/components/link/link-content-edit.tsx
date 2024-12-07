import React, { useState, useEffect } from 'react';
import { X, Tag, Star, Upload, Link as LinkIcon } from 'lucide-react';
import { useCategoryStore } from '../../store/categoryStore';
import { useSupercurationStore } from '../../store/supercurationStore';
import { auth } from '../../lib/firebase';

// Update onSave prop type to make url optional
interface LinkContentEditProps {
  suggestedTags: string[];
  onClose: () => void;
  onSave: (selectedEmojis: string[], selectedTopics: string[], isOriginal: boolean, postData: {
    url?: string;
    title: string;
    description: string;
    thumbnail_url?: string;
    linkText?: string;
  }, supercurationTags?: string[], supercurationId?: string, selectedSupercurations?: string[]) => void;
  preview: {
    title: string;
    description: string;
    thumbnail_url?: string;
    url?: string;
    linkText?: string;
  };
  isEditing?: boolean;
  initialEmojis?: string[];
  initialTopics?: string[];
  initialIsOriginal?: boolean;
  supercurationId?: string;
  supercurationTags?: string[][];  // Array of tag categories
  initialSupercurationTags?: string[];
  selectedSupercurations?: string[];
  initialSelectedSupercurations?: string[];
}

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

export function LinkContentEdit({ 
  onClose, 
  onSave, 
  preview, 
  isEditing = false,
  initialEmojis = [],
  initialTopics = [],
  initialIsOriginal = false,
  supercurationId,
  supercurationTags = [],
  initialSupercurationTags = [],
  initialSelectedSupercurations = [],
}: LinkContentEditProps) {
  const { topics, addTopic } = useCategoryStore();
  const { supercurations, fetchSupercurations } = useSupercurationStore();
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(initialEmojis);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(initialTopics);
  const [isOriginalContent, setIsOriginalContent] = useState(initialIsOriginal);
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: '', color: '#2563eb' });
  const [postData, setPostData] = useState({
    url: preview.url || '',
    title: preview.title || '',
    description: preview.description || '',
    thumbnail_url: preview.thumbnail_url || '',
    imageType: 'url' as 'url' | 'upload',
    linkText: preview.linkText || 'Visit Link'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSupercurationTags, setSelectedSupercurationTags] = useState<string[]>(
    initialSupercurationTags
  );
  const [selectedSupercurationIds, setSelectedSupercurationIds] = useState<string[]>(
    initialSelectedSupercurations
  );

  console.error('supercurationId in EmojiTagSelector', supercurationId);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostData(prev => ({
          ...prev,
          thumbnail_url: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNewTopic = () => {
    if (newTopic.name.trim()) {
      const topic = addTopic(newTopic.name.trim(), newTopic.color);
      setSelectedTopics(prev => [...prev, topic.id]);
      setNewTopic({ name: '', color: '#2563eb' });
      setShowNewTopicForm(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSave(
        selectedEmojis, 
        selectedTopics, 
        isOriginalContent, 
        {
          ...(postData.url ? { url: postData.url } : {}),
          title: postData.title,
          description: postData.description,
          thumbnail_url: postData.thumbnail_url,
          linkText: postData.linkText
        },
        supercurationId ? selectedSupercurationTags : undefined,
        supercurationId,
        !supercurationId ? selectedSupercurationIds : undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSupercurationTags = () => {
    if (!supercurationId || !supercurationTags.length) return null;

    return (
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Supercuration Tags
        </h4>
        {supercurationTags.map((category, index) => (
          <div key={index} className="mb-4">
            <div className="flex flex-wrap gap-2">
              {category.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedSupercurationTags(prev =>
                    prev.includes(tag)
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  )}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm ${
                    selectedSupercurationTags.includes(tag)
                      ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    fetchSupercurations();
  }, [fetchSupercurations]);

  const renderSupercurationSelector = () => {
    if (supercurationId) return null;

    const currentUser = auth.currentUser;
    const userSupercurations = supercurations.filter(
      (supercuration) => supercuration.user?.id === currentUser?.uid
    );

    if (userSupercurations.length === 0) {
      return (
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            You haven't created any supercurations yet.
          </p>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Add to Supercurations
        </h4>
        <div className="flex flex-wrap gap-2">
          {userSupercurations.map((supercuration) => (
            <button
              key={supercuration.id}
              type="button"
              onClick={() => setSelectedSupercurationIds(prev =>
                prev.includes(supercuration.id)
                  ? prev.filter(id => id !== supercuration.id)
                  : [...prev, supercuration.id]
              )}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm ${
                selectedSupercurationIds.includes(supercuration.id)
                  ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {supercuration.title}
            </button>
          ))}
        </div>
      </div>
    );
  };

  useEffect(() => {
    // Disable scroll on body when modal opens
    document.body.style.overflow = 'hidden';
    
    // Re-enable scroll when modal closes
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div 
          className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white rounded-t-xl">
            <h3 className="text-lg font-semibold text-gray-900">Preview & Share</h3>
            <button 
              onClick={onClose} 
              className="p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="px-6 py-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
            {/* Post Editor */}
            <div className="space-y-5">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={postData.title}
                  onChange={(e) => setPostData({ ...postData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={postData.description}
                  onChange={(e) => setPostData({ ...postData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL (optional)
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={postData.url}
                    onChange={(e) => setPostData({ ...postData, url: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter URL (optional)"
                  />
                </div>
              </div>

              {/* Link Text Input - Now always visible */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Button Text
                </label>
                <input
                  type="text"
                  value={postData.linkText}
                  onChange={(e) => setPostData({ ...postData, linkText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Visit Link"
                />
              </div>

              {/* Thumbnail Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail Image
                </label>
                
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPostData(prev => ({ ...prev, imageType: 'url' }))}
                    className={`flex-1 py-2 px-3 text-sm rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      postData.imageType === 'url'
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostData(prev => ({ ...prev, imageType: 'upload' }))}
                    className={`flex-1 py-2 px-3 text-sm rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      postData.imageType === 'upload'
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                </div>

                {postData.imageType === 'url' ? (
                  <input
                    type="url"
                    placeholder="Enter image URL"
                    value={postData.thumbnail_url}
                    onChange={(e) => setPostData({ ...postData, thumbnail_url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                )}

                {postData.thumbnail_url && (
                  <div className="mt-2">
                    <img
                      src={postData.thumbnail_url}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>

              {/* Original Content Section */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOriginalContent}
                    onChange={(e) => setIsOriginalContent(e.target.checked)}
                    className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                  />
                  <Star className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    This is my original content
                  </span>
                </label>
                <p className="mt-1 text-xs text-amber-600 ml-6">
                  Check this if you created this content
                </p>
              </div>

              {/* Format Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Format</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FORMATS.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmojis(prev =>
                        prev.includes(emoji)
                          ? prev.filter(e => e !== emoji)
                          : [emoji]
                      )}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedEmojis.includes(emoji)
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Topics</h4>
                  <button
                    type="button"
                    onClick={() => setShowNewTopicForm(!showNewTopicForm)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Tag className="w-4 h-4" />
                    Add Topic
                  </button>
                </div>

                {showNewTopicForm && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Topic name"
                        value={newTopic.name}
                        onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                        className="flex-1 px-3 py-1 text-sm border rounded"
                      />
                      <input
                        type="color"
                        value={newTopic.color}
                        onChange={(e) => setNewTopic({ ...newTopic, color: e.target.value })}
                        className="w-8 h-8 p-1 border rounded cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewTopic}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setSelectedTopics(prev =>
                        prev.includes(topic.id)
                          ? prev.filter(id => id !== topic.id)
                          : [...prev, topic.id]
                      )}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm ${
                        selectedTopics.includes(topic.id)
                          ? 'ring-1'
                          : 'hover:bg-opacity-20'
                      }`}
                      style={{
                        backgroundColor: `${topic.color}15`,
                        color: topic.color,
                        borderColor: selectedTopics.includes(topic.id) ? topic.color : 'transparent'
                      }}
                    >
                      {topic.name}
                    </button>
                  ))}
                </div>
              </div>

              {renderSupercurationSelector()}

              {renderSupercurationTags()}
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="sticky bottom-0 px-6 py-4 border-t border-gray-100 bg-white rounded-b-xl">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Updating...
                  </>
                ) : (
                  isEditing ? 'Update' : 'Share'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}