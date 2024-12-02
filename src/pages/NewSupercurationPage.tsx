import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon, Link as LinkIcon, Globe, Lock } from 'lucide-react';
import { useSupercurationStore } from '../store/supercurationStore';
import { useCategoryStore } from '../store/categoryStore';

export function NewSupercurationPage() {
  const navigate = useNavigate();
  const { addSupercuration } = useSupercurationStore();
  const { topics } = useCategoryStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageType, setImageType] = useState<'url' | 'upload'>('url');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    topics: [] as string[],
    is_public: false,
    slug: ''
  });

  // ... existing image upload and topic toggle functions ...

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      await addSupercuration({
        ...formData,
        title: formData.title,
        description: formData.description,
        thumbnail_url: formData.thumbnail_url,
        topics: formData.topics,
        is_public: formData.is_public
      });
      navigate('/supercurations');
    } catch (err) {
      console.error('Failed to create supercuration:', err);
      setError(err instanceof Error ? err.message : 'Failed to create supercuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* ... existing header ... */}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ... existing error display ... */}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Best Resources for Learning React"
            required
          />
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

        {/* ... rest of the existing form fields ... */}
      </form>
    </div>
  );
}