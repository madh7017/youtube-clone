import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { searchVideos } from '../../api/youtube';
import { useAppContext } from '../../context/AppContext';
import useDebounce from '../../hooks/useDebounce';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    searchQuery,
    setSearchQuery,
    setSearchResults,
    userChannel,
    isAuthLoading,
    authError,
    signInWithGoogle,
    signOut
  } = useAppContext();

  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    let active = true;

    async function runQuickSearch() {
      if (location.pathname !== '/search') {
        return;
      }

      if (!debouncedQuery.trim()) {
        if (active) {
          setSearchResults([]);
        }
        return;
      }

      try {
        setIsSearching(true);
        const data = await searchVideos(debouncedQuery);
        if (active) {
          setSearchResults(data.items || []);
        }
      } catch {
        if (active) {
          setSearchResults([]);
        }
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }

    runQuickSearch();

    return () => {
      active = false;
    };
  }, [debouncedQuery, location.pathname, setSearchResults]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="icon-button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <span />
          <span />
          <span />
        </button>
        <Link to="/" className="brand-link">
          <div className="brand-play-icon" />
          <span>YouView</span>
        </Link>
      </div>

      <form className="search-form" onSubmit={handleSubmit}>
        <input
          type="search"
          placeholder="Search videos"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label="Search videos"
        />
        <button type="submit" aria-label="Search">
          Search
        </button>
      </form>

      <div className="header-right">
        {isSearching ? <span className="searching-state">Searching...</span> : null}
        {authError ? <span className="auth-error">{authError}</span> : null}
        {!userChannel ? (
          <button className="login-button" onClick={signInWithGoogle} disabled={isAuthLoading} type="button">
            {isAuthLoading ? 'Signing in...' : 'Sign in'}
          </button>
        ) : (
          <div className="profile-wrap">
            <img
              className="profile-avatar"
              src={userChannel.snippet?.thumbnails?.default?.url}
              alt={userChannel.snippet?.title || 'Profile'}
            />
            <button className="profile-button" aria-label="Sign out" onClick={signOut} type="button">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
