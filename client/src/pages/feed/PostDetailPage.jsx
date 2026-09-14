import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import PostCard from '../../components/posts/PostCard.jsx';
import AppShell from '../../components/layout/AppShell.jsx';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPost() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/posts/${id}`);
        if (!cancelled && res?.data?.post) {
          setPost(res.data.post);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Post not found');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPost();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="page page-narrow">
          <div className="card card-glass skeleton" style={{ height: '480px' }} />
        </div>
      </AppShell>
    );
  }

  if (error || !post) {
    return (
      <AppShell>
        <div className="page page-narrow animate-fade-in" style={{ textAlign: 'center', paddingTop: '15vh' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-sm)' }}>
            Post Not Available
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
            This post may have been deleted by the author or removed by moderation.
          </p>
          <Link to="/feed" className="btn btn-primary">
            Back to Feed
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page page-narrow animate-fade-in">
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        <PostCard post={post} onPostDeleted={() => navigate('/feed')} />
      </div>
    </AppShell>
  );
}
