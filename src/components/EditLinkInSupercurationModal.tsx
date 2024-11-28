import { useState } from 'react';
import { X, Tag } from 'lucide-react';
import { useLinkStore } from '../store/linkStore';
import { useSupercurationStore } from '../store/supercurationStore';
import type { Link, TagCategory } from '../types';

interface EditLinkInSupercurationModalProps {
  link: Link;
  supercurationId: string;
  onClose: () => void;
}

export function EditLinkInSupercurationModal({ link, supercurationId, onClose }: EditLinkInSupercurationModalProps) {
  const { updateLink } = useLinkStore();
  const { supercurations } = useSupercurationStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    link.supercuration_tags?.[supercurationId] || []
  );

  const supercuration = supercurations.find(s => s.id === supercurationId);
  const tagCategories = supercuration?.tagCategories || [];

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      await updateLink(link.id, {
        supercuration_tags: {
          ...link.supercuration_tags,
          [supercurationId]: selectedTags
        }
      });

      onClose();
    } catch (err) {
      console.error('Failed to update tags:', err);
      setError(err instanceof Error ? err.message : 'Failed to update tags');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
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

          <h3 className="text-lg font-medium text-gray-900 mb-6">Edit Item</h3>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* Link Preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-4">
              {link.thumbnail_url && (
                <img
                  src={link.thumbnail_url}
                  alt=""
                  className="w-24 h-24 rounded object-cover"
                />
              )}
              <div>
                <h4 className="font-medium text-gray-900">{link.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-2">{link.description}</p>
              </div>
            </div>
          </div>

          {/* Tag Categories */}
          {tagCategories.length > 0 && (
            <div className="mb-6 space-y-4">
              {tagCategories.map((category) => (
                <div key={category.id}>
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {category.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                          selectedTags.includes(tag)
                            ? 'ring-1'
                            : 'hover:bg-opacity-20'
                        }`}
                        style={{
                          backgroundColor: `${category.color}15`,
                          color: category.color,
                          borderColor: selectedTags.includes(tag) ? category.color : 'transparent'
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}