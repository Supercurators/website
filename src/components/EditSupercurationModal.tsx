import { useState } from 'react';
import { X, Globe, Lock, Wand2 } from 'lucide-react';
import { useSupercurationStore } from '../store/supercurationStore';
import { TagCategoryManager } from './TagCategoryManager';
import { suggestTagCategories } from '../lib/tagSuggestions';
import type { Supercuration } from '../types';

interface EditSupercurationModalProps {
  supercuration: Supercuration;
  onClose: () => void;
}

export function EditSupercurationModal({ supercuration, onClose }: EditSupercurationModalProps) {
  const { updateSupercuration } = useSupercurationStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [formData, setFormData] = useState({
    title: supercuration.title,
    description: supercuration.description,
    thumbnail_url: supercuration.thumbnail_url || '',
    topics: supercuration.topics,
    is_public: supercuration.is_public,
    slug: supercuration.slug || '',
    tagCategories: supercuration.tagCategories || []
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const handleSuggestTags = async () => {
    try {
      setLoading(true);
      const suggestions = await suggestTagCategories(supercuration);
      setFormData(prev => ({
        ...prev,
        tagCategories: suggestions
      }));
    } catch (error) {
      console.error('Failed to generate tag suggestions:', error);
      setError('Failed to generate tag suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      await updateSupercuration(supercuration.id, {
        ...formData,
        slug: formData.is_public ? formData.slug : undefined
      });
      onClose();
    } catch (err) {
      console.error('Failed to update supercuration:', err);
      setError(err instanceof Error ? err.message : 'Failed to update supercuration');
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

          <h3 className="text-lg font-medium text-gray-900 mb-6">Edit Supercuration</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Tag Categories */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Custom Tag Categories
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSuggestTags}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100"
                  >
                    <Wand2 className="w-4 h-4" />
                    Magic Suggest
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTagManager(true)}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                  >
                    Manage Tags
                  </button>
                </div>
              </div>

              {formData.tagCategories.length > 0 ? (
                <div className="space-y-2">
                  {formData.tagCategories.map((category) => (
                    <div key={category.id} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm">{category.name}</span>
                      <span className="text-xs text-gray-500">
                        ({category.tags.length} tags)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No tag categories defined. Click "Manage Tags" to add some.
                </p>
              )}
            </div>

            {/* Visibility Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_public: true }))}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md ${
                    formData.is_public
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_public: false }))}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md ${
                    !formData.is_public
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Private
                </button>
              </div>
            </div>

            {formData.is_public && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">supercurators.com/s/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    pattern="[a-z0-9-]+"
                    title="Only lowercase letters, numbers, and hyphens are allowed"
                    required={formData.is_public}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tag Category Manager Modal */}
      {showTagManager && (
        <TagCategoryManager
          isOpen={true}
          onClose={() => setShowTagManager(false)}
          categories={formData.tagCategories}
          onSave={(categories) => {
            setFormData(prev => ({ ...prev, tagCategories: categories }));
            setShowTagManager(false);
          }}
        />
      )}
    </div>
  );
}