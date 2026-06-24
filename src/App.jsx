import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Loader from './components/common/Loader';

const HomePage = lazy(() => import('./pages/HomePage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const WatchPage = lazy(() => import('./pages/WatchPage'));
const ChannelPage = lazy(() => import('./pages/ChannelPage'));
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage'));

function App() {
  return (
    <AppLayout>
      <Suspense fallback={<Loader message="Loading page..." />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/watch/:videoId" element={<WatchPage />} />
          <Route path="/channel/:channelId" element={<ChannelPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

export default App;
