const BASE_URL = 'https://www.googleapis.com/youtube/v3';
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const responseCache = new Map();

function assertApiKey() {
  if (!API_KEY) {
    throw new Error('Missing YouTube API key. Add VITE_YOUTUBE_API_KEY in your .env file.');
  }
}

async function request(endpoint, params = {}) {
  assertApiKey();

  const searchParams = new URLSearchParams({ key: API_KEY, ...params });
  const cacheKey = `${endpoint}?${searchParams.toString()}`;
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const response = await fetch(`${BASE_URL}/${endpoint}?${searchParams.toString()}`);

  if (!response.ok) {
    let details = '';
    try {
      const data = await response.json();
      details = (data?.error?.message || '').replace(/<[^>]*>/g, '');
    } catch {
      details = '';
    }
    if (response.status === 403 && /quota/i.test(details)) {
      throw new Error(
        'YouTube API daily quota is exceeded for this key. Wait for reset (midnight PT) or use another project/key.'
      );
    }
    throw new Error(`YouTube API error: ${response.status}${details ? ` - ${details}` : ''}`);
  }

  const payload = await response.json();
  responseCache.set(cacheKey, { data: payload, expiresAt: Date.now() + 60_000 });
  return payload;
}

async function authedRequest(endpoint, accessToken, method = 'GET', params = {}, body) {
  if (!accessToken) {
    throw new Error('You need to sign in to perform this action.');
  }

  const searchParams = new URLSearchParams(params);
  const url = `${BASE_URL}/${endpoint}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `YouTube API error: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function fetchPopularVideos(pageToken = '') {
  return request('videos', {
    part: 'snippet,statistics,contentDetails',
    chart: 'mostPopular',
    regionCode: 'US',
    maxResults: '12',
    pageToken
  });
}

export async function fetchPopularVideosByCategory(pageToken = '', categoryId = '') {
  return request('videos', {
    part: 'snippet,statistics,contentDetails',
    chart: 'mostPopular',
    regionCode: 'US',
    maxResults: '12',
    pageToken,
    ...(categoryId ? { videoCategoryId: categoryId } : {})
  });
}

function buildPublishedAfter(range) {
  if (!range) return '';
  const now = new Date();
  let days = 0;
  if (range === 'today') days = 1;
  if (range === 'week') days = 7;
  if (range === 'month') days = 30;
  if (!days) return '';
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function searchVideos(query, pageToken = '', filters = {}) {
  if (!query?.trim()) {
    return { items: [], nextPageToken: '' };
  }

  const publishedAfter = buildPublishedAfter(filters.uploadDate);

  return request('search', {
    part: 'snippet',
    type: 'video',
    maxResults: '12',
    q: query.trim(),
    pageToken,
    ...(filters.order ? { order: filters.order } : {}),
    ...(filters.videoDuration ? { videoDuration: filters.videoDuration } : {}),
    ...(publishedAfter ? { publishedAfter } : {})
  });
}

export async function fetchVideoDetails(videoId) {
  return request('videos', {
    part: 'snippet,statistics,contentDetails',
    id: videoId
  });
}

export async function fetchSuggestedVideos(videoId) {
  return request('search', {
    part: 'snippet',
    type: 'video',
    relatedToVideoId: videoId,
    maxResults: '12'
  });
}

export async function fetchSuggestedVideosFallback(query) {
  if (!query?.trim()) {
    return { items: [] };
  }

  return request('search', {
    part: 'snippet',
    type: 'video',
    maxResults: '12',
    q: query.trim()
  });
}

export async function fetchChannelDetails(channelId) {
  return request('channels', {
    part: 'snippet,statistics,brandingSettings',
    id: channelId
  });
}

export async function fetchChannelVideos(channelId, pageToken = '', maxResults = '12') {
  return request('search', {
    part: 'snippet',
    channelId,
    type: 'video',
    order: 'date',
    maxResults,
    pageToken
  });
}

export async function fetchComments(videoId, pageToken = '') {
  return request('commentThreads', {
    part: 'snippet',
    videoId,
    textFormat: 'plainText',
    pageToken,
    maxResults: '20',
    order: 'relevance'
  });
}

export async function fetchMyChannel(accessToken) {
  const data = await authedRequest('channels', accessToken, 'GET', {
    part: 'snippet',
    mine: 'true'
  });

  return data?.items?.[0] || null;
}

export async function fetchMyRating(videoId, accessToken) {
  const data = await authedRequest('videos/getRating', accessToken, 'GET', { id: videoId });
  return data?.items?.[0]?.rating || 'none';
}

export async function rateVideo(videoId, rating, accessToken) {
  await authedRequest('videos/rate', accessToken, 'POST', { id: videoId, rating });
}

export async function addComment(videoId, text, accessToken) {
  return authedRequest(
    'commentThreads',
    accessToken,
    'POST',
    { part: 'snippet' },
    {
      snippet: {
        videoId,
        topLevelComment: {
          snippet: {
            textOriginal: text
          }
        }
      }
    }
  );
}

export function formatViewCount(viewCount) {
  const views = Number(viewCount || 0);
  return `${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(views)} views`;
}

export function formatPublishedDate(dateString) {
  if (!dateString) return '';

  const publishedDate = new Date(dateString);
  const now = new Date();
  const diffMs = now - publishedDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'today';
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
}
