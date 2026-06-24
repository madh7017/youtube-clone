import React from 'react';
import { Link } from 'react-router-dom';
import { formatPublishedDate, formatViewCount } from '../../api/youtube';

function VideoCard({ video, compact = false }) {
  const videoId = video.id?.videoId || video.id;
  const thumbnail = video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.high?.url;

  return (
    <Link to={`/watch/${videoId}`} className={`video-card ${compact ? 'compact' : ''}`}>
      <img src={thumbnail} alt={video.snippet?.title || 'Video thumbnail'} loading="lazy" />
      <div className="video-meta">
        <h3>{video.snippet?.title}</h3>
        <p>
          <span className="channel-link">{video.snippet?.channelTitle}</span>
        </p>
        {!compact ? (
          <p>
            {formatViewCount(video.statistics?.viewCount)} | {formatPublishedDate(video.snippet?.publishedAt)}
          </p>
        ) : (
          <p>{formatPublishedDate(video.snippet?.publishedAt)}</p>
        )}
      </div>
    </Link>
  );
}

export default VideoCard;
