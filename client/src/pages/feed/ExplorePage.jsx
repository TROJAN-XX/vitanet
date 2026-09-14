import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import PostCard from '../../components/posts/PostCard.jsx';
import AppShell from '../../components/layout/AppShell.jsx';

const TOPICS = [
  'All',
  'Art',
  'Photography',
  'Design',
  'Code',
  'Music',
  'Writing',
  'Lifestyle',
  'Technology',
];

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTopic = searchParams.get('topic') || 'All';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchExplore() {
      setLoading(true);
      try {
        const query = currentTopic !== 'All' ? `?topic=${encodeURIComponent(currentTopic.toLowerCase())}` : '';
        const res = await api.get(`/feed/explore${query}`);
        if (!cancelled && res?.data?.posts) {
          setPosts(res.data.posts);
          setNextCursor(res.data.nextCursor);
          setHasMore(res.data.hasMore);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchExplore();
    return () => { cancelled = true; };
  }, [currentTopic]);

  const handleTopicSelect = (topic) => {
    if (topic === 'All') {
      searchParams.delete('topic');
    } else {
      searchParams.set('topic', topic);
    }
    setSearchParams(searchParams);
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    try {
      setLoadingMore(true);
      const query = currentTopic !== 'All'
        ? `?topic=${encodeURIComponent(currentTopic.toLowerCase())}&cursor=${nextCursor}`
        : `?cursor=${nextCursor}`;
      const res = await api.get(`/feed/explore${query}`);
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
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
            Explore
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
            Discover content surfaced by transparent community engagement
          </p>
        </div>

        {/* Topic Chips Filter */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-xs)',
            overflowX: 'auto',
            paddingBottom: 'var(--space-sm)',
            marginBottom: 'var(--space-lg)',
            scrollbarWidth: 'none',
          }}
        >
          {TOPICS.map((topic) => {
            const isSelected = currentTopic.toLowerCase() === topic.toLowerCase();
            return (
              <button
                key={topic}
                onClick={() => handleTopicSelect(topic)}
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  padding: '0.35rem 0.85rem',
                }}
              >
                {topic}
              </button>
            );
          })}
        </div>

        {/* Feed Posts */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {[1, 2].map((n) => (
              <div key={n} className="card card-glass skeleton" style={{ height: '450px' }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div
            className="card card-glass animate-fade-in"
            style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-lg)', color: 'var(--color-text-secondary)' }}
          >
            <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-sm)' }}>🔍</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)' }}>
              No Posts Found
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-xs)' }}>
              No posts found under this topic yet. Check back soon!
            </p>
          </div>
        ) : (
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
