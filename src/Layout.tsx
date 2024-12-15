import { Link, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, BookMarked, Library, Users } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { ProfileSettings } from './components/ProfileSettings';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const NavLinks = () => (
    <>
      <Link
        to="/saved"
        className={`flex items-center px-2 py-3 text-lg rounded-full transition-colors ${
          (isActive('/saved')|| isActive('/home'))
            ? 'font-bold'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
        onClick={() => setShowMobileMenu(false)}
      >
        <BookMarked className="w-6 h-6 mr-4" />
        My Feed
      </Link>

      <Link
        to="/supercurations"
        className={`flex items-center px-2 py-3 text-lg rounded-full transition-colors ${
          location.pathname.startsWith('/supercurations')
            ? 'font-bold'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
        onClick={() => setShowMobileMenu(false)}
      >
        <Library className="w-6 h-6 mr-4" />
        Supercurations
      </Link>

      <Link
        to="/dashboard"
        className={`flex items-center px-2 py-3 text-lg rounded-full transition-colors ${
          isActive('/dashboard')
            ? 'font-bold'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
        onClick={() => setShowMobileMenu(false)}
      >
        <Users className="w-6 h-6 mr-4" />
        My Subscribers
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-20 px-4">
        <div className="flex items-center justify-between h-full">
          <Link to="/home" className="flex items-center gap-2">
            <div className="text-blue-500 text-2xl">🔖</div>
            <span className="text-xl font-bold">Supercurators</span>
          </Link>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 text-gray-600"
          >
            {showMobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-10 bg-white pt-16">
          <div className="p-4">
            <nav className="space-y-1">
              <NavLinks />
            </nav>
            <div className="mt-4 pt-4 border-t">
              <div
                onClick={() => {
                  setShowProfileSettings(true);
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-3 p-2 rounded-full hover:bg-gray-50 cursor-pointer"
              >
                <img
                  src={user?.avatar_url}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user?.name}</p>
                  <p className="text-sm text-gray-500 truncate">@{user?.email.split('@')[0]}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 border-r border-gray-100">
        <div className="flex flex-col h-full px-4 py-4">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 px-2 mb-8">
            <div className="text-blue-500 text-2xl">🔖</div>
            <span className="text-xl font-bold">Supercurators</span>
          </Link>

          {/* Navigation */}
          <nav className="space-y-1">
            <NavLinks />
          </nav>

          {/* User Profile */}
          <div className="mt-auto">
            <div
              onClick={() => setShowProfileSettings(true)}
              className="w-full flex items-center gap-3 p-2 rounded-full hover:bg-gray-50 cursor-pointer"
            >
              <img
                src={user?.avatar_url}
                alt={user?.name}
                className="w-10 h-10 rounded-full bg-gray-100"
              />
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-sm text-gray-500 truncate">@{user?.email.split('@')[0]}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-64 pt-20 lg:pt-4">
        <div className="max-w-2xl mx-auto py-4">
          {children}
        </div>
      </main>

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettings 
          onClose={() => setShowProfileSettings(false)} 
          onSave={() => setShowProfileSettings(false)}
        />
      )}
    </div>
  );
}