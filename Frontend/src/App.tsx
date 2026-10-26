import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { initializeAuth, clearAuth } from './store/authSlice';
import { setOnUnauthorized } from './services/api/client';
import { connectSocket, disconnectSocket, joinUserRoom, onNotification } from './services/socket/socket.service';
import { addNotification } from './store/notificationSlice';
import type { Notification } from './types';

import { Navbar } from './components/layout/Navbar';
import { LoadingPage, ToastContainer } from './components/common';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const AuctionListPage = lazy(() => import('./pages/auction/AuctionListPage'));
const AuctionDetailPage = lazy(() => import('./pages/auction/AuctionDetailPage'));
const SellerDashboard = lazy(() => import('./pages/seller/SellerDashboard'));
const CreateAuctionPage = lazy(() => import('./pages/seller/CreateAuctionPage'));
const BuyerDashboard = lazy(() => import('./pages/buyer/BuyerDashboard'));
const ProfilePage = lazy(() => import('./pages/buyer/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/buyer/NotificationsPage'));
const OrdersPage = lazy(() => import('./pages/buyer/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/buyer/OrderDetailPage'));
const WalletPage = lazy(() => import('./pages/buyer/WalletPage'));
const EditAuctionPage = lazy(() => import('./pages/seller/EditAuctionPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user, initialized } = useAppSelector(s => s.auth);
  if (!initialized) return <LoadingPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, initialized } = useAppSelector(s => s.auth);
  if (!initialized) return <LoadingPage />;
  if (user) {
    if (user.role === 'SELLER') return <Navigate to="/seller" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/buyer" replace />;
  }
  return <>{children}</>;
};

const AppShell = () => {
  const dispatch = useAppDispatch();
  const { user, initialized } = useAppSelector(s => s.auth);

  useEffect(() => {
    setOnUnauthorized(() => {
      dispatch(clearAuth());
    });
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();
    
    const joinUser = () => joinUserRoom(user.id);
    joinUser();
    socket.on('connect', joinUser);

    const cleanNotif = onNotification((data: Notification) => {
      dispatch(addNotification(data));
    });

    return () => {
      cleanNotif();
      socket.off('connect', joinUser);
      disconnectSocket();
    };
  }, [user, dispatch]);

  if (!initialized) return <LoadingPage />;

  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<LoadingPage />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auctions" element={<AuctionListPage />} />
            <Route path="/auctions/:id" element={<AuctionDetailPage />} />

            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
            <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            <Route path="/buyer" element={<ProtectedRoute roles={['BUYER']}><BuyerDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />

            <Route path="/seller" element={<ProtectedRoute roles={['SELLER', 'ADMIN']}><SellerDashboard /></ProtectedRoute>} />
            <Route path="/seller/create" element={<ProtectedRoute roles={['SELLER', 'ADMIN']}><CreateAuctionPage /></ProtectedRoute>} />
            <Route path="/seller/auctions/:id/edit" element={<ProtectedRoute roles={['SELLER', 'ADMIN']}><EditAuctionPage /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />

            <Route path="*" element={
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-center container-custom">
                <div className="text-8xl font-bold text-text-muted mb-4 tracking-tighter">404</div>
                <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
                <a href="/" className="btn btn-primary">Return Home</a>
              </div>
            } />
          </Routes>
        </Suspense>
      </main>
      <ToastContainer />
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
);

export default App;
