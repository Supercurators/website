import { LinkIcon, CheckSquare, Square } from 'lucide-react';
import type { ExtractedLink } from '../types';

interface ExtractedLinkCardProps {
  link: ExtractedLink;
  onToggleSelect: () => void;
  onShare: () => void;
}

export function ExtractedLinkCard({
  link,
  onToggleSelect,
  onShare
}: ExtractedLinkCardProps) {
  return (
    <div 
      className={`bg-white p-4 rounded-lg border hover:shadow-md transition-shadow ${
        link.selected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex gap-4">
        <button
          onClick={onToggleSelect}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          {link.selected ? (
            <CheckSquare className="w-5 h-5" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>

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
                className="font-medium text-gray-900 hover:text-blue-600 flex items-center gap-1"
              >
                {link.title}
                <LinkIcon className="w-3.5 h-3.5" />
              </a>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {link.description}
              </p>
            </div>
            <button
              onClick={onShare}
              className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md hover:bg-blue-50"
            >
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}