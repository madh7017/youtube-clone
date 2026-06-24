import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { searchVideos } from '../api/youtube';
import ErrorMessage from '../components/common/ErrorMessage';
import FilterChips from '../components/common/FilterChips';
import VideoGrid from '../components/video/VideoGrid';
import VideoGridSkeleton from '../components/video/VideoGridSkeleton';
import { useAppContext } from '../context/AppContext';

const SEARCH_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'Short', value: 'short' },
  { label: 'Long', value: 'long' },
  { label: 'Views', value: 'views' }
];

function mapFilterToApi(activeFilter) {
  if (activeFilter === 'today' || activeFilter === 'week' || activeFilter === 'month') {
    return { uploadDate: activeFilter, order: 'date' };
  }
  if (activeFilter === 'short') return { videoDuration: 'short' };
  if (activeFilter === 'long') return { videoDuration: 'long' };
  if (activeFilter === 'views') return { order: 'viewCount' };
  return {};
}

function SearchResultsPage() {
  const location = useLocation();
  const { searchResults, setSearchResults, setSearchQuery } = useAppContext();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [nextPageToken, setNextPageToken] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const sentinelRef = useRef(null);

  const query = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('q') || '';
  }, [location.search]);

  const runSearch = useCallback(async (pageToken = '', append = false, selectedFilter = activeFilter) => {
    if (!query.trim()) {
      setSearchResults([]);
      setNextPageToken('');
      return;
    }

    try {
      setError('');
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const data = await searchVideos(query, pageToken, mapFilterToApi(selectedFilter));
      setSearchResults((prev) => (append ? [...prev, ...(data.items || [])] : data.items || []));
      setNextPageToken(data.nextPageToken || '');
    } catch (requestError) {
      setError(requestError.message || 'Search failed.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [query, setSearchResults, activeFilter]);

  useEffect(() => {
    setSearchQuery(query);
    runSearch('', false, activeFilter);
  }, [query, activeFilter, setSearchQuery, runSearch]);

  useEffect(() => {
    if (!nextPageToken || isLoading || isLoadingMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          runSearch(nextPageToken, true, activeFilter);
        }
      },
      { rootMargin: '300px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [nextPageToken, isLoading, isLoadingMore, runSearch, activeFilter]);

  if (error && isLoading) {
    return <ErrorMessage message={error} onRetry={() => runSearch('', false, activeFilter)} />;
  }

  return (
    <div className="page-wrap">
      <FilterChips chips={SEARCH_FILTERS} active={activeFilter} onChange={setActiveFilter} />
      <h1 className="page-title">Search Results {query ? `for "${query}"` : ''}</h1>
      {isLoading ? (
        <VideoGridSkeleton count={8} />
      ) : (
        <VideoGrid
          videos={searchResults}
          emptyMessage={query ? 'No videos match your search.' : 'Enter something in search to begin.'}
        />
      )}
      {error && !isLoading ? <ErrorMessage message={error} onRetry={() => runSearch('', false, activeFilter)} /> : null}
      {nextPageToken ? (
        <div className="infinite-trigger-wrap">
          <div ref={sentinelRef} className="infinite-trigger" />
          {isLoadingMore ? <p className="infinite-status">Loading more results...</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export default SearchResultsPage;
