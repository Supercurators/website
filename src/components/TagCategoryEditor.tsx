import { useState } from 'react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import type { TagCategory } from '../types';

interface TagCategoryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TagCategory[];
  onSave: (categories: TagCategory[]) => void;
}

export function TagCategoryEditor({ isOpen, onClose, categories: initialCategories, onSave }: TagCategoryEditorProps) {
  const [categories, setCategories] = useState<TagCategory[]>(initialCategories);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  const addCategory = () => {
    const newCategory: TagCategory = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Category',
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      tags: []
    };
    setCategories([...categories, newCategory]);
    setEditingCategory(newCategory.id);
  };

  const updateCategory = (id: string, updates: Partial<TagCategory>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    ));
  };

  const removeCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const addTag = (categoryId: string) => {
    if (!newTag.trim()) return;
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    updateCategory(categoryId, {
      tags: [...category.tags, newTag.trim()]
    });
    setNewTag('');
  };

  const removeTag = (categoryId: string, tag: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    updateCategory(categoryId, {
      tags: category.tags.filter(t => t !== tag)
    });
  };

  if (!isOpen) return null;

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

          <h3 className="text-lg font-medium text-gray-900 mb-6">Manage Tag Categories</h3>

          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  {editingCategory === category.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                        className="px-2 py-1 border rounded"
                      />
                      <input
                        type="color"
                        value={category.color}
                        onChange={(e) => updateCategory(category.id, { color: e.target.value })}
                        className="w-8 h-8 p-1 border rounded cursor-pointer"
                      />
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="px-3 py-1 bg-blue-600 text-white rounded"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingCategory(category.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeCategory(category.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag(category.id)}
                      className="flex-1 px-3 py-1.5 text-sm border rounded"
                    />
                    <button
                      onClick={() => addTag(category.id)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {category.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded"
                        style={{
                          backgroundColor: `${category.color}15`,
                          color: category.color
                        }}
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(category.id, tag)}
                          className="p-0.5 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addCategory}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400"
            >
              <Plus className="w-5 h-5 mx-auto" />
            </button>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(categories);
                onClose();
              }}
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}