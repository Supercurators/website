import { useState, useEffect } from 'react';
import { useLinkStore } from '../../store/linkStore';
import { AIUrlExtractor } from '../AIUrlExtractor';
import { LinkContentEdit } from './link-content-edit';
import { LinkPreviewInput } from './LinkPreviewInput';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Supercuration, Link as LinkType } from '../../types';

interface LinkPreview {
  url: string;
  title: string;
  description: string;
  thumbnail_url?: string;
}

export function normalizeUrl(url: string): string {
  if (!url) return url;
  
  // Remove leading/trailing whitespace
  url = url.trim();
  
  // Remove any accidental @ symbols that might be at the start
  url = url.replace(/^@+/, '');
  
  // Handle common protocol variations
  if (!/^https?:\/\//i.test(url)) {
    // Remove any accidental forward slashes at the start
    url = url.replace(/^\/+/, '');
    url = 'https://' + url;
  }
  
  return url;
}

interface ShareFormProps {
  supercurationId: string | undefined;
  onLinkAdded?: (link: LinkType) => void;
}

export function ShareForm({ supercurationId, onLinkAdded }: ShareFormProps) {
  const { addLink, refreshLinks } = useLinkStore();
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [showAIExtractor, setShowAIExtractor] = useState(false);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [supercuration, setSupercuration] = useState<Supercuration | null>(null);

  // Fetch supercuration data when supercurationId changes
  useEffect(() => {
    const fetchSupercuration = async () => {
      if (!supercurationId) return;
      
      try {
        const supercurationDoc = await getDoc(doc(db, 'supercurations', supercurationId));
        if (supercurationDoc.exists()) {
          setSupercuration({
            id: supercurationDoc.id,
            ...supercurationDoc.data()
          } as Supercuration);
        }
      } catch (err) {
        console.error('Error fetching supercuration:', err);
      }
    };

    fetchSupercuration();
  }, [supercurationId]);

  const handleShare = async (preview: LinkPreview) => {
    const normalizedPreview = {
      ...preview,
      url: normalizeUrl(preview.url),
      thumbnail_url: preview.thumbnail_url ? normalizeUrl(preview.thumbnail_url) : undefined
    };
    setLinkPreview(normalizedPreview);
    setShowEmojiSelector(true);
  };

  return (
    <div className="mb-8">
      <LinkPreviewInput onShare={handleShare} />
      <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={() => setShowAIExtractor(true)}
          className="text-blue-600 hover:text-blue-700"
        >
          Import multiple URLs from text or image
        </button>
      </div>

      {showAIExtractor && (
        <div className="mt-4">
          <AIUrlExtractor />
        </div>
      )}

      {/* Emoji Tag Selector Modal */}
      {showEmojiSelector && linkPreview && (
        <LinkContentEdit
          suggestedTags={[]}
          supercurationId={supercurationId}
          supercurationTags={supercuration?.tagCategories?.map(cat => cat.tags) || []}
          initialSupercurationTags={[]}
          onClose={() => {
            setShowEmojiSelector(false);
            setLinkPreview(null);
          }}
          onSave={async (
            selectedEmojis, 
            selectedTopics, 
            isOriginal, 
            postData, 
            supercurationTags, 
            currentSupercurationId,
            selectedSupercurations
          ) => {
            try {
              // Determine which supercuration IDs to use
              const supercurationIds = currentSupercurationId 
                ? [currentSupercurationId]
                : selectedSupercurations || [];

              const linkData = {
                ...postData,
                emoji_tags: selectedEmojis,
                topic_ids: selectedTopics,
                is_original_content: isOriginal,
                publish_to_feed: true,
                supercuration_ids: supercurationIds,
                ...(currentSupercurationId && supercurationTags ? {
                  supercuration_tags: {
                    [currentSupercurationId]: supercurationTags
                  }
                } : {})
              };

              const newLink = await addLink(linkData);
              
              if (newLink && onLinkAdded) {
                onLinkAdded(newLink);
              }
              
              await refreshLinks();
              setShowEmojiSelector(false);
              setLinkPreview(null);
            } catch (err) {
              console.error('Error sharing link:', err);
            }
          }}
          preview={linkPreview}
        />
      )}
    </div>
  );
} 