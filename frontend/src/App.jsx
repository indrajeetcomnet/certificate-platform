import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import PostDetailPage from './pages/PostDetailPage';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import CertificatesPage from './pages/CertificatesPage';
import CertificateCreatePage from './pages/CertificateCreatePage';
import CertificateEditPage from './pages/CertificateEditPage';
import CertificateIssuePage from './pages/CertificateIssuePage';
import BulkCertificatesPage from './pages/BulkCertificatesPage';
import CertificateVerifyPage from './pages/CertificateVerifyPage';
import EarningsPage from './pages/EarningsPage';
import BadgesManagePage from './pages/BadgesManagePage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* 1. Public Standalone Pages (Full-Width, NO side menubar) */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} />

          {/* Public Direct Verification Portal (Accessed strictly via footer link / direct link / QR code) */}
          <Route path="/certificates/verify" element={<CertificateVerifyPage />} />
          <Route path="/certificates/verify/:code" element={<CertificateVerifyPage />} />
          <Route path="/verify" element={<CertificateVerifyPage />} />
          <Route path="/verify/:code" element={<CertificateVerifyPage />} />

          {/* 2. In-App Workspace Pages (Strictly Protected - Authenticated Users Only) */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="feed" element={<FeedPage />} />
            <Route path="feed/:postId" element={<PostDetailPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/:userId" element={<ProfilePage />} />
            <Route path="earnings" element={<EarningsPage />} />

            {/* Institution-Only Workspace Pages (Divided into dedicated full-window pages) */}
            <Route
              path="certificates"
              element={
                <ProtectedRoute requireRole="INSTITUTION">
                  <CertificatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="certificates/create"
              element={
                <ProtectedRoute requireRole="INSTITUTION">
                  <CertificateCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="certificates/designer"
              element={
                <ProtectedRoute requireRole="INSTITUTION">
                  <CertificateCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="certificates/edit/:id"
              element={
                <ProtectedRoute requireRole="INSTITUTION">
                  <CertificateEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="certificates/issue"
              element={
                <ProtectedRoute requireRole="INSTITUTION">
                  <CertificateIssuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="certificates/bulk"
              element={
                <ProtectedRoute requireRole="INSTITUTION">
                  <BulkCertificatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="badges/manage"
              element={
                <ProtectedRoute requireRole="INSTITUTION">
                  <BadgesManagePage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
