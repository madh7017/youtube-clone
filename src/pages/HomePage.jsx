import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchPopularVideosByCategory } from '../api/youtube';
import ErrorMessage from '../components/common/ErrorMessage';
import FilterChips from '../components/common/FilterChips';
import VideoGrid from '../components/video/VideoGrid';
import VideoGridSkeleton from '../components/video/VideoGridSkeleton';

const HOME_CHIPS = [
  { label: 'All', value: '' },
  { label: 'Music', value: '10' },
  { label: 'Gaming', value: '20' },
  { label: 'Sports', value: '17' },
  { label: 'News', value: '25' },
  { label: 'Learning', value: '27' }
];

function HomePage() {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [nextPageToken, setNextPageToken] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const sentinelRef = useRef(null);

  const activeChip = useMemo(() => categoryId, [categoryId]);

  const loadVideos = useCallback(async (pageToken = '', append = false, nextCategoryId = categoryId) => {
    try {
      setError('');
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const data = await fetchPopularVideosByCategory(pageToken, nextCategoryId);
      setVideos((prev) => (append ? [...prev, ...(data.items || [])] : data.items || []));
      setNextPageToken(data.nextPageToken || '');
    } catch (requestError) {
      setError(requestError.message || 'Failed to load videos.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadVideos('', false, categoryId);
  }, [categoryId, loadVideos]);

  useEffect(() => {
    if (!nextPageToken || isLoading || isLoadingMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadVideos(nextPageToken, true, categoryId);
        }
      },
      { rootMargin: '300px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [nextPageToken, isLoading, isLoadingMore, loadVideos, categoryId]);

  if (error && isLoading) {
    return <ErrorMessage message={error} onRetry={() => loadVideos('', false, categoryId)} />;
  }

  return (
    <div className="page-wrap">
      <FilterChips chips={HOME_CHIPS} active={activeChip} onChange={setCategoryId} />
      <h1 className="page-title">Recommended</h1>
      {isLoading ? <VideoGridSkeleton count={8} /> : <VideoGrid videos={videos} />}
      {error && !isLoading ? <ErrorMessage message={error} onRetry={() => loadVideos('', false, categoryId)} /> : null}
      {nextPageToken ? (
        <div className="infinite-trigger-wrap">
          <div ref={sentinelRef} className="infinite-trigger" />
          {isLoadingMore ? <p className="infinite-status">Loading more videos...</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export default HomePage;
