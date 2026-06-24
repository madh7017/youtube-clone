import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  addComment,
  fetchComments,
  fetchMyRating,
  fetchSuggestedVideos,
  fetchSuggestedVideosFallback,
  fetchVideoDetails,
  formatPublishedDate,
  formatViewCount,
  rateVideo
} from '../api/youtube';
import ErrorMessage from '../components/common/ErrorMessage';
import Loader from '../components/common/Loader';
import VideoGrid from '../components/video/VideoGrid';
import { useAppContext } from '../context/AppContext';

function isQuotaError(message = '') {
  return /quota|exceeded/i.test(message);
}

function createDegradedVideo(videoId) {
  return {
    id: videoId,
    snippet: {
      title: 'Playback mode (limited metadata)',
      channelId: '',
      channelTitle: 'Unavailable while API quota is exceeded',
      publishedAt: ''
    },
    statistics: {
      viewCount: 0
    }
  };
}

function WatchPage() {
  const { videoId } = useParams();
  const { setSelectedVideo, accessToken, userChannel, toggleSubscription, isSubscribed } = useAppContext();

  const [video, setVideo] = useState(null);
  const [suggestedVideos, setSuggestedVideos] = useState([]);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [myRating, setMyRating] = useState('none');
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isDegradedMode, setIsDegradedMode] = useState(false);
  const [degradedMessage, setDegradedMessage] = useState('');

  async function loadWatchData() {
    try {
      setError('');
      setIsLoading(true);
      setIsDegradedMode(false);
      setDegradedMessage('');

      const videoData = await fetchVideoDetails(videoId);
      const details = videoData.items?.[0] || null;
      if (!details) {
        throw new Error('Video not found.');
      }

      setVideo(details);
      setSelectedVideo(details);

      try {
        const relatedData = await fetchSuggestedVideos(videoId);
        const relatedItems = (relatedData.items || []).filter((item) => item.id?.videoId !== videoId);
        if (relatedItems.length) {
          setSuggestedVideos(relatedItems);
          return;
        }
      } catch {
        // Continue with fallback query when related endpoint is not available for this video.
      }

      const fallbackQuery = `${details.snippet?.channelTitle || ''} ${details.snippet?.title || ''}`.trim();
      const fallbackData = await fetchSuggestedVideosFallback(fallbackQuery);
      const fallbackItems = (fallbackData.items || []).filter((item) => item.id?.videoId !== videoId);
      setSuggestedVideos(fallbackItems);
    } catch (requestError) {
      const message = requestError.message || 'Failed to load video.';
      if (isQuotaError(message)) {
        setIsDegradedMode(true);
        setDegradedMessage('API quota exceeded. Playing video in limited mode without metadata.');
        setVideo(createDegradedVideo(videoId));
        setSelectedVideo(null);
        setSuggestedVideos([]);
        setComments([]);
        setMyRating('none');
        return;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadComments() {
    if (isDegradedMode) {
      setComments([]);
      return;
    }

    try {
      setIsCommentLoading(true);
      const commentsData = await fetchComments(videoId);
      setComments(commentsData.items || []);
    } catch {
      setComments([]);
    } finally {
      setIsCommentLoading(false);
    }
  }

  async function loadMyRating() {
    if (!accessToken || isDegradedMode) {
      setMyRating('none');
      return;
    }

    try {
      const rating = await fetchMyRating(videoId, accessToken);
      setMyRating(rating);
    } catch {
      setMyRating('none');
    }
  }

  async function handleLikeToggle() {
    if (isDegradedMode) {
      setActionError('Like is unavailable in degraded mode. Try again after quota reset.');
      return;
    }

    if (!accessToken) {
      setActionError('Please sign in to like videos.');
      return;
    }

    setActionError('');
    setIsRatingLoading(true);

    try {
      const nextRating = myRating === 'like' ? 'none' : 'like';
      await rateVideo(videoId, nextRating, accessToken);
      setMyRating(nextRating);
    } catch (ratingError) {
      setActionError(ratingError.message || 'Failed to update like.');
    } finally {
      setIsRatingLoading(false);
    }
  }

  async function handlePostComment(event) {
    event.preventDefault();

    if (isDegradedMode) {
      setActionError('Comments are unavailable in degraded mode. Try again after quota reset.');
      return;
    }

    if (!accessToken) {
      setActionError('Please sign in to post comments.');
      return;
    }

    if (!commentText.trim()) return;

    setActionError('');
    setIsSendingComment(true);

    try {
      await addComment(videoId, commentText.trim(), accessToken);
      setCommentText('');
      await loadComments();
    } catch (commentError) {
      setActionError(commentError.message || 'Failed to post comment.');
    } finally {
      setIsSendingComment(false);
    }
  }

  useEffect(() => {
    loadWatchData();
  }, [videoId]);

  useEffect(() => {
    if (video && !isDegradedMode) {
      loadComments();
    }
  }, [videoId, video, isDegradedMode]);

  useEffect(() => {
    loadMyRating();
  }, [videoId, accessToken, isDegradedMode]);

  if (isLoading) {
    return <Loader message="Loading video..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadWatchData} />;
  }

  if (!video) {
    return <ErrorMessage message="Video not found." />;
  }

  const channelSummary = {
    id: video.snippet?.channelId,
    title: video.snippet?.channelTitle,
    thumbnail: ''
  };

  return (
    <div className="watch-layout">
      <section className="watch-player-section">
        <div className="video-frame-wrap">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={video.snippet?.title || 'Video player'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {isDegradedMode ? <p className="limited-mode-note">{degradedMessage}</p> : null}

        <h1 className="watch-title">{video.snippet?.title}</h1>
        <p className="watch-stats">
          {isDegradedMode
            ? 'Metadata unavailable in limited mode'
            : `${formatViewCount(video.statistics?.viewCount)} | ${formatPublishedDate(video.snippet?.publishedAt)}`}
        </p>

        <div className="channel-box">
          <div className="channel-top-row">
            {video.snippet?.channelId ? (
              <Link to={`/channel/${video.snippet?.channelId}`} className="channel-link-large">
                {video.snippet?.channelTitle}
              </Link>
            ) : (
              <span className="channel-link-large">{video.snippet?.channelTitle}</span>
            )}
            <div className="watch-actions">
              {video.snippet?.channelId ? (
                <button
                  type="button"
                  className={`subscribe-button ${isSubscribed(channelSummary.id) ? 'subscribed' : ''}`}
                  onClick={() => toggleSubscription(channelSummary)}
                >
                  {isSubscribed(channelSummary.id) ? 'Subscribed' : 'Subscribe'}
                </button>
              ) : null}
              <button
                className={`like-button ${myRating === 'like' ? 'active' : ''}`}
                type="button"
                onClick={handleLikeToggle}
                disabled={isRatingLoading || isDegradedMode}
              >
                {myRating === 'like' ? 'Liked' : 'Like'}
              </button>
            </div>
          </div>
          {!isDegradedMode ? <p>{video.snippet?.description}</p> : null}
        </div>

        <section className="comments-section">
          <h2>Comments</h2>
          {actionError ? <p className="action-error">{actionError}</p> : null}
          <form className="comment-form" onSubmit={handlePostComment}>
            <textarea
              placeholder={
                isDegradedMode
                  ? 'Comments unavailable in limited mode'
                  : accessToken
                    ? 'Add a public comment...'
                    : 'Sign in to write a comment'
              }
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              disabled={!accessToken || isSendingComment || isDegradedMode}
            />
            <button
              type="submit"
              disabled={!accessToken || isSendingComment || !commentText.trim() || isDegradedMode}
            >
              {isSendingComment ? 'Posting...' : 'Comment'}
            </button>
          </form>

          {isCommentLoading ? <Loader message="Loading comments..." /> : null}
          <div className="comments-list">
            {comments.map((item) => {
              const comment = item.snippet?.topLevelComment?.snippet;
              return (
                <article className="comment-card" key={item.id}>
                  <img src={comment?.authorProfileImageUrl} alt={comment?.authorDisplayName || 'User'} />
                  <div>
                    <p className="comment-author">
                      {comment?.authorDisplayName}
                      {userChannel?.snippet?.title === comment?.authorDisplayName ? ' (You)' : ''}
                    </p>
                    <p className="comment-text">{comment?.textDisplay}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      <aside className="watch-suggestions">
        <h2>Up Next</h2>
        <VideoGrid
          videos={suggestedVideos}
          compactCards
          emptyMessage={isDegradedMode ? 'Recommendations unavailable in limited mode.' : 'No suggestions found.'}
        />
      </aside>
    </div>
  );
}

export default WatchPage;
