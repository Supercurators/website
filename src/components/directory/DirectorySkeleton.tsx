export function DirectorySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
      {[...Array(24)].map((_, i) => (
        <div key={i} className="bg-white rounded-md border border-gray-100 overflow-hidden animate-pulse flex flex-col">
          <div className="h-20 bg-gray-200" />
          <div className="p-1.5">
            <div className="h-2.5 w-3/4 bg-gray-200 rounded mb-1" />
            <div className="h-2 w-full bg-gray-200 rounded mb-1" />
            <div className="h-2 w-2/3 bg-gray-200 rounded mb-1.5" />
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-1.5 w-12 bg-gray-200 rounded mb-0.5" />
                <div className="h-1.5 w-10 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}