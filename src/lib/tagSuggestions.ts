import type { Supercuration, TagCategory } from '../types';

const COLORS = [
  '#2563eb', '#dc2626', '#059669', '#7c3aed', '#db2777',
  '#ea580c', '#ca8a04', '#4f46e5', '#0891b2', '#be123c'
];

interface SupercurationWithLinks extends Supercuration {
  links?: Array<{
    title: string;
    description: string;
  }>;
}

export async function suggestTagCategories(supercuration: SupercurationWithLinks): Promise<TagCategory[]> {
  // Analyze links in the supercuration
  const linkTitles = supercuration.links?.map(link => link.title) || [];
  const linkDescriptions = supercuration.links?.map(link => link.description) || [];

  // Simple keyword extraction (in a real app, use NLP or AI)
  const keywords = [...linkTitles, ...linkDescriptions].join(' ')
    .toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 3);

  // Count keyword frequencies
  const keywordFreq = keywords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get top keywords
  const topKeywords = Object.entries(keywordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word);

  // Create tag categories
  return [
    {
      id: 'topics',
      name: 'Topics',
      color: COLORS[0],
      tags: topKeywords.slice(0, 8)
    },
    {
      id: 'type',
      name: 'Content Type',
      color: COLORS[1],
      tags: ['Article', 'Tutorial', 'Video', 'Tool', 'Resource']
    },
    {
      id: 'level',
      name: 'Level',
      color: COLORS[2],
      tags: ['Beginner', 'Intermediate', 'Advanced']
    }
  ];
}