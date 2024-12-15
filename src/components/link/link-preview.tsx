import { useState, useEffect } from 'react';
import { LinkIcon, Loader } from 'lucide-react';
import { getLinkPreview } from '../../lib/linkPreview';

interface LinkPreviewInputProps {
  onShare: (data: {
    url: string;
    title: string;
    description: string;
    thumbnail_url?: string;
  }) => void;
  onCancel?: () => void;
}

export function LinkPreviewInput({ onShare }: LinkPreviewInputProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    title: string;
    description: string;
    thumbnail_url?: string;
  } | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!url.trim()) {
        setPreview(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getLinkPreview(url);
        setPreview(data);
      } catch (err) {
        console.error('Error fetching preview:', err);
        setError('Failed to fetch link preview');
        setPreview(null);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the preview fetch
    const timer = setTimeout(fetchPreview, 500);
    return () => clearTimeout(timer);
  }, [url]);

  const handleShare = () => {
    if (!url.trim() || !preview) return;
    onShare({
      url: url.trim(),
      ...preview
    });
    setUrl('');
    setPreview(null);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to share..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        <button
          onClick={handleShare}
          disabled={!url.trim() || loading || !preview}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Share
        </button>
      </div>

      {/* Preview Card */}
      {(loading || preview) && (
        <div className="mt-4 border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-4 flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          ) : preview && (
            <div className="flex gap-4 p-4">
              {preview.thumbnail_url && (
                <img
                  src={preview.thumbnail_url}
                  alt=""
                  className="w-24 h-24 rounded object-cover flex-shrink-0"
                />
              )}
              <div>
                <h3 className="font-medium">{preview.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {preview.description}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}