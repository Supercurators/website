import { useState, useEffect } from 'react';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { Mail, Download } from 'lucide-react';
import type { Subscription } from '../types';

export function DashboardPage() {
  const { fetchSubscribers } = useSubscriptionStore();
  const [subscribers, setSubscribers] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubscribers = async () => {
      try {
        setLoading(true);
        const data = await fetchSubscribers();
        setSubscribers(data);
      } finally {
        setLoading(false);
      }
    };

    loadSubscribers();
  }, [fetchSubscribers]);

  const exportToCSV = () => {
    // Prepare CSV content
    const headers = ['Name', 'Email', 'Subscribed Date'].join(',');
    const rows = subscribers.map(sub => [
      sub.subscriber_name,
      sub.subscriber_email,
      new Date(sub.created_at).toLocaleDateString()
    ].join(','));

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `subscribers-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscriber Dashboard</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-5 h-5" />
            <span className="font-medium">{subscribers.length} Subscribers</span>
          </div>
        </div>

        <div className="divide-y">
          {subscribers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No subscribers yet
            </div>
          ) : (
            subscribers.map((sub) => (
              <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <h3 className="font-medium">{sub.subscriber_name}</h3>
                  <p className="text-sm text-gray-500">{sub.subscriber_email}</p>
                </div>
                <div className="text-sm text-gray-400">
                  Subscribed {new Date(sub.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}