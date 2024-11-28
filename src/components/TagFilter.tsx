import { useState } from 'react';
import { Tag } from 'lucide-react';
import type { TagCategory } from '../types';

interface TagFilterProps {
  categories: TagCategory[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
}

export function TagFilter({ categories, selectedTags, onTagSelect }: TagFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories.map(c => c.id));

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (categories.length === 0) return null;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Tag className="w-4 h-4" />
          <span>Filter by Tags</span>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="space-y-2">
            <button
              onClick={() => toggleCategory(category.id)}
              className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-gray-50"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm font-medium">{category.name}</span>
            </button>

            {expandedCategories.includes(category.id) && (
              <div className="ml-5 flex flex-wrap gap-2">
                {category.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onTagSelect(tag)}
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}