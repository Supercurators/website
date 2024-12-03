export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-gray-600 mb-4">Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-600">
          Return to home
        </a>
      </div>
    </div>
  );
} 