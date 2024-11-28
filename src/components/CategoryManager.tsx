import React, { useState } from 'react';
import { Plus, X, Edit2 } from 'lucide-react';
import { useCategoryStore, TopicCategory } from '../store/categoryStore';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  '#2563eb', '#dc2626', '#059669', '#7c3aed', '#db2777',
  '#ea580c', '#ca8a04', '#4f46e5', '#0891b2', '#be123c'
];

export function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const { topics, addTopic, removeTopic, updateTopic } = useCategoryStore();
  const [newTopic, setNewTopic] = useState({ name: '', color: COLORS[0] });
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopic.name.trim()) {
      addTopic(newTopic.name.trim(), newTopic.color);
      setNewTopic({ name: '', color: COLORS[0] });
    }
  };

  const handleEdit = (topic: TopicCategory) => {
    if (editingId === topic.id) {
      setEditingId(null);
    } else {
      setEditingId(topic.id);
      setNewTopic({ name: topic.name, color: topic.color });
    }
  };

  const handleUpdate = (id: string) => {
    updateTopic(id, newTopic);
    setEditingId(null);
    setNewTopic({ name: '', color: COLORS[0] });
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

          <h3 className="text-lg font-medium text-gray-900 mb-6">Manage Topics</h3>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New topic name..."
                className="flex-1 px-3 py-2 border rounded-md"
                value={newTopic.name}
                onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
              />
              <div className="relative">
                <input
                  type="color"
                  value={newTopic.color}
                  onChange={(e) => setNewTopic({ ...newTopic, color: e.target.value })}
                  className="w-10 h-10 p-1 border rounded-md cursor-pointer"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                {editingId === topic.id ? (
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      value={newTopic.name}
                      onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                      className="flex-1 px-2 py-1 border rounded"
                    />
                    <input
                      type="color"
                      value={newTopic.color}
                      onChange={(e) => setNewTopic({ ...newTopic, color: e.target.value })}
                      className="w-8 h-8 p-1 border rounded cursor-pointer"
                    />
                    <button
                      onClick={() => handleUpdate(topic.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: topic.color }}
                      />
                      <span>{topic.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(topic)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeTopic(topic.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}