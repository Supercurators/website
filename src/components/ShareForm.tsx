import { useState } from 'react';
import { useLinkStore } from '../store/linkStore';
import { AIUrlExtractor } from './AIUrlExtractor';
import { EmojiTagSelector } from './EmojiTagSelector';
import { LinkPreviewInput } from './LinkPreviewInput';

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

export function ShareForm() {
  const { addLink } = useLinkStore();
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [showAIExtractor, setShowAIExtractor] = useState(false);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);

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
        <EmojiTagSelector
          suggestedTags={[]}
          onClose={() => {
            setShowEmojiSelector(false);
            setLinkPreview(null);
          }}
          onSave={async (selectedEmojis, selectedTopics, isOriginal) => {
            try {
              await addLink({
                ...linkPreview,
                emoji_tags: selectedEmojis,
                topic_ids: selectedTopics,
                is_original_content: isOriginal,
                publish_to_feed: true
              });
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