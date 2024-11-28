import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useCategoryStore } from '../store/categoryStore';
import type { Link } from '../types';

interface EditTopicsModalProps {
  link: Link;
  onClose: () => void;
  onSave: (topicIds: string[]) => Promise<void>;
}

const DEFAULT_COLORS = [
  '#2563eb', '#dc2626', '#059669', '#7c3aed', '#db2777',
  '#ea580c', '#ca8a04', '#4f46e5', '#0891b2', '#be123c'
];

export function EditTopicsModal({ link, onClose, onSave }: EditTopicsModalProps) {
  const { topics, addTopic } = useCategoryStore();
  const [selectedTopics, setSelectedTopics] = useState<string[]>(link.topic_ids || []);
  const [loading, setLoading] = useState(false);
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: '', color: DEFAULT_COLORS[0] });

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleAddNewTopic = () => {
    if (newTopic.name.trim()) {
      const topic = addTopic(newTopic.name.trim(), newTopic.color);
      setSelectedTopics(prev => [...prev, topic.id]);
      setNewTopic({ name: '', color: DEFAULT_COLORS[0] });
      setShowNewTopicForm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave(selectedTopics);
    } catch (error) {
      console.error('Failed to update topics:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl">
          <div className="absolute right-4 top-4">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-6">Edit Topics</h3>

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

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Topics
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewTopicForm(!showNewTopicForm)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Topic
                </button>
              </div>

              {showNewTopicForm && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New topic name"
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

            <div className="flex justify-end space-x-3">
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
                {loading ? 'Saving...' : 'Save Topics'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}