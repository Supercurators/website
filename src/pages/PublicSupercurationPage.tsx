import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Grid, List } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCategoryStore } from '../store/categoryStore';
import type { Supercuration, Link } from '../types';

export function PublicSupercurationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { topics } = useCategoryStore();
  const [supercuration, setSupercuration] = useState<Supercuration | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchSupercuration = async () => {
      try {
        setLoading(true);
        setError(null);

        // First find the supercuration by slug
        const supercurationsRef = collection(db, 'supercurations');
        const q = query(supercurationsRef, where('slug', '==', slug), where('is_public', '==', true));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error('Supercuration not found');
        }

        const supercurationData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        } as Supercuration;

        setSupercuration(supercurationData);

        // Then fetch all associated links
        const linksRef = collection(db, 'links');
        const linksQuery = query(linksRef, where('supercuration_ids', 'array-contains', supercurationData.id));
        const linksSnapshot = await getDocs(linksQuery);

        const linksData = linksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Link[];

        setLinks(linksData);
      } catch (err) {
        console.error('Error fetching supercuration:', err);
        setError(err instanceof Error ? err.message : 'Failed to load supercuration');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchSupercuration();
    }
  }, [slug]);

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
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{supercuration.title} - Supercurators</title>
        <meta name="description" content={supercuration.description} />
        {supercuration.thumbnail_url && (
          <meta property="og:image" content={supercuration.thumbnail_url} />
        )}
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {supercuration.thumbnail_url && (
            <div className="h-64 w-full mb-6">
              <img
                src={supercuration.thumbnail_url}
                alt=""
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold mb-2">{supercuration.title}</h1>
          <p className="text-gray-600 mb-4">{supercuration.description}</p>
          
          {/* Curator Info */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
            <img
              src={supercuration.user.avatar_url}
              alt={supercuration.user.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h2 className="font-medium">{supercuration.user.name}</h2>
              {supercuration.user.bio && (
                <p className="text-sm text-gray-500">{supercuration.user.bio}</p>
              )}
              {supercuration.user.website && (
                <a
                  href={supercuration.user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {new URL(supercuration.user.website).hostname}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-end mb-6">
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

        {/* Links Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link) => (
              <div
                key={link.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {link.thumbnail_url && (
                  <img
                    src={link.thumbnail_url}
                    alt=""
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-lg hover:text-blue-600"
                  >
                    {link.title}
                  </a>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {link.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {link.emoji_tags?.map((emoji) => (
                      <span key={emoji} className="text-lg">
                        {emoji}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link) => (
              <div
                key={link.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {link.thumbnail_url && (
                    <img
                      src={link.thumbnail_url}
                      alt=""
                      className="w-24 h-24 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-lg hover:text-blue-600"
                    >
                      {link.title}
                    </a>
                    <p className="text-sm text-gray-500 mt-2">
                      {link.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {link.emoji_tags?.map((emoji) => (
                        <span key={emoji} className="text-lg">
                          {emoji}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}