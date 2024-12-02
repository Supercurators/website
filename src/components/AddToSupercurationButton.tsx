import { useState, useEffect } from 'react';
import { FolderPlus, X, Check, Plus } from 'lucide-react';
import { useSupercurationStore } from '../store/supercurationStore';
import { useLinkStore } from '../store/linkStore';
import type { Link } from '../types';

interface AddToSupercurationButtonProps {
  link: Link;
}

export function AddToSupercurationButton({ link }: AddToSupercurationButtonProps) {
  const { supercurations, fetchSupercurations, addSupercuration } = useSupercurationStore();
  const { updateLink } = useLinkStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // Fetch supercurations when component mounts
  useEffect(() => {
    fetchSupercurations();
  }, [fetchSupercurations]);

  const handleAddToSupercuration = async (supercurationId: string) => {
    try {
      setLoading(true);
      const currentSupercurations = link.supercuration_ids || [];
      const isAlreadyAdded = currentSupercurations.includes(supercurationId);
      
      const updatedSupercurations = isAlreadyAdded
        ? currentSupercurations.filter(id => id !== supercurationId)
        : [...currentSupercurations, supercurationId];

      await updateLink(link.id, {
        supercuration_ids: updatedSupercurations
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update supercurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newTitle.trim()) return;

    try {
      setLoading(true);
      const newSupercuration = await addSupercuration({
        title: newTitle.trim(),
        description: '',
        topics: [],
        tagCategories: []
      });
      await handleAddToSupercuration(newSupercuration.id);
      setNewTitle('');
      setShowNewForm(false);
    } catch (error) {
      console.error('Failed to create supercuration:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        title="Add to Supercuration"
      >
        <FolderPlus className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-medium">Add to Supercuration</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowNewForm(false);
                  setNewTitle('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2">
              {/* Existing Supercurations List */}
              <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {supercurations.map((supercuration) => {
                  const isAdded = link.supercuration_ids?.includes(supercuration.id);
                  return (
                    <button
                      key={supercuration.id}
                      onClick={() => handleAddToSupercuration(supercuration.id)}
                      disabled={loading}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-md flex items-center justify-between gap-2"
                    >
                      <span className="flex-1 truncate">{supercuration.title}</span>
                      {isAdded && <Check className="w-4 h-4 text-green-500" />}
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t my-2" />

              {/* Create New Form */}
              {showNewForm ? (
                <div className="flex items-center gap-2 p-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="New supercuration name..."
                    className="flex-1 px-2 py-1 text-sm border rounded"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateNew}
                    disabled={!newTitle.trim() || loading}
                    className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setShowNewForm(false);
                      setNewTitle('');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-gray-50 rounded-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Supercuration
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}