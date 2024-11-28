export function semanticAnalyzer(text: string): string[] {
  const concepts: Record<string, string[]> = {
    'development': ['code', 'programming', 'software', 'development', 'developer'],
    'design': ['design', 'ui', 'ux', 'interface', 'visual'],
    'data': ['database', 'sql', 'analytics', 'visualization', 'storage'],
    'cloud': ['aws', 'azure', 'cloud', 'serverless', 'hosting'],
    'security': ['security', 'authentication', 'encryption', 'protection'],
    'mobile': ['mobile', 'ios', 'android', 'app', 'responsive'],
    'web': ['frontend', 'backend', 'fullstack', 'web', 'browser'],
    'ai': ['machine learning', 'artificial intelligence', 'neural', 'deep learning'],
    'devops': ['deployment', 'pipeline', 'ci/cd', 'automation'],
    'testing': ['testing', 'quality', 'qa', 'test', 'automation']
  };

  const matches: Set<string> = new Set();

  // Find concept matches
  Object.entries(concepts).forEach(([concept, terms]) => {
    if (terms.some(term => text.toLowerCase().includes(term))) {
      matches.add(concept);
      // Add related terms
      terms.forEach(term => {
        if (text.toLowerCase().includes(term)) {
          matches.add(term);
        }
      });
    }
  });

  // Find technical terms
  const technicalTerms = [
    'api', 'rest', 'graphql', 'docker', 'kubernetes', 'react', 'vue', 'angular',
    'node', 'python', 'javascript', 'typescript', 'java', 'golang', 'rust',
    'microservices', 'serverless', 'redis', 'postgresql', 'mongodb'
  ];

  technicalTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) {
      matches.add(term);
    }
  });

  return Array.from(matches);
}