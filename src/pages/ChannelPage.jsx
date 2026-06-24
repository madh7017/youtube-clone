import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchChannelDetails, fetchChannelVideos, formatViewCount } from '../api/youtube';
import ErrorMessage from '../components/common/ErrorMessage';
import VideoGrid from '../components/video/VideoGrid';
import VideoGridSkeleton from '../components/video/VideoGridSkeleton';
import { useAppContext } from '../context/AppContext';

function ChannelPage() {
  const { channelId } = useParams();
  const { toggleSubscription, isSubscribed } = useAppContext();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadChannelData() {
      try {
        setIsLoading(true);
        setError('');

        const [channelData, videoData] = await Promise.all([
          fetchChannelDetails(channelId),
          fetchChannelVideos(channelId)
        ]);

        if (!active) return;
        const details = channelData.items?.[0] || null;
        setChannel(details);
        setVideos(videoData.items || []);
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Failed to load channel.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    loadChannelData();
    return () => {
      active = false;
    };
  }, [channelId]);

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (isLoading) {
    return <VideoGridSkeleton count={6} />;
  }

  if (!channel) {
    return <ErrorMessage message="Channel not found." />;
  }

  const channelSummary = {
    id: channel.id,
    title: channel.snippet?.title,
    thumbnail: channel.snippet?.thumbnails?.default?.url
  };

  return (
    <div className="page-wrap">
      <section className="channel-header">
        <img src={channel.snippet?.thumbnails?.high?.url} alt={channel.snippet?.title || 'Channel'} />
        <div className="channel-header-meta">
          <h1>{channel.snippet?.title}</h1>
          <p>
            {formatViewCount(channel.statistics?.subscriberCount || 0).replace('views', 'subscribers')} |{' '}
            {channel.statistics?.videoCount || 0} videos
          </p>
          <button
            type="button"
            className={`subscribe-button ${isSubscribed(channel.id) ? 'subscribed' : ''}`}
            onClick={() => toggleSubscription(channelSummary)}
          >
            {isSubscribed(channel.id) ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      </section>
      <VideoGrid videos={videos} emptyMessage="No channel videos found." />
    </div>
  );
}

export default ChannelPage;
