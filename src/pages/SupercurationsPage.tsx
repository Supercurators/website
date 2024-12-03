import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Plus, Globe, Pencil, Lock } from 'lucide-react';
import { useSupercurationStore } from '../store/supercurationStore';
import { useAuthStore } from '../store/authStore';
import { useCategoryStore } from '../store/categoryStore';
import { TopicFilter } from '../components/TopicFilter';

export function SupercurationsPage() {
  const { user } = useAuthStore();
  const { supercurations, loading, error, fetchSupercurations } = useSupercurationStore();
  const { topics } = useCategoryStore();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  useEffect(() => {
    fetchSupercurations();
  }, [fetchSupercurations]);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  // Filter supercurations based on ownership and public status
  const personalSupercurations = supercurations?.filter(s => s.created_by === user?.id) || [];
  const publicSupercurations = supercurations?.filter(s => 
    s.created_by !== user?.id && s.is_public
  ) || [];

  // Add these console logs
  console.log('All Supercurations:', supercurations);
  console.log('Personal Supercurations:', personalSupercurations);
  console.log('Public Supercurations:', publicSupercurations);

  // Apply topic filter if selected
  const getFilteredSupercurations = (items: typeof supercurations) => {
    if (!items || selectedTopics.length === 0) return items || [];
    return items.filter(s => 
      selectedTopics.some(topicId => s.topics?.includes(topicId))
    );
  };

  // Add this function to calculate topic counts
  const calculateTopicCounts = () => {
    const counts: Record<string, number> = {};
    
    topics.forEach(topic => {
      counts[topic.id] = 0;
    });

    const allSupercurations = [...personalSupercurations, ...publicSupercurations];
    
    // Add these console logs
    console.log('Topics:', topics);
    console.log('Initial Counts:', counts);
    
    allSupercurations.forEach(supercuration => {
      console.log('Processing supercuration:', {
        id: supercuration.id,
        title: supercuration.title,
        topics: supercuration.topics
      });
      
      supercuration.topics?.forEach(topicId => {
        if (counts[topicId] !== undefined) {
          counts[topicId]++;
        }
      });
    });

    console.log('Final Topic Counts:', counts);
    return counts;
  };

  // Replace the TopicFilter section with this updated version
  const topicCounts = calculateTopicCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Supercurations</h1>
        <RouterLink
          to="/supercurations/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Supercuration
        </RouterLink>
      </div>
      <TopicFilter
        topics={topics.map(topic => ({
          ...topic,
          count: topicCounts[topic.id] || 0
        }))}
        selectedTopics={selectedTopics}
        onTopicToggle={toggleTopic}
      />

      {/* Personal Supercurations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {getFilteredSupercurations(personalSupercurations).map((supercuration) => (
          <div
            key={supercuration.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            {supercuration.thumbnail_url && (
              <img
                src={supercuration.thumbnail_url}
                alt=""
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-medium text-lg">{supercuration.title}</h2>
                <div className="flex items-center gap-1 text-sm">
                  {supercuration.is_public ? (
                    <span className="flex items-center gap-1 text-blue-500 px-2 py-0.5 bg-blue-50 rounded-full">
                      <Globe className="w-3.5 h-3.5" />
                      Public
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-500 px-2 py-0.5 bg-gray-50 rounded-full">
                      <Lock className="w-3.5 h-3.5" />
                      Private
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {supercuration.description}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>{supercuration.links_count || 0} links</span>
                <div className="flex items-center gap-2">
                  {supercuration.is_public && supercuration.slug && (
                    <RouterLink
                      to={`/supercurations/public/${supercuration.slug}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Preview
                    </RouterLink>
                  )}
                  <RouterLink
                    to={`/supercurations/${supercuration.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </RouterLink>
                </div>
              </div>
              {supercuration.topics?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {supercuration.topics.map((topicId) => {
                    const topic = topics.find(t => t.id === topicId);
                    if (!topic) return null;
                    return (
                      <span
                        key={topic.id}
                        className="px-2 py-0.5 text-xs rounded-full"
                        style={{
                          backgroundColor: `${topic.color}15`,
                          color: topic.color
                        }}
                      >
                        {topic.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Public Supercurations */}
      {publicSupercurations.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Public Supercurations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getFilteredSupercurations(publicSupercurations).map((supercuration) => (
              <RouterLink
                key={supercuration.id}
                to={`/supercurations/${supercuration.id}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {supercuration.thumbnail_url && (
                  <img
                    src={supercuration.thumbnail_url}
                    alt=""
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h2 className="font-medium text-lg mb-2">{supercuration.title}</h2>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {supercuration.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{supercuration.links_count || 0} links</span>
                    <span>by {supercuration.user?.name}</span>
                  </div>
                  {supercuration.topics?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {supercuration.topics.map((topicId) => {
                        const topic = topics.find(t => t.id === topicId);
                        if (!topic) return null;
                        return (
                          <span
                            key={topic.id}
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{
                              backgroundColor: `${topic.color}15`,
                              color: topic.color
                            }}
                          >
                            {topic.name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </RouterLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}