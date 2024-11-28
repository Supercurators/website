import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function LandingPage() {
  const user = useAuthStore((state) => state.user);

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="pt-6">
          <nav className="flex justify-end space-x-4">
            <Link
              to="/login"
              className="text-gray-300 hover:text-white px-4 py-2 text-sm font-medium"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="bg-white text-black hover:bg-gray-100 px-4 py-2 rounded-full text-sm font-medium"
            >
              Sign up
            </Link>
          </nav>
        </div>

        {/* Hero Section */}
        <div className="pt-24 pb-20 text-center">
          <div className="flex justify-center mb-6">
            <span className="text-6xl">🔖</span>
          </div>
          <h1 className="text-6xl sm:text-8xl font-extrabold text-white tracking-tight mb-8">
            Supercurators
          </h1>
          <p className="text-2xl sm:text-3xl text-gray-400 font-light max-w-3xl mx-auto mb-12">
            Internet. Curated.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-full text-black bg-white hover:bg-gray-100"
          >
            Get Started
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20 text-white">
          <div className="text-center px-6">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Discover Quality Content</h3>
            <p className="text-gray-400">
              Find the best content curated by people who share your interests
            </p>
          </div>
          <div className="text-center px-6">
            <div className="text-3xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold mb-2">Build Your Network</h3>
            <p className="text-gray-400">
              Connect with curators who consistently share valuable resources
            </p>
          </div>
          <div className="text-center px-6">
            <div className="text-3xl mb-4">💡</div>
            <h3 className="text-xl font-semibold mb-2">Stay Informed</h3>
            <p className="text-gray-400">
              Never miss important content with personalized email updates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}