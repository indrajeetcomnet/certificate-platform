import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout({ children, onSearch }) {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();

  // If not authenticated, immediately redirect away from internal workspace
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Certificate Studio route: Remove website sidebar completely, give 100% width/height to certificate
  const isStudioRoute =
    location.pathname.startsWith('/certificates/create') ||
    location.pathname.startsWith('/certificates/designer') ||
    location.pathname.startsWith('/certificates/edit');

  if (isStudioRoute) {
    return (
      <div className="h-screen w-screen bg-[#F4F4F0] text-stone-900 flex flex-col overflow-hidden">
        <main className="flex-1 w-full h-full flex flex-col overflow-hidden min-h-0">
          {children || <Outlet />}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F5] text-stone-900 flex">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onSearch={onSearch} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 md:pb-8">
          {children || <Outlet />}
        </main>

        {/* Mobile Navigation bar at bottom */}
        <MobileNav />
      </div>
    </div>
  );
}
