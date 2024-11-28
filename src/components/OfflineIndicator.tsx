import { WifiOff } from 'lucide-react';
import { useLinkStore } from '../store/linkStore';

export function OfflineIndicator() {
  const isOffline = useLinkStore(state => state.isOffline);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">You are offline</span>
    </div>
  );
}