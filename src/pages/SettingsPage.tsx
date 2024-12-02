import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLinkStore } from '../store/linkStore';
import { useCategoryStore } from '../store/categoryStore';
import type { Link } from '../types';

export function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { links } = useLinkStore();
  const { topics } = useCategoryStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      setUser({
        ...user,
        ...formData,
        created_at: user.created_at
      });
    }
  };

  const sanitizeForCSV = (str: string): string => {
    if (!str) return '';
    // Escape quotes and remove newlines
    return str.replace(/"/g, '""').replace(/[\n\r]+/g, ' ');
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return '';
    }
  };

  const exportToCSV = () => {
    try {
      // Validate data
      if (!Array.isArray(links)) {
        throw new Error('No links available to export');
      }

      // Prepare headers
      const headers = [
        'Title',
        'URL',
        'Description',
        'Date Added',
        'Format',
        'Topics',
        'Likes'
      ].join(',');

      // Convert links to CSV rows with proper error handling
      const rows = links.map((link: Link) => {
        try {
          // Get topic names safely
          const topicNames = (link.topic_ids || [])
            .map(id => topics.find(t => t.id === id)?.name || '')
            .filter(Boolean)
            .join(';');

          // Prepare row data with sanitization
          const rowData = [
            sanitizeForCSV(link.title),
            sanitizeForCSV(link.url || ''),
            sanitizeForCSV(link.description),
            formatDate(link.created_at),
            (link.emoji_tags || []).join(';'),
            sanitizeForCSV(topicNames),
            link.likes || 0
          ];

          // Wrap strings in quotes and join with commas
          return rowData.map(field => 
            typeof field === 'string' ? `"${field}"` : field
          ).join(',');
        } catch (err) {
          console.error('Error processing link:', err);
          return ''; // Skip malformed rows
        }
      }).filter(Boolean); // Remove empty rows

      if (rows.length === 0) {
        throw new Error('No valid data to export');
      }

      // Create CSV content
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });

      // Download file
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      const fileName = `airparty-links-${new Date().toISOString().split('T')[0]}.csv`;

      downloadLink.href = url;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
      alert(error instanceof Error ? error.message : 'Failed to export data. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-xl font-bold mb-6">Profile Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Profile Picture
            </label>
            <div className="mt-2 flex items-center gap-4">
              <img
                src={formData.avatar_url}
                alt={formData.name}
                className="w-16 h-16 rounded-full"
              />
              <input
                type="url"
                placeholder="Avatar URL"
                className="flex-1 px-3 py-2 border rounded-md"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 border rounded-md"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="mt-1 block w-full px-3 py-2 border rounded-md"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              className="mt-1 block w-full px-3 py-2 border rounded-md"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 border rounded-md"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Website
            </label>
            <input
              type="url"
              className="mt-1 block w-full px-3 py-2 border rounded-md"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg p-6">
        <h2 className="text-xl font-bold mb-6">Data Export</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Export all your saved links and their data as a CSV file
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Includes titles, URLs, descriptions, tags, and other metadata
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}