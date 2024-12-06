import { Tag } from 'lucide-react';
import { useCategoryStore } from '../../store/categoryStore';
import { useState } from 'react';

export function ShareLink() {
  const { topics } = useCategoryStore();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-2">
        {topics.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              const isSelected = selectedCategories.includes(category.id);
              setSelectedCategories(
                isSelected
                  ? selectedCategories.filter(id => id !== category.id)
                  : [...selectedCategories, category.id]
              );
            }}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              selectedCategories.includes(category.id)
                ? 'ring-1'
                : 'hover:bg-opacity-20'
            }`}
            style={{
              backgroundColor: `${category.color}15`,
              color: category.color,
              borderColor: selectedCategories.includes(category.id) ? category.color : 'transparent'
            }}
          >
            <span className="text-current">{category.name}</span>
          </button>
        ))}
      </div>
      <button
        className="p-2 text-gray-400 hover:text-gray-600"
      >
        <Tag className="w-5 h-5" />
      </button>
    </div>
  );
}