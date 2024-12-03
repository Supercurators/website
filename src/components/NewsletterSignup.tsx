import { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface NewsletterSignupProps {
  title: string;
  description: string;
  supercurationId?: string;
}

export function NewsletterSignup({ title, description, supercurationId }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !supercurationId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Update the supercuration document
      const supercurationRef = doc(db, 'supercurations', supercurationId);
      await updateDoc(supercurationRef, {
        subscribers: arrayUnion(email)
      });

      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('Error subscribing:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-gray-300 mb-4">{description}</p>
      
      {success ? (
        <div className="text-green-400">
          Thanks for subscribing! You'll receive updates when new resources are added.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      )}
    </div>
  );
}