import React from 'react';

function VideoGridSkeleton({ count = 8, compact = false }) {
  return (
    <section className={`video-grid ${compact ? 'compact' : ''}`}>
      {Array.from({ length: count }).map((_, index) => (
        <article key={index} className={`video-card skeleton ${compact ? 'compact' : ''}`}>
          <div className="skeleton-thumb" />
          <div className="video-meta">
            <div className="skeleton-line title" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        </article>
      ))}
    </section>
  );
}

export default VideoGridSkeleton;
