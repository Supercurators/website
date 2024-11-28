import { useState } from 'react';
import { Wand2, X, Check, Loader } from 'lucide-react';
import { useLinkStore } from '../store/linkStore';
import { analyzeContent } from '../lib/contentAnalyzer';
import type { Link, TagCategory } from '../types';

interface TagWizardProps {
  isOpen: boolean;
  onClose: () => void;
  supercurationId: string;
  links: Link[];
  tagCategories: TagCategory[];
}

export function TagWizard({ isOpen, onClose, supercurationId, links, tagCategories }: TagWizardProps) {
  const { updateLink } = useLinkStore();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<Record<string, string[]>>({});
  const [progress, setProgress] = useState(0);

  const analyzeLinks = async () => {
    setAnalyzing(true);
    setError(null);
    setProgress(0);

    try {
      const analyzed: Record<string, string[]> = {};
      let completed = 0;

      for (const link of links) {
        const matchedTags = await analyzeContent({
          title: link.title,
          description: link.description,
          tagCategories
        });

        analyzed[link.id] = matchedTags;
        completed++;
        setProgress((completed / links.length) * 100);
      }

      setSuggestedTags(analyzed);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze content');
    } finally {
      setAnalyzing(false);
    }
  };

  const applyTags = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all(
        Object.entries(suggestedTags).map(([linkId, tags]) =>
          updateLink(linkId, {
            supercuration_tags: {
              ...links.find(l => l.id === linkId)?.supercuration_tags,
              [supercurationId]: tags
            }
          })
        )
      );
      onClose();
    } catch (err) {
      console.error('Failed to apply tags:', err);
      setError('Failed to apply tags');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasMatchedTags = Object.values(suggestedTags).some(tags => tags.length > 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl transform rounded-lg bg-white p-6 shadow-xl">
          <div className="absolute right-4 top-4">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <Wand2 className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-900">Tag Wizard</h3>
          </div>

          {error && (
            <div className="p-4 mb-6 text-sm text-red-600 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          {analyzing ? (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Analyzing content...</p>
              <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto">
                <div 
                  className="h-full bg-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : Object.keys(suggestedTags).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-6">
                Tag Wizard will analyze your content and suggest appropriate tags based on your defined categories.
              </p>
              <button
                onClick={analyzeLinks}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Start Analysis
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
                {links.map((link) => {
                  const tags = suggestedTags[link.id] || [];
                  if (tags.length === 0) return null;

                  return (
                    <div key={link.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        {link.thumbnail_url && (
                          <img
                            src={link.thumbnail_url}
                            alt=""
                            className="w-16 h-16 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">{link.title}</h4>
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => {
                              const category = tagCategories.find(cat => 
                                cat.tags.includes(tag)
                              );
                              if (!category) return null;
                              return (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 text-sm rounded-full"
                                  style={{
                                    backgroundColor: `${category.color}15`,
                                    color: category.color
                                  }}
                                >
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}

                {!hasMatchedTags && (
                  <div className="text-center py-8 text-gray-500">
                    No matching tags found. Try adjusting your tag categories.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={applyTags}
                  disabled={loading || !hasMatchedTags}
                  className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  {loading ? 'Applying Tags...' : 'Apply Tags'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}