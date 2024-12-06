import { ExternalLink, Heart, Star, Edit2, Trash2 } from 'lucide-react';
import { Link, TopicCategory } from '../../types';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

interface LinkDisplayProps {
  link: Link;
  topics: TopicCategory[];
  onToggleLike: (id: string) => void;
  onEdit: (link: Link) => void;
  onDelete: (id: string) => void;
  showUserInfo?: boolean;
  editable?: boolean;
}

export function LinkDisplay({ 
  link, 
  topics, 
  onToggleLike, 
  onEdit, 
  onDelete, 
  showUserInfo = false,
  editable = false
}: LinkDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden p-4">
      <div className="flex gap-4">
        {link.thumbnail_url && (
          <img
            src={link.thumbnail_url}
            alt=""
            className="w-24 h-24 rounded object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-900 hover:text-blue-600 block mb-1 break-all line-clamp-2"
              >
                {link.title.length > 100 ? `${link.title.slice(0, 100)}...` : link.title}
                <ExternalLink className="inline-block w-3.5 h-3.5 ml-1 opacity-50" />
              </a>
              <p className="text-sm text-gray-500 mb-2">
                {(() => {
                  const [isExpanded, setIsExpanded] = useState(false);
                  return link.description.length > 100 ? (
                    <span>
                      {isExpanded ? link.description : `${link.description.slice(0, 100)}...`}
                      <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-blue-600 hover:text-blue-700 ml-1"
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    </span>
                  ) : (
                    link.description
                  )
                })()}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {showUserInfo && (
                  <RouterLink
                    to={`/profile/${link.created_by}`}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    Shared by {editable ? 'you' : link.user?.name}
                  </RouterLink>
                )}
                <span className="text-gray-400">
                  {new Date(link.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onToggleLike(link.id)}
                  className={`flex items-center gap-1 ${
                    link.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${link.liked ? 'fill-current' : ''}`} />
                  <span>{link.likes}</span>
                </button>
                {link.is_original_content && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    ORIGINAL
                  </span>
                )}
              </div>
            </div>
            {editable && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(link)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Edit link"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(link.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {link.emoji_tags?.map((emoji) => (
              <span key={emoji} className="text-lg">
                {emoji}
              </span>
            ))}
            {link.topic_ids?.map((topicId) => {
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
  );
}
