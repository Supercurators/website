import { useState } from 'react';
import { Copy, Check, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useLinkStore } from '../store/linkStore';
import { useCategoryStore } from '../store/categoryStore';

export function NewsletterPage() {
  const { links } = useLinkStore();
  const { topics } = useCategoryStore();
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [includeImages, setIncludeImages] = useState(false);

  const toggleLink = (id: string) => {
    const newSelected = new Set(selectedLinks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLinks(newSelected);
  };

  const formatForCopy = () => {
    const selectedItems = links.filter(link => selectedLinks.has(link.id));
    
    return selectedItems.map(link => {
      const topicNames = (link.topic_ids || [])
        .map(id => topics.find(t => t.id === id)?.name)
        .filter(Boolean)
        .join(', ');

      let content = '<div style="margin-bottom: 30px;">\n';

      // Add image if enabled and available
      if (includeImages && link.thumbnail_url) {
        content += `  <img src="${link.thumbnail_url}" alt="${link.title}" style="max-width: 100%; height: auto; margin-bottom: 15px;" />\n`;
      }

      // Add title with embedded link
      content += `  <h2 style="margin: 0 0 10px 0; font-size: 20px;"><a href="${link.url}" style="color: #2563eb; text-decoration: none;">${link.title}</a></h2>\n`;

      // Add description and topics
      content += `  <p style="margin: 0 0 10px 0; color: #4b5563;">${link.description}</p>\n`;
      
      if (topicNames) {
        content += `  <p style="margin: 0; font-size: 14px; color: #6b7280;">Topics: ${topicNames}</p>\n`;
      }
      
      content += '</div>\n';

      return content;
    }).join('\n');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatForCopy());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Newsletter Items</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <ImageIcon className="w-4 h-4" />
            Include images
          </label>
          <button
            onClick={copyToClipboard}
            disabled={selectedLinks.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Selected ({selectedLinks.size})
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {links.map((link) => (
          <div
            key={link.id}
            className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer ${
              selectedLinks.has(link.id) ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => toggleLink(link.id)}
          >
            <div className="p-3">
              <div className="flex items-start gap-3">
                {link.thumbnail_url && (
                  <img
                    src={link.thumbnail_url}
                    alt=""
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 hover:text-blue-600 flex items-center gap-1 group"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {link.title}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                      <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">
                        {link.description}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(link.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {(link.topic_ids || []).map((topicId) => {
                      const topic = topics.find((t) => t.id === topicId);
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
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}