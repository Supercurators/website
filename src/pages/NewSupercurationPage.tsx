import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Globe, Tag } from 'lucide-react';
import { useSupercurationStore } from '../store/supercurationStore';
import { useCategoryStore } from '../store/categoryStore';

export function NewSupercurationPage() {
  const navigate = useNavigate();
  const { addSupercuration } = useSupercurationStore();
  const { topics, addTopic } = useCategoryStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    topics: [] as string[],
    is_public: false,
    slug: ''
  });
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: '', color: '#2563eb' });

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
        slug: formData.is_public ? formData.slug : undefined
      });
      navigate('/supercurations');
    } catch (err) {
      console.error('Failed to create supercuration:', err);
      setError(err instanceof Error ? err.message : 'Failed to create supercuration');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewTopic = () => {
    if (newTopic.name.trim()) {
      const topic = addTopic(newTopic.name.trim(), newTopic.color);
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, topic.id]
      }));
      setNewTopic({ name: '', color: '#2563eb' });
      setShowNewTopicForm(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Supercuration</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg p-6 shadow-sm">
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">
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
            placeholder="e.g., Best Resources for Learning React"
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
            placeholder="Describe what this supercuration is about..."
          />
        </div>

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
                onClick={() => setFormData(prev => ({
                  ...prev,
                  topics: prev.topics.includes(topic.id)
                    ? prev.topics.filter(id => id !== topic.id)
                    : [...prev.topics, topic.id]
                }))}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm ${
                  formData.topics.includes(topic.id)
                    ? 'ring-1'
                    : 'hover:bg-opacity-20'
                }`}
                style={{
                  backgroundColor: `${topic.color}15`,
                  color: topic.color,
                  borderColor: formData.topics.includes(topic.id) ? topic.color : 'transparent'
                }}
              >
                {topic.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/supercurations')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Supercuration'}
          </button>
        </div>
      </form>
    </div>
  );
}