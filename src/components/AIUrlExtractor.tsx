import { useState, useRef } from 'react';
import { Upload, FileText, Loader, CheckSquare, Square, FolderPlus } from 'lucide-react';
import { useSupercurationStore } from '../store/supercurationStore';
import { useLinkStore } from '../store/linkStore';
import { EmojiTagSelector } from './EmojiTagSelector';
import { ExtractedLinkCard } from './ExtractedLinkCard';
import { processImage, extractUrlsFromText, fetchLinkPreviews } from '../lib/urlExtractor';
import type { ExtractedLink } from '../types';

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

export function AIUrlExtractor() {
  const { supercurations } = useSupercurationStore();
  const { addLink } = useLinkStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedLinks, setExtractedLinks] = useState<ExtractedLink[]>([]);
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [selectedLink, setSelectedLink] = useState<ExtractedLink | null>(null);
  const [selectedSupercurationId, setSelectedSupercurationId] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [skipMainFeed, setSkipMainFeed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      const urls = await processImage(file);
      const links = await fetchLinkPreviews(urls);
      setExtractedLinks(links.map(link => ({ ...link, selected: true })));
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to extract text from image');
    } finally {
      setLoading(false);
    }
  };

  const handleTextPaste = async () => {
    try {
      setLoading(true);
      setError(null);
      const text = await navigator.clipboard.readText();
      const urls = await extractUrlsFromText(text);
      
      if (urls.length === 0) {
        setError('No URLs found in the pasted text');
        return;
      }

      const links = await fetchLinkPreviews(urls);
      setExtractedLinks(links.map(link => ({ ...link, selected: true })));
    } catch (err) {
      console.error('Error processing text:', err);
      setError('Failed to process pasted text');
    } finally {
      setLoading(false);
    }
  };

  const toggleAllLinks = () => {
    const allSelected = extractedLinks.every(link => link.selected);
    setExtractedLinks(links =>
      links.map(link => ({ ...link, selected: !allSelected }))
    );
  };

  const toggleLinkSelection = (url: string) => {
    setExtractedLinks(links =>
      links.map(link =>
        link.url === url ? { ...link, selected: !link.selected } : link
      )
    );
  };

  const handleShare = async (link: ExtractedLink) => {
    setSelectedLink(link);
    setShowEmojiSelector(true);
  };

  const handleBatchShare = async () => {
    if (!selectedSupercurationId && !selectedFormat && skipMainFeed) {
      setError('Please select a supercuration or format, or enable adding to main feed');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const selectedLinks = extractedLinks.filter(link => link.selected);
      
      for (const link of selectedLinks) {
        await addLink({
          url: link.url,
          title: link.title,
          description: link.description,
          thumbnail_url: link.thumbnail_url,
          emoji_tags: selectedFormat ? [selectedFormat] : [],
          topic_ids: [],
          is_original_content: false,
          supercuration_ids: selectedSupercurationId ? [selectedSupercurationId] : undefined,
          publish_to_feed: !skipMainFeed
        });
      }

      // Clear the list after successful sharing
      setExtractedLinks([]);
      setSelectedSupercurationId(null);
      setSelectedFormat(null);
      setSkipMainFeed(false);
    } catch (err) {
      console.error('Error sharing links:', err);
      setError('Failed to share links');
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = extractedLinks.filter(link => link.selected).length;

  return (
    <div className="space-y-6">
      {/* Input Methods */}
      <div className="flex gap-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border rounded-lg hover:bg-gray-50"
        >
          <Upload className="w-5 h-5 text-gray-400" />
          <span className="text-gray-700">Upload Screenshot</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <button
          onClick={handleTextPaste}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border rounded-lg hover:bg-gray-50"
        >
          <FileText className="w-5 h-5 text-gray-400" />
          <span className="text-gray-700">Paste Text</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Processing...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Extracted Links */}
      {extractedLinks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleAllLinks}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                {extractedLinks.every(link => link.selected) ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                <span>Select All</span>
              </button>
              <span className="text-sm text-gray-500">
                {selectedCount} of {extractedLinks.length} selected
              </span>
            </div>
          </div>

          {/* Batch Controls */}
          {selectedCount > 0 && (
            <div className="bg-white p-4 rounded-lg border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Batch Settings</h3>
                <button
                  onClick={handleBatchShare}
                  disabled={loading || (!selectedSupercurationId && !selectedFormat && skipMainFeed)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sharing...' : `Share Selected (${selectedCount})`}
                </button>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format for All Selected Items
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {FORMATS.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedFormat(selectedFormat === emoji ? null : emoji)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                        selectedFormat === emoji
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

              {/* Supercuration Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add All Selected Items to Supercuration
                </label>
                <div className="relative">
                  <select
                    value={selectedSupercurationId || ''}
                    onChange={(e) => setSelectedSupercurationId(e.target.value || null)}
                    className="w-full appearance-none pl-8 pr-4 py-2 bg-white border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a supercuration...</option>
                    {supercurations.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                  <FolderPlus className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Feed Option */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={skipMainFeed}
                    onChange={(e) => setSkipMainFeed(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-600">Don't add to main feed</span>
                </label>
              </div>
            </div>
          )}

          {/* Links List */}
          <div className="grid gap-4">
            {extractedLinks.map((link) => (
              <ExtractedLinkCard
                key={link.url}
                link={link}
                onToggleSelect={() => toggleLinkSelection(link.url)}
                onShare={() => handleShare(link)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Emoji Tag Selector Modal */}
      {showEmojiSelector && selectedLink && (
        <EmojiTagSelector
          suggestedTags={[]}
          onClose={() => {
            setShowEmojiSelector(false);
            setSelectedLink(null);
          }}
          onSave={async (selectedEmojis, selectedTopics, isOriginal, postData) => {
            try {
              await addLink({
                ...postData,
                emoji_tags: selectedEmojis,
                topic_ids: selectedTopics,
                is_original_content: isOriginal,
                supercuration_ids: selectedSupercurationId ? [selectedSupercurationId] : undefined,
                publish_to_feed: !skipMainFeed
              });
              setShowEmojiSelector(false);
              setSelectedLink(null);
              setExtractedLinks(links => links.filter(l => l.url !== selectedLink.url));
            } catch (err) {
              console.error('Error sharing link:', err);
              setError('Failed to share link');
            }
          }}
          preview={selectedLink}
        />
      )}
    </div>
  );
}