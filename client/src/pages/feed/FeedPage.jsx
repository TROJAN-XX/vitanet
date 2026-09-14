import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import PostCard from '../../components/posts/PostCard.jsx';
import AppShell from '../../components/layout/AppShell.jsx';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeed = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/feed/following');
      if (res?.data?.posts) {
        setPosts(res.data.posts);
        setNextCursor(res.data.nextCursor);
        setHasMore(res.data.hasMore);
      }
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await api.get(`/feed/following?cursor=${nextCursor}`);
      if (res?.data?.posts) {
        setPosts((prev) => [...prev, ...res.data.posts]);
        setNextCursor(res.data.nextCursor);
        setHasMore(res.data.hasMore);
      }
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  return (
    <AppShell>
      <div className="page page-narrow">
        {/* Feed Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-lg)',
          }}
        >
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
              Your Feed
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
              Chronological updates from creators you follow
            </p>
          </div>

          <button
            onClick={() => fetchFeed(true)}
            className="btn btn-ghost btn-sm"
            disabled={loading || refreshing}
            aria-label="Refresh feed"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {[1, 2].map((n) => (
              <div key={n} className="card card-glass skeleton" style={{ height: '450px' }} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div
            className="card card-glass animate-fade-in"
            style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-lg)' }}
          >
            <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-sm)' }}>✨</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-xs)' }}>
              Your Feed is Quiet
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '380px', margin: '0 auto var(--space-lg) auto', lineHeight: 'var(--leading-relaxed)' }}>
              Follow creators to see their latest work in a clean, strictly chronological feed with zero ads.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
              <Link to="/explore" className="btn btn-primary btn-sm">
                Explore Creators
              </Link>
              <Link to="/create" className="btn btn-secondary btn-sm">
                Share a Post
              </Link>
            </div>
          </div>
        )}

        {/* Posts Stream */}
        {!loading && posts.length > 0 && (
          <div>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPostDeleted={handlePostDeleted}
              />
            ))}

            {hasMore && (
              <div style={{ textAlign: 'center', margin: 'var(--space-xl) 0' }}>
                <button
                  onClick={loadMore}
                  className="btn btn-secondary btn-sm"
                  disabled={loadingMore}
                >
                  {loadingMore ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Load More Posts'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
