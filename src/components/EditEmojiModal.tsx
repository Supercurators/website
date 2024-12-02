import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useLinkStore } from '../store/linkStore';
import { useCategoryStore } from '../store/categoryStore';

interface EditEmojiModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkId: string;
}

export function EditEmojiModal({ isOpen, onClose, linkId }: EditEmojiModalProps) {
  const { links, updateLink } = useLinkStore();
  const { topics, addTopic } = useCategoryStore();
  const link = links.find(l => l.id === linkId);
  
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    link?.topic_ids || []
  );
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: '', color: '#2563eb' });

  if (!isOpen || !link) return null;

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleAddNewTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopic.name.trim()) {
      addTopic(newTopic.name.trim(), newTopic.color);
      setNewTopic({ name: '', color: '#2563eb' });
      setShowNewTopicForm(false);
    }
  };

  const handleSave = () => {
    updateLink(link.id, {
      topic_ids: selectedTopics
    });
    onClose();
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

          <h3 className="text-lg font-medium text-gray-900 mb-6">Edit Tags</h3>

          {/* Link Preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{link.title}</h4>
            <p className="text-sm text-gray-500 line-clamp-2">{link.description}</p>
          </div>

          {/* Topics */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Topics</h4>
              <button
                onClick={() => setShowNewTopicForm(!showNewTopicForm)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Topic
              </button>
            </div>

            {showNewTopicForm && (
              <form onSubmit={handleAddNewTopic} className="mb-4 p-3 bg-gray-50 rounded-lg">
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
                    type="submit"
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic.id}
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

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}