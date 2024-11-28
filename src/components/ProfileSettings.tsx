import { useState, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ProfileSettingsProps {
  onClose: () => void;
  onSave: () => void;
}

export function ProfileSettings({ onClose, onSave }: ProfileSettingsProps) {
  const { user, updateProfile, error } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    avatar_url: user?.avatar_url || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || ''
  });
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatar_url: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      await updateProfile(formData);
      onSave();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-8">
              <button onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold">Edit profile</h2>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-1.5 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>

          <form className="p-4 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            
            {/* Avatar */}
            <div className="relative group">
              <div className="h-32 bg-gray-100 rounded-lg mb-16">
                <div className="absolute -bottom-16 left-4">
                  <div className="relative">
                    <img
                      src={formData.avatar_url}
                      alt={formData.name}
                      className="w-32 h-32 rounded-full border-4 border-white object-cover bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}