import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Grid, List, Lock, ExternalLink, X, Filter, Clock, ArrowUpDown } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DirectoryFilters } from '../components/directory/DirectoryFilters';
import { NewsletterSignup } from '../components/NewsletterSignup';
import type { Supercuration, Link as LinkType } from '../types';

export function PublicSupercurationPage() {
  const { slug } = useParams<{ slug: string }>();
  const [supercuration, setSupercuration] = useState<Supercuration | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [formatFilter, setFormatFilter] = useState<string | null>(null);
  const [filteredLinks, setFilteredLinks] = useState<LinkType[]>([]);
  const [userData, setUserData] = useState<{ name: string; avatar_url: string; bio?: string } | null>(null);

  const navigate = useNavigate();

  const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most_liked', label: 'Most Liked' },
  ];
  const FORMATS = [
    { emoji: '📝', label: 'Article' },
    { emoji: '📺', label: 'Video' },
    { emoji: '🎧', label: 'Podcast' },
    { emoji: '📰', label: 'Newsletter' },
    { emoji: '🛠️', label: 'Tool' },
    { emoji: '📚', label: 'Tutorial' },
    { emoji: '🎨', label: 'Design' },
    { emoji: '🤖', label: 'AI' },
    { emoji: '💻', label: 'Dev' },
    { emoji: '🔗', label: 'Other' }
  ];

  useEffect(() => {
    console.log('Current slug param:', slug);
  }, [slug]);

  useEffect(() => {
    const fetchSupercuration = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching supercuration with slug:', slug);

        // Find supercuration by slug
        const supercurationsRef = collection(db, 'supercurations');
        const q = query(supercurationsRef, where('slug', '==', slug));
        const querySnapshot = await getDocs(q);

        console.log('Query results:', querySnapshot.size);

        if (querySnapshot.empty) {
          throw new Error('Supercuration not found');
        }

        const supercurationData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        } as Supercuration;

        console.log('Supercuration created_at:', supercurationData.created_at, 'Type:', typeof supercurationData.created_at);

        console.log('Found supercuration:', supercurationData);

        // Verify that is_public is true
        if (!supercurationData.is_public) {
          throw new Error('This supercuration is private');
        }

        setSupercuration(supercurationData);

        // Fetch associated links
        const linksRef = collection(db, 'links');
        const linksQuery = query(linksRef, where('supercuration_ids', 'array-contains', supercurationData.id));
        const linksSnapshot = await getDocs(linksQuery);

        const linksData = linksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as LinkType);

        console.log('All fetched links:', linksData.map(link => ({
          id: link.id,
          title: link.title,
          url: link.url,
          created_at: link.created_at,
          supercuration_ids: link.supercuration_ids
        })));

        setLinks(linksData);
      } catch (err) {
        console.error('Error fetching supercuration:', err);
        setError(err instanceof Error ? err.message : 'Failed to load supercuration');
      } finally {
        setLoading(false);
      }
    };

    fetchSupercuration();
  }, [slug]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!supercuration?.user?.id) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', supercuration.user.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserData({
            name: userData.name,
            avatar_url: userData.avatar_url,
            bio: userData.bio
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, [supercuration?.user?.id]);

  useEffect(() => {
    const newFiltered = getFilteredLinks();
    setFilteredLinks(newFiltered);
  }, [selectedFilters, formatFilter, timeFilter, sortBy, links]);

  const getFilteredLinks = () => {
    console.log('Starting getFilteredLinks with:', links.map(link => ({
      id: link.id,
      title: link.title,
      url: link.url,
      created_at: link.created_at
    })));

    // Start with all links
    let filtered = [...links];

    // Apply topic/tag filters first
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(link => {
        const linkTags = link.supercuration_tags?.[supercuration?.id || ''] || [];
        const hasMatchingFilter = selectedFilters.some(filter => {
          if (linkTags.includes(filter)) return true;
          if (link.topic_ids?.includes(filter)) return true;
          if (link.emoji_tags?.includes(filter)) return true;
          return false;
        });
        return hasMatchingFilter;
      });
    }

    // Apply format filter
    if (formatFilter) {
      filtered = filtered.filter(link => {
        const emojiTags = Array.isArray(link.emoji_tags) ? link.emoji_tags : [];
        return emojiTags.includes(formatFilter);
      });
    }

    // Apply time filter
    const now = new Date();
    if (timeFilter !== 'all') {
      filtered = filtered.filter(link => {
        const linkDate = new Date(link.created_at);
        switch (timeFilter) {
          case 'today':
            return linkDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return linkDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return linkDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sort links
    const sorted = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'most_liked':
          return (b.likes || 0) - (a.likes || 0);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    console.log('Final sorted links:', sorted.map(link => ({
      id: link.id,
      title: link.title,
      url: link.url,
      created_at: link.created_at,
      created_time: new Date(link.created_at).getTime()
    })));

    return sorted;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !supercuration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600">This supercuration doesn't exist or is private</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{supercuration.title} | Supercurators</title>
        <meta name="description" content={supercuration.description} />
        {supercuration.thumbnail_url && (
          <meta property="og:image" content={supercuration.thumbnail_url} />
        )}
      </Helmet>

      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-6">
                {!supercuration.is_public && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-500">
                    <Lock className="w-3 h-3 mr-1" />
                    Private
                  </span>
                )}
                <span className="text-sm text-gray-400">
                  Created on {supercuration.created_at?.toDate().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <h1 className="text-4xl font-bold mb-4">{supercuration.title}</h1>
              <p className="text-xl text-gray-300 mb-8">{supercuration.description}</p>

              <div className="flex items-center gap-4">
                {userData && (
                  <>
                    <img
                      src={userData.avatar_url}
                      alt={userData.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h2 className="font-medium">
                        Curated by{' '}
                        <Link 
                          to={`/profile/${supercuration.user.id}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {userData.name}
                        </Link>
                      </h2>
                      {userData.bio && (
                        <p className="text-sm text-gray-400">{userData.bio}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="lg:pl-12 space-y-6">
              <NewsletterSignup 
                title={`Subscribe to ${supercuration.title}`}
                description="Get notified when new resources are added to this collection"
                supercurationId={supercuration.id}
              />
              
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-lg font-medium mb-2">Want to create your own collection?</h3>
                <p className="text-gray-300 mb-4">
                  Join Supercurators to create and share your own curated collections of resources.
                </p>
                <button
                  onClick={() => navigate('/home')}
                  className="w-full bg-white text-gray-900 hover:bg-gray-100 py-2.5 px-4 rounded-lg font-medium transition-colors"
                >
                  Sign up or log in
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:flex lg:gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <DirectoryFilters 
              onFilterChange={setSelectedFilters} 
              supercuration={supercuration}
              links={links}
            />
          </div>

          <div className="flex-1">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select 
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="appearance-none pl-8 pr-4 py-1.5 bg-white border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All time</option>
                      <option value="today">Today</option>
                      <option value="week">This week</option>
                      <option value="month">This month</option>
                    </select>
                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>

                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none pl-8 pr-4 py-1.5 bg-white border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {SORT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Mobile Filter Button */}
                <div className="lg:hidden">
                  <button
                    onClick={() => setIsFilterDrawerOpen(true)}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white border rounded-full text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                </div>
              </div>

              {/* Format Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFormatFilter(null)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    !formatFilter
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Formats
                </button>
                {FORMATS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    onClick={() => setFormatFilter(formatFilter === emoji ? null : emoji)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                      formatFilter === emoji
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                {filteredLinks.length} Resources
              </h2>
              <div className="flex items-center gap-2 border rounded-full p-1 bg-white">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-full ${
                    viewMode === 'grid'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-full ${
                    viewMode === 'list'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {link.thumbnail_url && (
                      <div className="aspect-video">
                        <img
                          src={link.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                        {link.title}
                        <ExternalLink className="inline-block w-3.5 h-3.5 ml-1 opacity-50" />
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                        {link.description}
                      </p>
                      {link.supercuration_tags && supercuration.id && link.supercuration_tags[supercuration.id]?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(link.supercuration_tags[supercuration.id] || []).map((tag: string) => {
                            const category = supercuration.tagCategories?.find(cat => 
                              cat.tags.includes(tag)
                            );
                            if (!category) return null;
                            return (
                              <span
                                key={tag}
                                className="px-2 py-0.5 text-xs rounded-full"
                                style={{
                                  backgroundColor: `${category.color}15`,
                                  color: category.color
                                }}
                              >
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex gap-4">
                        {link.thumbnail_url && (
                          <img
                            src={link.thumbnail_url}
                            alt=""
                            className="w-24 h-24 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                            {link.title}
                            <ExternalLink className="inline-block w-3.5 h-3.5 ml-1 opacity-50" />
                          </h3>
                          <p className="text-sm text-gray-500">
                            {link.description}
                          </p>
                          {link.supercuration_tags && supercuration.id && link.supercuration_tags[supercuration.id]?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {(link.supercuration_tags[supercuration.id] || []).map((tag: string) => {
                                const category = supercuration.tagCategories?.find(cat => 
                                  cat.tags.includes(tag)
                                );
                                if (!category) return null;
                                return (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 text-xs rounded-full"
                                    style={{
                                      backgroundColor: `${category.color}15`,
                                      color: category.color
                                    }}
                                  >
                                    {tag}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsFilterDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-[300px] bg-white shadow-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Filters</h2>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <DirectoryFilters 
                onFilterChange={setSelectedFilters} 
                supercuration={supercuration}
                links={links}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}