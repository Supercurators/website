import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { DirectoryHeader } from '../components/directory/DirectoryHeader';
import { DirectoryGrid } from '../components/directory/DirectoryGrid';
import { DirectorySkeleton } from '../components/directory/DirectorySkeleton';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Supercuration } from '../types';

export function PublicDirectoryPage() {
  const [supercurations, setSupercurations] = useState<Supercuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchSupercurations = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'supercurations'),
          where('is_public', '==', true)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Supercuration[];
        setSupercurations(data);
      } catch (error) {
        console.error('Error fetching supercurations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupercurations();
  }, []);

  const filteredSupercurations = supercurations.filter(s => {
    const matchesSearch = !searchQuery || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      s.topics?.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Discover Amazing Supercurations | Supercurators</title>
        <meta 
          name="description" 
          content="Explore curated collections of the best resources, handpicked by experts and enthusiasts across various topics." 
        />
      </Helmet>

      <DirectoryHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Focus</h3>
                <div className="space-y-1">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-gray-900 text-white font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <DirectorySkeleton />
            ) : (
              <div className="transition-all duration-300">
                <DirectoryGrid supercurations={filteredSupercurations} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const CATEGORIES = [
  { id: 'generaliste', name: 'Généraliste' },
  { id: 'tech-politique', name: 'Tech & Politique' },
  { id: 'tech-social', name: 'Tech & Social' },
  { id: 'tech-retail', name: 'Tech & Retail' },
  { id: 'ia', name: 'IA' },
  { id: 'silicon-valley', name: 'Silicon Valley' },
  { id: 'ia-audio-video', name: 'IA Audio/Video' },
  { id: 'strategie-innovation', name: 'Stratégie & Innovation' },
  { id: 'futur-of-work', name: 'Futur of Work' },
  { id: 'creator-economy', name: 'Creator Economy' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'tourisme', name: 'Tourisme' },
  { id: 'product-management', name: 'Product Management' },
  { id: 'growth', name: 'Growth' },
  { id: 'medias', name: 'Médias' },
  { id: 'dystopie', name: 'Dystopie' },
  { id: 'culturetech', name: 'CultureTech' },
  { id: 'chine', name: 'Chine' },
  { id: 'us', name: 'US' },
  { id: 'neuroscience', name: 'Neuroscience' }
];