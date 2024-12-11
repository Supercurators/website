import { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { UserAvatar } from './UserAvatar';

interface User {
  id: string;
  name: string;
  name_lower: string;
  avatar_url?: string;
}

interface UserSearchProps {
  onSelect: (user: User) => void;
  exclude?: string[];
}

export function UserSearch({ onSelect, exclude = [] }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (value: string) => {
    setSearchQuery(value);
    if (value.length < 1) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const usersRef = collection(db, 'users');
      const searchValue = value.toLowerCase();
      
      // Get all users and filter in memory for more flexible matching
      const snapshot = await getDocs(usersRef);
      const users = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data()
      } as User));

      // Filter users whose names contain the search value
      const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchValue) &&
        !exclude.includes(user.id)
      ).slice(0, 10); // Limit to 10 results for performance

      setResults(filteredUsers);
    } catch (err) {
      console.error('Error searching users:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search users..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      
      {isSearching && (
        <div className="absolute right-3 top-2.5">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onSelect(user);
                setSearchQuery('');
                setResults([]);
              }}
              className="w-full flex items-center gap-2 p-2 hover:bg-gray-50"
            >
              <UserAvatar user={user} className="w-8 h-8" />
              <span className="text-sm font-medium">{user.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 