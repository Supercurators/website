import { Link } from 'react-router-dom';
import { ArrowRight, Globe, BookOpen } from 'lucide-react';
import type { Supercuration } from '../../types';

interface DirectoryGridProps {
  supercurations: Supercuration[];
}

export function DirectoryGrid({ supercurations }: DirectoryGridProps) {
  if (supercurations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
          <Globe className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No supercurations found</h3>
        <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
      {supercurations.map((supercuration) => (
        <Link
          key={supercuration.id}
          to={`/s/${supercuration.slug}`}
          className="group bg-white rounded-md border border-gray-100 overflow-hidden hover:shadow-sm transition-all duration-300 flex flex-col h-full"
        >
          {supercuration.thumbnail_url ? (
            <div className="h-20 overflow-hidden">
              <img
                src={supercuration.thumbnail_url}
                alt=""
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="h-20 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white opacity-50" />
            </div>
          )}
          <div className="flex-1 p-1.5 flex flex-col">
            <h3 className="font-medium text-[11px] text-gray-900 group-hover:text-blue-600 transition-colors mb-0.5 line-clamp-2">
              {supercuration.title}
            </h3>
            <p className="text-[10px] text-gray-500 line-clamp-1 mb-1">
              {supercuration.description}
            </p>
            <div className="flex items-center gap-1 mt-auto">
              <img
                src={supercuration.user.avatar_url}
                alt={supercuration.user.name}
                className="w-3 h-3 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] text-gray-600 font-medium truncate block">
                  {supercuration.user.name}
                </span>
                <span className="text-[9px] text-gray-400">
                  {supercuration.links_count || 0} links
                </span>
              </div>
              <ArrowRight className="w-2.5 h-2.5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}