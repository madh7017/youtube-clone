# YouView - YouTube Clone (React + Vite)

A production-ready YouTube clone style web app built with React (Vite), JavaScript, CSS, React Router, and Context API.

## Features

- Responsive header, collapsible sidebar, and video grid layout
- Real-time video listing from YouTube Data API v3
- Search with debounced input and dynamic results
- Video watch page with embedded player and suggested videos
- Google OAuth login (YouTube scope)
- Like/unlike current video (requires login)
- Read and post comments (requires login to post)
- Pagination support with "Load More"
- Global state management via Context API
- Route-based pages: Home, Search, Watch
- Lazy-loaded pages for improved performance

## Tech Stack

- React.js (Vite)
- JavaScript (ES6+)
- CSS (no Tailwind)
- YouTube Data API v3
- React Router DOM
- Context API

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add your keys:

- Copy `.env.example` to `.env`
- Add your YouTube Data API key and Google OAuth Client ID:

```env
VITE_YOUTUBE_API_KEY=YOUR_API_KEY_HERE
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID
```

3. In Google Cloud Console:
- Enable `YouTube Data API v3`
- Configure `OAuth consent screen`
- Create OAuth 2.0 Client ID (Web application)
- Add authorized JavaScript origins:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`

4. Run development server:

```bash
npm run dev
```

5. Build production bundle:

```bash
npm run build
```

## Folder Structure

```text
src/
  api/
    youtube.js
  components/
    common/
      EmptyState.jsx
      ErrorMessage.jsx
      Loader.jsx
    layout/
      AppLayout.jsx
      Header.jsx
      Sidebar.jsx
    video/
      VideoCard.jsx
      VideoGrid.jsx
  context/
    AppContext.jsx
  hooks/
    useDebounce.js
  pages/
    HomePage.jsx
    SearchResultsPage.jsx
    WatchPage.jsx
  styles/
    header.css
    index.css
    layout.css
    pages.css
    sidebar.css
    video.css
  App.jsx
  main.jsx
```

## Notes

- The app uses YouTube API endpoints:
  - `videos` (most popular, video details)
  - `search` (search results, related videos)
  - `commentThreads` (comments + comment insert)
  - `videos/rate` and `videos/getRating` (likes)
- If API key is missing, a descriptive error is shown.
- UI is inspired by YouTube but intentionally original.
