import React from 'react';
import VideoCard from './VideoCard';
import EmptyState from '../common/EmptyState';

function VideoGrid({ videos, compactCards = false, emptyMessage = 'No videos found.' }) {
  if (!videos?.length) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <section className={`video-grid ${compactCards ? 'compact' : ''}`}>
      {videos.map((video) => {
        const id = video.id?.videoId || video.id;
        if (!id) return null;
        return <VideoCard key={id} video={video} compact={compactCards} />;
      })}
    </section>
  );
}

export default VideoGrid;
