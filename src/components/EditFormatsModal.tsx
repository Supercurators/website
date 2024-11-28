import { useState } from 'react';
import { X } from 'lucide-react';
import type { Link } from '../types';

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

interface EditFormatsModalProps {
  link: Link;
  onClose: () => void;
  onSave: (formats: string[]) => Promise<void>;
}

export function EditFormatsModal({ link, onClose, onSave }: EditFormatsModalProps) {
  const [selectedFormats, setSelectedFormats] = useState<string[]>(link.emoji_tags || []);
  const [loading, setLoading] = useState(false);

  const toggleFormat = (emoji: string) => {
    setSelectedFormats(prev =>
      prev.includes(emoji)
        ? prev.filter(e => e !== emoji)
        : [emoji] // Only allow one format at a time
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave(selectedFormats);
      onClose();
    } catch (error) {
      console.error('Failed to update formats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl">
          <div className="absolute right-4 top-4">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-6">Edit Format</h3>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-4">
              {link.thumbnail_url && (
                <img
                  src={link.thumbnail_url}
                  alt=""
                  className="w-24 h-24 rounded object-cover"
                />
              )}
              <div>
                <h4 className="font-medium text-gray-900">{link.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-2">{link.description}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => toggleFormat(emoji)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                      selectedFormats.includes(emoji)
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

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Format'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}