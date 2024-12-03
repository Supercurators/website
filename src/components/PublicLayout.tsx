import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="">
        <Outlet />
      </main>
    </div>
  );
} 