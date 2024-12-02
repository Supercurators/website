import { Globe } from 'lucide-react';
import { NewsletterSignup } from '../NewsletterSignup';

export function DirectoryHeader() {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl font-bold mb-6">
              Discover Amazing Supercurations
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Explore curated collections of the best resources, handpicked by experts and enthusiasts across various topics.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Globe className="w-4 h-4" />
              <span>{new Date().toLocaleDateString()} • Updated daily</span>
            </div>
          </div>
          <div className="lg:pl-12">
            <NewsletterSignup 
              title="Never miss new supercurations"
              description="Get weekly updates about the best new curated collections"
            />
          </div>
        </div>
      </div>
    </div>
  );
}