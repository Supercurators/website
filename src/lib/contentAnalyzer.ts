import { keywordExtractor } from './keywordExtractor';
import { semanticAnalyzer } from './semanticAnalyzer';
import type { TagCategory } from '../types';

interface AnalyzeContentParams {
  title: string;
  description: string;
  tagCategories: TagCategory[];
}

export async function analyzeContent({ title, description, tagCategories }: AnalyzeContentParams): Promise<string[]> {
  const content = `${title} ${description}`.toLowerCase();
  const suggestedTags: string[] = [];

  // Extract keywords from content
  const keywords = keywordExtractor(content);
  
  // Get semantic matches
  const semanticMatches = semanticAnalyzer(content);

  // For each category, find matching tags using multiple strategies
  for (const category of tagCategories) {
    for (const tag of category.tags) {
      const tagLower = tag.toLowerCase();
      
      // Strategy 1: Direct matches
      if (content.includes(tagLower)) {
        suggestedTags.push(tag);
        continue;
      }

      // Strategy 2: Word boundary matches with fuzzy matching
      const tagWords = tagLower.split(/\s+/);
      if (tagWords.length > 1) {
        const matchesAllWords = tagWords.every(word => {
          // Allow for partial word matches (e.g., "resume" matches "resume builder")
          const regex = new RegExp(`\\b${word}|${word}s?\\b`, 'i');
          return regex.test(content);
        });

        if (matchesAllWords) {
          suggestedTags.push(tag);
          continue;
        }
      }

      // Strategy 3: Keyword matches with synonyms
      const keywordMatches = keywords.some(keyword => {
        const relatedTerms = getRelatedTerms(tag);
        return relatedTerms.some(term => {
          // Use fuzzy matching for keywords
          const termParts = term.split(/\s+/);
          return termParts.every(part => {
            const regex = new RegExp(`\\b${part}|${part}s?\\b`, 'i');
            return regex.test(keyword);
          });
        });
      });

      if (keywordMatches) {
        suggestedTags.push(tag);
        continue;
      }

      // Strategy 4: Semantic matches with context
      if (semanticMatches.some(match => {
        const relatedTerms = getRelatedTerms(tag);
        return relatedTerms.some(term => {
          // Use fuzzy matching for semantic matches
          const termParts = term.split(/\s+/);
          return termParts.every(part => {
            const regex = new RegExp(`\\b${part}|${part}s?\\b`, 'i');
            return regex.test(match);
          });
        });
      })) {
        suggestedTags.push(tag);
        continue;
      }

      // Strategy 5: Context-based matches with improved patterns
      if (matchesContext(tag, content)) {
        suggestedTags.push(tag);
      }
    }
  }

  // Remove duplicates and return
  return [...new Set(suggestedTags)];
}

function matchesContext(tag: string, content: string): boolean {
  const contextMap: Record<string, string[]> = {
    'Resume Builder': [
      'resume', 'cv', 'curriculum vitae', 'job application', 'career document',
      'professional profile', 'work history', 'employment history', 'job seeker',
      'career builder', 'resume template', 'resume writing', 'resume generator',
      'resume creator', 'resume maker', 'resume editor', 'resume assistant'
    ],
    'Tutorial': ['learn', 'guide', 'how to', 'step by step', 'tutorial', 'course', 'lesson'],
    'Documentation': ['docs', 'reference', 'manual', 'guide', 'documentation'],
    'Tool': ['tool', 'utility', 'software', 'app', 'application', 'platform'],
    'Library': ['library', 'framework', 'package', 'dependency', 'module'],
    'API': ['api', 'endpoint', 'service', 'rest', 'graphql', 'interface'],
    'Resource': ['resource', 'asset', 'material', 'download', 'template'],
    'Article': ['article', 'post', 'blog', 'story', 'news', 'update'],
    'Video': ['video', 'watch', 'youtube', 'stream', 'tutorial', 'presentation'],
    'Podcast': ['podcast', 'audio', 'listen', 'episode', 'show', 'radio'],
    'Book': ['book', 'ebook', 'read', 'publication', 'guide', 'manual'],
    'Course': ['course', 'class', 'training', 'workshop', 'bootcamp'],
    'Community': ['community', 'forum', 'group', 'network', 'chat'],
    'Event': ['event', 'conference', 'meetup', 'webinar', 'workshop'],
    'Project': ['project', 'repository', 'demo', 'example', 'sample'],
    'Research': ['research', 'paper', 'study', 'analysis', 'report'],
  };

  const contextTerms = contextMap[tag] || [];
  return contextTerms.some(term => {
    const termParts = term.split(/\s+/);
    return termParts.every(part => {
      const regex = new RegExp(`\\b${part}|${part}s?\\b`, 'i');
      return regex.test(content);
    });
  });
}

function getRelatedTerms(tag: string): string[] {
  const relatedTermsMap: Record<string, string[]> = {
    'Resume Builder': [
      'resume', 'cv', 'curriculum vitae', 'job application', 'career document',
      'professional profile', 'work history', 'employment history', 'job seeker',
      'career builder', 'resume template', 'resume writing', 'resume generator',
      'resume creator', 'resume maker', 'resume editor', 'resume assistant',
      'career profile', 'professional summary', 'skills section', 'experience section',
      'job history', 'employment record', 'qualifications', 'achievements'
    ],
    'AI': [
      'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'neural network',
      'nlp', 'computer vision', 'ai model', 'training data', 'inference', 'prediction',
      'classification', 'clustering', 'regression', 'transformer', 'gpt', 'bert'
    ],
    'Frontend': [
      'react', 'vue', 'angular', 'javascript', 'typescript', 'css', 'html', 'web', 'ui',
      'component', 'responsive', 'mobile', 'browser', 'dom', 'spa', 'webpack', 'vite'
    ],
    'Backend': [
      'server', 'api', 'database', 'node', 'python', 'java', 'rest', 'graphql', 'microservice',
      'authentication', 'authorization', 'cache', 'queue', 'worker', 'cron', 'webhook'
    ],
    'DevOps': [
      'deployment', 'ci/cd', 'pipeline', 'docker', 'kubernetes', 'container', 'orchestration',
      'monitoring', 'logging', 'scaling', 'infrastructure', 'cloud', 'aws', 'azure', 'gcp'
    ],
    'Security': [
      'authentication', 'authorization', 'encryption', 'security', 'vulnerability', 'penetration',
      'firewall', 'ssl', 'certificate', 'token', 'jwt', 'oauth', 'compliance', 'audit'
    ],
    'Mobile': [
      'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin', 'mobile app',
      'responsive', 'pwa', 'notification', 'offline', 'native', 'hybrid'
    ],
    'Database': [
      'sql', 'nosql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
      'query', 'index', 'schema', 'migration', 'orm', 'acid', 'transaction'
    ],
    'Testing': [
      'test', 'unit test', 'integration test', 'e2e', 'qa', 'quality', 'automation',
      'jest', 'cypress', 'selenium', 'mock', 'stub', 'assertion', 'coverage'
    ],
    'Performance': [
      'optimization', 'speed', 'latency', 'throughput', 'benchmark', 'profiling',
      'memory', 'cpu', 'cache', 'lazy loading', 'compression', 'minification'
    ],
    'Design': [
      'ui', 'ux', 'user interface', 'user experience', 'wireframe', 'prototype',
      'mockup', 'figma', 'sketch', 'adobe xd', 'responsive', 'accessibility'
    ],
    'Analytics': [
      'metrics', 'tracking', 'analytics', 'dashboard', 'report', 'visualization',
      'data', 'insight', 'conversion', 'funnel', 'segment', 'attribution'
    ],
    'Marketing': [
      'seo', 'growth', 'marketing', 'advertising', 'promotion', 'campaign',
      'social media', 'email', 'content', 'landing page', 'conversion', 'ab testing'
    ],
    'Business': [
      'startup', 'entrepreneur', 'business', 'strategy', 'management', 'leadership',
      'product', 'market', 'customer', 'revenue', 'growth', 'investment'
    ],
    'Career': [
      'job', 'interview', 'resume', 'hiring', 'career', 'skill', 'learning',
      'mentor', 'networking', 'remote', 'salary', 'promotion', 'leadership'
    ]
  };

  return relatedTermsMap[tag] || [];
}