import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Grid, List, Lock, ExternalLink } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
        })) as LinkType[];

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

  const filteredLinks = selectedFilters.length > 0
    ? links.filter(link => {
        const linkTags = link.supercuration_tags?.[supercuration?.id || ''] || [];
        return selectedFilters.some(filter => linkTags.includes(filter));
      })
    : links;

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
                  Updated {new Date(supercuration.created_at).toLocaleDateString()}
                </span>
              </div>

              <h1 className="text-4xl font-bold mb-4">{supercuration.title}</h1>
              <p className="text-xl text-gray-300 mb-8">{supercuration.description}</p>

              <div className="flex items-center gap-4">
                <img
                  src={supercuration.user.avatar_url}
                  alt={supercuration.user.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h2 className="font-medium">
                    Curated by{' '}
                    <Link 
                      to={`/profile/${supercuration.user.id}`}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {supercuration.user.name}
                    </Link>
                  </h2>
                  {supercuration.user.bio && (
                    <p className="text-sm text-gray-400">{supercuration.user.bio}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:pl-12">
              <NewsletterSignup 
                title={`Subscribe to ${supercuration.title}`}
                description="Get notified when new resources are added to this collection"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0">
            <DirectoryFilters onFilterChange={setSelectedFilters} />
          </div>

          {/* Main Content */}
          <div className="flex-1">
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
                          {(link.supercuration_tags[supercuration.id] || []).map((tag) => {
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
                              {(link.supercuration_tags[supercuration.id] || []).map((tag) => {
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
    </div>
  );
}