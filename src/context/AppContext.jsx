import React, { createContext, useContext, useMemo, useState } from 'react';
import { fetchMyChannel } from '../api/youtube';

const AppContext = createContext(null);
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const YOUTUBE_SCOPES = 'https://www.googleapis.com/auth/youtube.force-ssl';

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In SDK.'));
    document.head.appendChild(script);
  });
}

export function AppProvider({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [userChannel, setUserChannel] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('youtube_clone_subscriptions') || '[]');
    } catch {
      return [];
    }
  });

  async function signInWithGoogle() {
    if (!GOOGLE_CLIENT_ID) {
      setAuthError('Missing VITE_GOOGLE_CLIENT_ID in .env');
      return;
    }

    setIsAuthLoading(true);
    setAuthError('');

    try {
      await loadGoogleScript();

      await new Promise((resolve, reject) => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: YOUTUBE_SCOPES,
          callback: async (response) => {
            if (response.error || !response.access_token) {
              reject(new Error(response.error || 'Google login failed.'));
              return;
            }

            setAccessToken(response.access_token);

            try {
              const channel = await fetchMyChannel(response.access_token);
              setUserChannel(channel);
              resolve();
            } catch (channelError) {
              reject(channelError);
            }
          }
        });

        client.requestAccessToken({ prompt: 'consent' });
      });
    } catch (error) {
      setAuthError(error.message || 'Failed to sign in.');
    } finally {
      setIsAuthLoading(false);
    }
  }

  function signOut() {
    if (accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(accessToken);
    }

    setAccessToken('');
    setUserChannel(null);
    setAuthError('');
  }

  function toggleSubscription(channel) {
    if (!channel?.id) return;
    setSubscriptions((prev) => {
      const exists = prev.some((item) => item.id === channel.id);
      const next = exists ? prev.filter((item) => item.id !== channel.id) : [channel, ...prev];
      localStorage.setItem('youtube_clone_subscriptions', JSON.stringify(next));
      return next;
    });
  }

  function isSubscribed(channelId) {
    return subscriptions.some((item) => item.id === channelId);
  }

  const value = useMemo(
    () => ({
      isSidebarOpen,
      setIsSidebarOpen,
      searchQuery,
      setSearchQuery,
      searchResults,
      setSearchResults,
      selectedVideo,
      setSelectedVideo,
      accessToken,
      userChannel,
      isAuthLoading,
      authError,
      signInWithGoogle,
      signOut,
      subscriptions,
      toggleSubscription,
      isSubscribed
    }),
    [
      isSidebarOpen,
      searchQuery,
      searchResults,
      selectedVideo,
      accessToken,
      userChannel,
      isAuthLoading,
      authError,
      subscriptions
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider');
  }

  return context;
}
