import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import ProfileHeader from '../../components/profile/ProfileHeader.jsx';
import AppShell from '../../components/layout/AppShell.jsx';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'saved'
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const isSelf = currentUser?.username?.toLowerCase() === username?.toLowerCase();

  useEffect(() => {
    let cancelled = false;

    async function loadProfileAndPosts() {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/users/${username}`),
          api.get(`/users/${username}/posts`),
        ]);

        if (!cancelled) {
          setProfile(profileRes.data.user);
          setPosts(postsRes.data.posts || []);
          setNextCursor(postsRes.data.nextCursor);
          setHasMore(postsRes.data.hasMore);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Profile not found');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfileAndPosts();
    return () => { cancelled = true; };
  }, [username]);

  const loadMorePosts = async () => {
    if (!nextCursor || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await api.get(`/users/${username}/posts?cursor=${nextCursor}`);
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

  if (loading) {
    return (
      <AppShell>
        <div className="page page-narrow">
          <div className="card card-glass skeleton" style={{ height: '240px', marginBottom: 'var(--space-lg)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)' }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="skeleton" style={{ aspectRatio: '1' }} />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !profile) {
    return (
      <AppShell>
        <div className="page page-narrow animate-fade-in" style={{ textAlign: 'center', paddingTop: '15vh' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-sm)' }}>
            User Not Found
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
            The creator @{username} does not exist, has been removed, or is unavailable.
          </p>
          <Link to="/explore" className="btn btn-primary">
            Explore Creators
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page page-narrow animate-fade-in">
        <ProfileHeader
          profile={profile}
          isSelf={isSelf}
          onProfileUpdated={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
        />

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-glass-border)',
            marginBottom: 'var(--space-lg)',
          }}
        >
          <button
            onClick={() => setActiveTab('posts')}
            style={{
              padding: 'var(--space-sm) var(--space-lg)',
              borderBottom: activeTab === 'posts' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'posts' ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'posts' ? 'var(--weight-bold)' : 'var(--weight-medium)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Posts ({profile.postsCount || 0})
          </button>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div
            className="card card-glass"
            style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-lg)', color: 'var(--color-text-secondary)' }}
          >
            <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-sm)' }}>📷</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
              No Posts Yet
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-xs)' }}>
              {isSelf ? 'Share your first photo or video with the network!' : `@${profile.username} hasn't published any posts.`}
            </p>
            {isSelf && (
              <Link to="/create" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-md)' }}>
                Create Post
              </Link>
            )}
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--space-sm)',
              }}
            >
              {posts.map((post) => {
                const firstMedia = post.media?.[0];
                return (
                  <Link
                    key={post._id}
                    to={`/p/${post._id}`}
                    className="card"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      aspectRatio: '1',
                      position: 'relative',
                      display: 'block',
                    }}
                  >
                    {firstMedia?.mimeType?.startsWith('video/') ? (
                      <video
                        src={firstMedia.downloadUrl}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted
                      />
                    ) : (
                      <img
                        src={firstMedia?.downloadUrl || '/placeholder.png'}
                        alt={post.caption || 'Post image'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    )}

                    {/* Multi-media indicator */}
                    {post.media?.length > 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '2px 4px',
                          color: 'white',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <path d="M3 9h18" />
                          <path d="M9 21V9" />
                        </svg>
                        <span>{post.media.length}</span>
                      </div>
                    )}

                    {/* Likes overlay on hover */}
                    <div
                      className="post-overlay"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-md)',
                        color: 'white',
                        fontWeight: 'var(--weight-bold)',
                        fontSize: 'var(--text-sm)',
                        opacity: 0,
                        transition: 'opacity var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor">
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                        <span>{post.likeCount || 0}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span>{post.commentCount || 0}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
                <button onClick={loadMorePosts} className="btn btn-secondary btn-sm" disabled={loadingMore}>
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
