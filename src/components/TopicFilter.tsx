import { useState } from 'react';
import { Plus, ChevronDown, X } from 'lucide-react';
import { TopicCategory } from '../types';

interface TopicFilterProps {
  topics: TopicCategory[];
  selectedTopics: string[];
  onTopicToggle: (topicId: string) => void;
}

export function TopicFilter({ topics, selectedTopics, onTopicToggle }: TopicFilterProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get available topics (topics that aren't already selected)
  const availableTopics = topics.filter(topic => !selectedTopics.includes(topic.id));

  // Filter available topics based on search
  const filteredAvailableTopics = availableTopics.filter(topic =>
    topic.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-700">Filter by Topic</h2>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md"
          >
            <Plus className="w-4 h-4" />
            Add Filter
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {isDropdownOpen && availableTopics.length > 0 && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search topics..."
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="py-1 max-h-[200px] overflow-y-auto">
                {filteredAvailableTopics.length > 0 ? (
                  filteredAvailableTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => {
                        onTopicToggle(topic.id);
                        setIsDropdownOpen(false);
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex justify-between items-center"
                    >
                      <span>{topic.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No topics found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Topics */}
      {selectedTopics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTopics.map((topicId) => {
            const topic = topics.find(t => t.id === topicId);
            if (!topic) return null;
            return (
              <button
                key={topic.id}
                onClick={() => onTopicToggle(topic.id)}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm ring-1 group"
                style={{
                  backgroundColor: `${topic.color}15`,
                  color: topic.color,
                  borderColor: topic.color
                }}
              >
                <span>{topic.name}</span>
                <span className="mx-1.5 opacity-50">·</span>
                <span className="opacity-75">{}</span>
                <X className="w-3 h-3 ml-1.5 opacity-50 group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
} 