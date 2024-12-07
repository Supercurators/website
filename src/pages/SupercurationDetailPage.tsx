import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid, List, Globe, Lock, Tag, Plus, Trash2, X } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, runTransaction, deleteField, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useSupercurationStore } from '../store/supercurationStore';
import { TagCategoryEditor } from '../components/TagCategoryEditor';
import { LinkContentEdit } from '../components/link/link-content-edit';
import type { Supercuration, Link as LinkType } from '../types';
import { Link as RouterLink } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useLinkStore } from '../store/linkStore';
import { ShareForm } from '../components/link/ShareForm';
import { LinkDisplay } from '../components/link/link-display';
import { useCategoryStore } from '../store/categoryStore';

export function SupercurationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { updateSupercuration } = useSupercurationStore();
  const [supercuration, setSupercuration] = useState<Supercuration | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const [savedLinks, setSavedLinks] = useState<LinkType[]>([]);
  const [isFetchingSaved, setIsFetchingSaved] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);
  const { updateLink } = useLinkStore();
  const { topics } = useCategoryStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleTagFilter = (tag: string) => {
    setSelectedFilters(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      }
      return [...prev, tag];
    });
  };

  useEffect(() => {
    const fetchSupercuration = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

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

        // Fetch associated links
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

  const filteredLinks = selectedFilters.length > 0
    ? links.filter(link => {
        const linkTags = link.supercuration_tags?.[id || ''] || [];
        return selectedFilters.some(filter => linkTags.includes(filter));
      })
    : links;

  const isOwner = user?.id === supercuration?.created_by;

  const handleAddResource = async (linkData: LinkType) => {
    if (!id || !user?.id) return;
    
    try {
      // Create new link object with proper typing
      const newLink: Omit<LinkType, 'id' | 'liked' | 'created_at'> & { created_at: any } = {
        url: linkData.url,
        title: linkData.title,
        description: linkData.description,
        thumbnail_url: linkData.thumbnail_url,
        emoji_tags: linkData.emoji_tags,
        topic_ids: linkData.topic_ids,
        supercuration_ids: [id],
        supercuration_tags: linkData.supercuration_tags || {},
        is_original_content: linkData.is_original_content,
        created_by: user.id,
        created_at: serverTimestamp(),
        user: {
          id: user.id,
          name: user.name,
          avatar_url: user.avatar_url
        },
        likes: 0,
        reposts_count: 0,
        linkText: linkData.linkText
      };

      await runTransaction(db, async (transaction) => {
        // First, perform all reads
        const supercurationRef = doc(db, 'supercurations', id);
        const supercurationDoc = await transaction.get(supercurationRef);
        
        if (!supercurationDoc.exists()) {
          throw new Error('Supercuration not found');
        }

        // Check if URL already exists in this supercuration
        const linksRef = collection(db, 'links');
        const existingLinksQuery = query(
          linksRef,
          where('url', '==', linkData.url),
          where('supercuration_ids', 'array-contains', id)
        );
        const existingLinksSnapshot = await getDocs(existingLinksQuery);

        if (!existingLinksSnapshot.empty) {
          throw new Error('This link has already been added to this supercuration');
        }

        // If link exists in other supercurations, update it instead of creating new
        const allLinksQuery = query(linksRef, where('url', '==', linkData.url));
        const allLinksSnapshot = await getDocs(allLinksQuery);
        
        let finalLink: LinkType;
        
        if (!allLinksSnapshot.empty) {
          // Update existing link
          const existingLink = allLinksSnapshot.docs[0];
          const linkRef = doc(db, 'links', existingLink.id);
          const existingData = existingLink.data();
          
          transaction.update(linkRef, {
            supercuration_ids: [...new Set([...(existingData.supercuration_ids || []), id])]
          });
          
          finalLink = {
            ...existingLink.data(),
            id: existingLink.id
          } as LinkType;
        } else {
          // Create new link
          const linkRef = doc(collection(db, 'links'));
          transaction.set(linkRef, newLink);
          finalLink = {
            ...newLink,
            id: linkRef.id,
            liked: false
          } as LinkType;
        }

        // Update supercuration links count
        transaction.update(supercurationRef, {
          links_count: (supercurationDoc.data().links_count || 0) + 1
        });

        // Update local state
        setLinks(prev => [...prev, finalLink]);
      });

      setShowAddResource(false);
    } catch (err) {
      console.error('Error adding resource:', err);
      alert(err instanceof Error ? err.message : 'Failed to add resource');
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!id) return;
    
    try {
      await runTransaction(db, async (transaction) => {
        // Get references
        const supercurationRef = doc(db, 'supercurations', id);
        const linkRef = doc(db, 'links', resourceId);
        
        // Get current documents
        const [supercurationDoc, linkDoc] = await Promise.all([
          transaction.get(supercurationRef),
          transaction.get(linkRef)
        ]);
        
        if (!supercurationDoc.exists()) {
          throw new Error('Supercuration not found');
        }
        
        if (!linkDoc.exists()) {
          throw new Error('Link not found');
        }

        const linkData = linkDoc.data();
        const updatedSupercurationIds = (linkData.supercuration_ids || [])
          .filter((sid: string) => sid !== id);

        // Update the documents
        const updates: any = {
          supercuration_ids: updatedSupercurationIds
        };

        // Remove tags for this supercuration if they exist
        if (linkData.supercuration_tags?.[id]) {
          updates[`supercuration_tags.${id}`] = deleteField();
        }

        // Update the link document
        transaction.update(linkRef, updates);

        // Update supercuration links count
        transaction.update(supercurationRef, {
          links_count: Math.max(0, (supercurationDoc.data().links_count || 0) - 1)
        });
      });

      // Update local state
      setLinks(prev => prev.filter(link => link.id !== resourceId));
      setDeletingResourceId(null);
    } catch (err) {
      console.error('Error removing resource:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove resource');
    }
  };

  const handleDeleteSupercuration = async () => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, 'supercurations', id));
      navigate('/supercurations');
    } catch (err) {
      console.error('Error deleting supercuration:', err);
    }
  };

  const fetchSavedLinks = async () => {
    if (!user?.id || !id) return;
    
    try {
      setIsFetchingSaved(true);
      const linksRef = collection(db, 'links');
      const linksQuery = query(
        linksRef,
        where('created_by', '==', user.id),
      );
      
      const querySnapshot = await getDocs(linksQuery);
      const fetchedLinks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LinkType[];
      
      const filteredLinks = fetchedLinks.filter(link => 
        !link.supercuration_ids?.includes(id || '')
      );
      
      setSavedLinks(filteredLinks);
    } catch (err) {
      console.error('Error fetching saved links:', err);
    } finally {
      setIsFetchingSaved(false);
    }
  };

  useEffect(() => {
    if (showAddResource) {
      fetchSavedLinks();
    }
  }, [showAddResource]);

  const handleEditResource = async (
    selectedEmojis: string[],
    selectedTopics: string[],
    isOriginal: boolean,
    postData: {
      url?: string;
      title: string;
      description: string;
      thumbnail_url?: string;
    },
    supercurationTags?: string[]
  ) => {
    if (!editingLink?.id || !id) return;

    try {
      // Prepare the update data
      const updateData: any = {
        ...postData,
        emoji_tags: selectedEmojis,
        topic_ids: selectedTopics,
        is_original_content: isOriginal,
      };

      // If supercuration tags were provided, update them
      if (supercurationTags) {
        updateData.supercuration_tags = {
          ...(editingLink.supercuration_tags || {}),
          [id]: supercurationTags
        };
      }

      // Add current supercuration ID to supercuration_ids if not already present
      const currentSupercurationIds = editingLink.supercuration_ids || [];
      if (!currentSupercurationIds.includes(id)) {
        updateData.supercuration_ids = [...currentSupercurationIds, id];
      }

      await updateLink(editingLink.id, updateData);

      // Update local state
      setLinks(prev => prev.map(link =>
        link.id === editingLink.id 
          ? {
              ...link,
              ...postData,
              emoji_tags: selectedEmojis,
              topic_ids: selectedTopics,
              is_original_content: isOriginal,
              supercuration_ids: updateData.supercuration_ids || link.supercuration_ids,
              supercuration_tags: {
                ...(link.supercuration_tags || {}),
                [id]: supercurationTags || link.supercuration_tags?.[id] || []
              },
              updated_at: new Date().toISOString(),
            }
          : link
      ));

      toast.success('Resource updated successfully');
      setEditingLink(null);
    } catch (err) {
      console.error('Error updating resource:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update resource');
    }
  };

  const filteredSavedLinks = savedLinks.filter(link => {
    const searchLower = searchQuery.toLowerCase();
    return (
      link.title.toLowerCase().includes(searchLower) ||
      link.description.toLowerCase().includes(searchLower) ||
      link.url?.toLowerCase().includes(searchLower)
    );
  });

  const handleAddNewLink = (newLink: LinkType) => {
    setLinks(prev => [...prev, newLink]);
    setShowAddResource(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !supercuration) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || 'Supercuration not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">{supercuration.title}</h1>
            {!supercuration.is_public && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-500">
                <Lock className="w-3 h-3 mr-1" />
                Private
              </span>
            )}
          </div>
          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
                Delete Supercuration
              </button>
              <button
                onClick={() => setShowTagEditor(true)}
                className="flex items-center gap-2 px-4 py-2 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                <Tag className="w-4 h-4" />
                Edit Tags
              </button>
            </div>
          )}
        </div>

        <p className="text-gray-600 mb-4">{supercuration.description}</p>

        {supercuration.is_public && supercuration.slug && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Globe className="w-4 h-4" />
            <span>Public URL:</span>
            <RouterLink
              to={`/supercurations/public/${supercuration.slug}`}
              className="text-blue-600 hover:text-blue-700"
            >
              supercurators.com/supercurations/public/{supercuration.slug}
            </RouterLink>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex items-center justify-between">
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

      {supercuration.tagCategories?.map(category => (
        <div key={category.name} className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{category.name}</h3>
          <div className="flex flex-wrap gap-2">
            {category.tags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagFilter(tag)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedFilters.includes(tag)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ))}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isOwner && (
            <button
              onClick={() => setShowAddResource(true)}
              className="flex flex-col items-center justify-center h-full bg-white rounded-lg shadow-sm p-8 border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group"
            >
              <Plus className="w-8 h-8 text-gray-400 group-hover:text-gray-500 mb-2" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-gray-700">
                Add New Resource
              </span>
            </button>
          )}
          {filteredLinks.map((link) => (
            <div key={link.id} className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <LinkDisplay
                link={link}
                topics={topics}
                onToggleLike={() => {/* Implement like functionality */}}
                onEdit={() => setEditingLink(link)}
                onDelete={() => setDeletingResourceId(link.id)}
                showUserInfo={true}
                editable={isOwner}
                onSupercurationDetail={viewMode === 'grid'}
              />
              {(link.supercuration_tags?.[id || ''] ?? []).length > 0 && (
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                  {(link.supercuration_tags?.[id || ''] ?? []).map((tag: string) => {
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
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {isOwner && (
            <button
              onClick={() => setShowAddResource(true)}
              className="w-full flex items-center justify-center bg-white rounded-lg shadow-sm p-4 border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group"
            >
              <Plus className="w-5 h-5 text-gray-400 group-hover:text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-gray-700">
                Add New Resource
              </span>
            </button>
          )}
          {filteredLinks.map((link) => (
            <LinkDisplay
              key={link.id}
              link={link}
              topics={topics}
              onToggleLike={() => {/* Implement like functionality */}}
              onEdit={() => setEditingLink(link)}
              onDelete={() => setDeletingResourceId(link.id)}
              showUserInfo={true}
              editable={isOwner}
              onSupercurationDetail={viewMode === 'list'}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showTagEditor && (
        <TagCategoryEditor
          isOpen={true}
          onClose={() => setShowTagEditor(false)}
          categories={supercuration.tagCategories || []}
          onSave={async (categories) => {
            try {
              await updateSupercuration(supercuration.id, {
                ...supercuration,
                tagCategories: categories
              });
              setShowTagEditor(false);
              // Refresh supercuration data
              const updatedDoc = await getDoc(doc(db, 'supercurations', supercuration.id));
              setSupercuration({
                id: updatedDoc.id,
                ...updatedDoc.data()
              } as Supercuration);
            } catch (error) {
              console.error('Failed to update tag categories:', error);
            }
          }}
        />
      )}

      {showAddResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Add New Resource</h2>
                <button
                  onClick={() => setShowAddResource(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Add from your saved posts</h3>
                  
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search saved posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-3">
                    {isFetchingSaved ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : filteredSavedLinks.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        {searchQuery 
                          ? 'No saved links match your search'
                          : 'No saved links available to add'
                        }
                      </p>
                    ) : (
                      filteredSavedLinks.map((link) => (
                        <button
                          key={link.id}
                          onClick={() => handleAddResource(link)}
                          className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 text-left group"
                        >
                          {link.thumbnail_url && (
                            <img
                              src={link.thumbnail_url}
                              alt=""
                              className="w-16 h-16 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                              {link.title}
                            </h4>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {link.description}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Add a new link</h3>
                  <ShareForm 
                    supercurationId={id || undefined} 
                    onLinkAdded={handleAddNewLink}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Resource Confirmation Modal */}
      {deletingResourceId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Remove Resource</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove this resource from the supercuration?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingResourceId(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteResource(deletingResourceId)}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Supercuration Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Delete Supercuration</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this supercuration? This will permanently delete all associated data and cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSupercuration}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingLink && id && (
        <LinkContentEdit
          suggestedTags={[]}
          onClose={() => setEditingLink(null)}
          onSave={handleEditResource}
          preview={{
            url: editingLink.url,
            title: editingLink.title,
            description: editingLink.description,
            thumbnail_url: editingLink.thumbnail_url,
          }}
          isEditing={true}
          initialEmojis={editingLink.emoji_tags || []}
          initialTopics={editingLink.topic_ids || []}
          initialIsOriginal={editingLink.is_original_content || false}
          supercurationId={id}
          supercurationTags={supercuration.tagCategories?.map(cat => cat.tags) || []}
          initialSupercurationTags={
            editingLink.supercuration_tags && id in editingLink.supercuration_tags 
              ? editingLink.supercuration_tags[id] 
              : []
          }
        />
      )}
    </div>
  );
}