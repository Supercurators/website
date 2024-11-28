import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Grid, List, Pencil, Globe, ExternalLink, Tag, Wand2 } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useCategoryStore } from '../store/categoryStore';
import { useLinkStore } from '../store/linkStore';
import { EditLinkInSupercurationModal } from '../components/EditLinkInSupercurationModal';
import { EditSupercurationModal } from '../components/EditSupercurationModal';
import { TagWizard } from '../components/TagWizard';
import type { Supercuration, Link as LinkType } from '../types';

export function SupercurationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { topics } = useCategoryStore();
  const { updateLink } = useLinkStore();
  const [supercuration, setSupercuration] = useState<Supercuration | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);
  const [showEditSupercuration, setShowEditSupercuration] = useState(false);
  const [showTagWizard, setShowTagWizard] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchSupercuration = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) throw new Error('No supercuration ID provided');

        // Fetch supercuration details
        const supercurationDoc = await getDoc(doc(db, 'supercurations', id));
        if (!supercurationDoc.exists()) {
          throw new Error('Supercuration not found');
        }

        const supercurationData = {
          id: supercurationDoc.id,
          ...supercurationDoc.data()
        } as Supercuration;

        setSupercuration(supercurationData);

        // Fetch all associated links
        const linksRef = collection(db, 'links');
        const linksQuery = query(linksRef, where('supercuration_ids', 'array-contains', id));
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
  }, [id]);

  const handleRemoveFromSupercuration = async (linkId: string) => {
    try {
      const link = links.find(l => l.id === linkId);
      if (!link) return;

      const updatedSupercurations = (link.supercuration_ids || [])
        .filter(sid => sid !== id);

      await updateLink(linkId, {
        supercuration_ids: updatedSupercurations
      });

      // Update local state
      setLinks(prev => prev.filter(l => l.id !== linkId));
    } catch (error) {
      console.error('Failed to remove link:', error);
    }
  };

  const isOwner = user?.id === supercuration?.created_by;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !supercuration) {
    return (
      <div className="text-center py-8 text-red-600">
        {error || 'Supercuration not found'}
      </div>
    );
  }

  const filteredLinks = selectedTags.length > 0
    ? links.filter(link => {
        const linkTags = link.supercuration_tags?.[id] || [];
        return selectedTags.some(tag => linkTags.includes(tag));
      })
    : links;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {supercuration.thumbnail_url && (
          <img
            src={supercuration.thumbnail_url}
            alt=""
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{supercuration.title}</h1>
              <p className="text-gray-600">{supercuration.description}</p>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTagWizard(true)}
                  className="flex items-center gap-2 px-4 py-2 text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100"
                >
                  <Wand2 className="w-4 h-4" />
                  Tag Wizard
                </button>
                <button
                  onClick={() => setShowEditSupercuration(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Public URL */}
          {supercuration.is_public && supercuration.slug && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-gray-400" />
              <a
                href={`/s/${supercuration.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Public URL
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Tag Categories */}
      {supercuration.tagCategories?.length > 0 && (
        <div className="flex flex-wrap gap-4 bg-white rounded-lg shadow-sm p-4">
          {supercuration.tagCategories.map((category) => (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm font-medium">{category.name}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {category.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTags(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    )}
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
            </div>
          ))}
        </div>
      )}

      {/* View Toggle */}
      <div className="flex justify-end">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLinks.map((link) => (
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
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-blue-600 block mb-2"
                    >
                      {link.title}
                    </a>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {link.description}
                    </p>
                  </div>
                  {isOwner && (
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => setEditingLink(link)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromSupercuration(link.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Link Tags */}
                {link.supercuration_tags?.[id]?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {link.supercuration_tags[id].map((tag) => {
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
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLinks.map((link) => (
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-blue-600"
                      >
                        {link.title}
                      </a>
                      <p className="text-sm text-gray-500 mt-1">
                        {link.description}
                      </p>
                    </div>
                    {isOwner && (
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => setEditingLink(link)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveFromSupercuration(link.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Link Tags */}
                  {link.supercuration_tags?.[id]?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {link.supercuration_tags[id].map((tag) => {
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
          ))}
        </div>
      )}

      {/* Modals */}
      {editingLink && (
        <EditLinkInSupercurationModal
          link={editingLink}
          supercurationId={id}
          onClose={() => setEditingLink(null)}
        />
      )}

      {showEditSupercuration && (
        <EditSupercurationModal
          supercuration={supercuration}
          onClose={() => setShowEditSupercuration(false)}
        />
      )}

      {showTagWizard && (
        <TagWizard
          isOpen={true}
          onClose={() => setShowTagWizard(false)}
          supercurationId={id}
          links={links}
          tagCategories={supercuration.tagCategories || []}
        />
      )}
    </div>
  );
}