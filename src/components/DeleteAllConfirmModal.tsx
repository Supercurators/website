import { X, AlertTriangle } from 'lucide-react';

interface DeleteAllConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteAllConfirmModal({ isOpen, onClose, onConfirm, isDeleting }: DeleteAllConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative w-full max-w-sm transform rounded-lg bg-white p-6 shadow-xl">
          <div className="absolute right-4 top-4">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            <h3 className="text-lg font-medium">Delete All Posts</h3>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete all your posts? This action cannot be undone and will permanently remove all your shared links.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}