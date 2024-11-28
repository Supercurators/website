import { useState } from 'react';
import { X, Star, Upload, Link as LinkIcon, Tag } from 'lucide-react';
import { useLinkStore } from '../store/linkStore';
import { useCategoryStore } from '../store/categoryStore';

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkId: string;
}

export function EditLinkModal({ isOpen, onClose, linkId }: EditLinkModalProps) {
  const { links, updateLink, updateLinkTopics, updateLinkFormats } = useLinkStore();
  const { topics, addTopic } = useCategoryStore();
  const link = links.find(l => l.id === linkId);
  
  const [formData, setFormData] = useState({
    title: link?.title || '',
    description: link?.description || '',
    is_original_content: link?.is_original_content || false,
    thumbnail_url: link?.thumbnail_url || '',
    topic_ids: link?.topic_ids || [],
    emoji_tags: link?.emoji_tags || []
  });
  const [imageType, setImageType] = useState<'url' | 'upload'>('url');
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: '', color: '#2563eb' });
  const [loading, setLoading] = useState(false);

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

  if (!isOpen || !link) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          thumbnail_url: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTopic = (topicId: string) => {
    setFormData(prev => ({
      ...prev,
      topic_ids: prev.topic_ids.includes(topicId)
        ? prev.topic_ids.filter(id => id !== topicId)
        : [...prev.topic_ids, topicId]
    }));
  };

  const toggleFormat = (emoji: string) => {
    setFormData(prev => ({
      ...prev,
      emoji_tags: prev.emoji_tags.includes(emoji)
        ? prev.emoji_tags.filter(e => e !== emoji)
        : [emoji] // Only allow one format at a time
    }));
  };

  const handleAddNewTopic = () => {
    if (newTopic.name.trim()) {
      const topic = addTopic(newTopic.name.trim(), newTopic.color);
      setFormData(prev => ({
        ...prev,
        topic_ids: [...prev.topic_ids, topic.id]
      }));
      setNewTopic({ name: '', color: '#2563eb' });
      setShowNewTopicForm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Update basic link info
      await updateLink(linkId, {
        title: formData.title,
        description: formData.description,
        is_original_content: formData.is_original_content,
        thumbnail_url: formData.thumbnail_url
      });

      // Update topics and formats
      await Promise.all([
        updateLinkTopics(linkId, formData.topic_ids),
        updateLinkFormats(linkId, formData.emoji_tags)
      ]);

      onClose();
    } catch (error) {
      console.error('Failed to update link:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative w-full max-w-lg transform rounded-lg bg-white p-6 shadow-xl">
          <div className="absolute right-4 top-4">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-6">Edit Post</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail Image
              </label>
              
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setImageType('url')}
                  className={`flex-1 py-2 px-3 text-sm rounded-md flex items-center justify-center gap-2 ${
                    imageType === 'url'
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageType('upload')}
                  className={`flex-1 py-2 px-3 text-sm rounded-md flex items-center justify-center gap-2 ${
                    imageType === 'upload'
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </div>

              {imageType === 'url' ? (
                <input
                  type="url"
                  placeholder="Enter image URL"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              )}

              {formData.thumbnail_url && (
                <div className="mt-2">
                  <img
                    src={formData.thumbnail_url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-md"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => toggleFormat(emoji)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                      formData.emoji_tags.includes(emoji)
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

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Topics
                </label>
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
                    onClick={() => toggleTopic(topic.id)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm ${
                      formData.topic_ids.includes(topic.id)
                        ? 'ring-1'
                        : 'hover:bg-opacity-20'
                    }`}
                    style={{
                      backgroundColor: `${topic.color}15`,
                      color: topic.color,
                      borderColor: formData.topic_ids.includes(topic.id) ? topic.color : 'transparent'
                    }}
                  >
                    {topic.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_original_content}
                  onChange={(e) => setFormData({ ...formData, is_original_content: e.target.checked })}
                  className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                <Star className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  This is my original content
                </span>
              </label>
              <p className="mt-1 text-xs text-amber-600 ml-6">
                Check this if you created this content (e.g., your blog post, podcast, video)
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}