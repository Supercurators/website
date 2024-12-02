import { useState } from 'react';

interface DirectoryFiltersProps {
  onFilterChange: (filters: string[]) => void;
}

const CONTENT_TYPES = [
  { id: 'article', label: 'Article', color: '#FEE2E2' }, // Light red
  { id: 'tutorial', label: 'Tutorial', color: '#FEE2E2' },
  { id: 'video', label: 'Video', color: '#FEE2E2' },
  { id: 'tool', label: 'Tool', color: '#FEE2E2' },
  { id: 'resource', label: 'Resource', color: '#FEE2E2' }
];

const LEVELS = [
  { id: 'beginner', label: 'Beginner', color: '#DCFCE7' }, // Light green
  { id: 'intermediate', label: 'Intermediate', color: '#DCFCE7' },
  { id: 'advanced', label: 'Advanced', color: '#DCFCE7' }
];

const CATEGORIES = [
  { id: 'generaliste', label: 'Généraliste' },
  { id: 'tech-politique', label: 'Tech & Politique' },
  { id: 'tech-social', label: 'Tech & Social' },
  { id: 'tech-retail', label: 'Tech & Retail' },
  { id: 'ia', label: 'IA' },
  { id: 'silicon-valley', label: 'Silicon Valley' },
  { id: 'ia-audio-video', label: 'IA Audio/Video' },
  { id: 'strategie-innovation', label: 'Stratégie & Innovation' },
  { id: 'futur-of-work', label: 'Futur of Work' },
  { id: 'creator-economy', label: 'Creator Economy' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'tourisme', label: 'Tourisme' },
  { id: 'product-management', label: 'Product Management' },
  { id: 'growth', label: 'Growth' },
  { id: 'medias', label: 'Médias' },
  { id: 'dystopie', label: 'Dystopie' },
  { id: 'culturetech', label: 'CultureTech' },
  { id: 'chine', label: 'Chine' },
  { id: 'us', label: 'US' },
  { id: 'neuroscience', label: 'Neuroscience' }
];

export function DirectoryFilters({ onFilterChange }: DirectoryFiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const toggleFilter = (filterId: string) => {
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter(id => id !== filterId)
      : [...selectedFilters, filterId];
    
    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Horizontal Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-wrap gap-2">
          {/* Content Types */}
          {CONTENT_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => toggleFilter(type.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedFilters.includes(type.id)
                  ? 'bg-red-100 text-red-800 ring-1 ring-red-200'
                  : 'bg-white text-gray-600 hover:bg-red-50'
              }`}
            >
              {type.label}
            </button>
          ))}

          {/* Levels */}
          {LEVELS.map(level => (
            <button
              key={level.id}
              onClick={() => toggleFilter(level.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedFilters.includes(level.id)
                  ? 'bg-green-100 text-green-800 ring-1 ring-green-200'
                  : 'bg-white text-gray-600 hover:bg-green-50'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Left Sidebar Categories */}
      <div className="w-64 bg-white rounded-lg shadow-sm">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
          <div className="space-y-1">
            {CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => toggleFilter(category.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedFilters.includes(category.id)
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}