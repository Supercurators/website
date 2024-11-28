import { Star } from 'lucide-react';

interface PreviewModalProps {
  onShare: (isOriginal: boolean) => void;
}

export function PreviewModal({ onShare }: PreviewModalProps) {
  return (
    <div className="mb-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="font-medium text-amber-800 mb-2">Content Type</h4>
        <p className="text-sm text-amber-700 mb-4">
          Is this content created by you? (e.g., your blog post, podcast, video)
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => onShare(true)}
            className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4" />
            Yes, I created this
          </button>
          <button
            onClick={() => onShare(false)}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            No, sharing from elsewhere
          </button>
        </div>
      </div>
    </div>
  );
}