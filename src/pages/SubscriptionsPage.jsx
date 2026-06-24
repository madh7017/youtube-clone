import React, { useEffect, useMemo, useState } from 'react';
import { fetchChannelVideos } from '../api/youtube';
import ErrorMessage from '../components/common/ErrorMessage';
import VideoGrid from '../components/video/VideoGrid';
import VideoGridSkeleton from '../components/video/VideoGridSkeleton';
import { useAppContext } from '../context/AppContext';

function SubscriptionsPage() {
  const { subscriptions } = useAppContext();
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const subscribedIds = useMemo(() => subscriptions.map((item) => item.id), [subscriptions]);

  useEffect(() => {
    let active = true;

    async function loadSubscriptionFeed() {
      if (!subscribedIds.length) {
        setVideos([]);
        setIsLoading(false);
        return;
      }

      try {
        setError('');
        setIsLoading(true);

        const responses = await Promise.all(subscribedIds.map((channelId) => fetchChannelVideos(channelId, '', '6')));
        const merged = responses.flatMap((response) => response.items || []);
        const sorted = merged.sort(
          (a, b) => new Date(b.snippet?.publishedAt || 0).getTime() - new Date(a.snippet?.publishedAt || 0).getTime()
        );

        if (active) {
          setVideos(sorted);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Failed to load subscriptions feed.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadSubscriptionFeed();

    return () => {
      active = false;
    };
  }, [subscribedIds]);

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (isLoading) {
    return <VideoGridSkeleton count={8} />;
  }

  return (
    <div className="page-wrap">
      <h1 className="page-title">Subscriptions</h1>
      <VideoGrid
        videos={videos}
        emptyMessage="Your subscriptions feed is empty. Subscribe to channels from the Watch or Channel page."
      />
    </div>
  );
}

export default SubscriptionsPage;
