import { useEffect } from 'react';
import { Library } from 'lucide-react';
import { useSupercurationStore } from '../store/supercurationStore';
import { Link } from 'react-router-dom';

export function SupercurationSidebar() {
  const { supercurations, fetchSupercurations } = useSupercurationStore();

  useEffect(() => {
    fetchSupercurations();
  }, [fetchSupercurations]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <Library className="w-5 h-5 text-gray-400" />
        <h2 className="font-medium">My Supercurations</h2>
      </div>
      
      <div className="space-y-2">
        {supercurations.length === 0 ? (
          <p className="text-sm text-gray-500">No supercurations yet</p>
        ) : (
          supercurations.map(supercuration => (
            <Link
              key={supercuration.id}
              to={`/supercurations/${supercuration.id}`}
              className="block px-3 py-2 text-sm rounded-md hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900 truncate">
                {supercuration.title}
              </div>
              {supercuration.description && (
                <div className="text-gray-500 text-xs truncate mt-0.5">
                  {supercuration.description}
                </div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                {supercuration.links_count || 0} links
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}