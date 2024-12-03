import { useEffect, useState, useMemo } from 'react';
import type { Supercuration, Link as LinkType } from '../../types';

interface DirectoryFiltersProps {
  onFilterChange: (filters: string[]) => void;
  supercuration: Supercuration;
  links: LinkType[];
}

interface FilterCategory {
  name: string;
  tags: string[];
}

export function DirectoryFilters({ onFilterChange, supercuration, links }: DirectoryFiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Collect and organize all unique tags from links
  const filterCategories = useMemo(() => {
    const topicTags = new Set<string>();
    
    links.forEach(link => {
      // Add topic_ids
      if (link.topic_ids) {
        link.topic_ids.forEach(topic => topicTags.add(topic));
      }
    });

    const categories: FilterCategory[] = [];
    
    if (topicTags.size > 0) {
      categories.push({
        name: 'Topics',
        tags: Array.from(topicTags)
      });
    }

    // Add supercuration tag categories if they exist
    if (supercuration.tagCategories?.length) {
      categories.push(...supercuration.tagCategories);
    }

    return categories;
  }, [links, supercuration.tagCategories]);

  const handleFilterClick = (tag: string) => {
    setSelectedFilters(prev => {
      const newFilters = prev.includes(tag)
        ? prev.filter(f => f !== tag)
        : [...prev, tag];
      return newFilters;
    });
  };

  useEffect(() => {
    onFilterChange(selectedFilters);
  }, [selectedFilters, onFilterChange]);

  if (!filterCategories.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="space-y-4">
          {filterCategories.map((category) => (
            <div key={category.name} className="space-y-2">
              <h4 className="text-xs font-medium text-gray-500">{category.name}</h4>
              <div className="space-y-1">
                {category.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleFilterClick(tag)}
                    className={`block w-full text-left px-2 py-1.5 text-sm rounded-md ${
                      selectedFilters.includes(tag)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}