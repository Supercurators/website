import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { initFirebase } from './lib/firebase';
import { useAuthStore } from './store/authStore';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedLayout } from './components/layout/ProtectedLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { SavedPage } from './pages/SavedPage';
import { ProfilePage } from './pages/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { SupercurationsPage } from './pages/SupercurationsPage';
import { NewSupercurationPage } from './pages/NewSupercurationPage';
import { SupercurationDetailPage } from './pages/SupercurationDetailPage';
import { PublicSupercurationPage } from './pages/PublicSupercurationPage';
import { PublicDirectoryPage } from './pages/PublicDirectoryPage';
import { PublicLayout } from './components/layout/PublicLayout';
import { NotFoundPage } from './pages/NotFoundPage';
import { Toaster } from 'react-hot-toast';

export function App() {
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        if (mounted) {
          const success = await initFirebase();
          if (success && mounted) {
            await initialize();
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [initialize]);

  return (
    <>
      <Toaster position="top-right" />
      <HelmetProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/directory" element={<PublicDirectoryPage />} />
              <Route path="/supercurations/public/:slug" element={<PublicSupercurationPage />} />
              <Route path="/" element={<LandingPage />} />
            </Route>

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/supercurations" element={<SupercurationsPage />} />
              <Route path="/supercurations/new" element={<NewSupercurationPage />} />
              <Route path="/supercurations/:id" element={<SupercurationDetailPage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </HelmetProvider>
    </>
  );
}