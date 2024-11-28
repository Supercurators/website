import { useState } from 'react';
import { X, Repeat } from 'lucide-react';
import type { Link } from '../types';

interface RepostModalProps {
  link: Link;
  onClose: () => void;
  onRepost: (note?: string) => Promise<void>;
}

export function RepostModal({ link, onClose, onRepost }: RepostModalProps) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onRepost(note.trim() || undefined);
    } catch (error) {
      console.error('Repost error:', error);
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

          <h3 className="text-lg font-medium text-gray-900 mb-6">Repost to Your Feed</h3>

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
                <p className="text-xs text-gray-400 mt-1">
                  Originally shared by {link.user?.name}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="What are your thoughts on this?"
              />
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Repeat className="w-4 h-4" />
                {loading ? 'Reposting...' : 'Repost'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}