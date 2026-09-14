import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import UploadDropzone from '../../components/media/UploadDropzone.jsx';
import MediaPreview from '../../components/media/MediaPreview.jsx';
import AppShell from '../../components/layout/AppShell.jsx';

const SUGGESTED_TOPICS = ['art', 'photography', 'design', 'code', 'music', 'lifestyle', 'technology', 'writing'];

export default function CreatePostPage() {
  const [caption, setCaption] = useState('');
  const [mediaList, setMediaList] = useState([]);
  const [hasWarning, setHasWarning] = useState(false);
  const [contentWarning, setContentWarning] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const handleMediaUploaded = (item) => {
    setMediaList((prev) => [...prev, item]);
  };

  const handleRemoveMedia = (index) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTopic = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (mediaList.length === 0 && !caption.trim()) {
      setErrorMsg('A post must contain either media or a caption.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        caption: caption.trim(),
        media: mediaList.map((m) => ({
          mediaId: m.mediaId,
          objectKey: m.objectKey,
          byteSize: m.byteSize,
          mimeType: m.mimeType,
          width: m.width,
          height: m.height,
        })),
        contentWarning: hasWarning && contentWarning.trim() ? contentWarning.trim() : undefined,
        topics: selectedTopics,
      };

      const res = await api.post('/posts', payload);
      success('Post published to VitaNet!');
      navigate(`/p/${res.data.post._id}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to publish post');
      toastError(err.message || 'Publishing failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="page page-narrow animate-fade-in" style={{ maxWidth: '560px' }}>
        <div className="card card-glass">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-md)' }}>
            Create Post
          </h1>

          {errorMsg && (
            <div
              className="animate-slide-up"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 107, 107, 0.12)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                color: 'var(--color-error)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-lg)',
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {/* Media Upload & Previews */}
            <div>
              <label className="input-label" style={{ marginBottom: 'var(--space-xs)', display: 'block' }}>
                Media (Photos or Videos, max 4)
              </label>

              <MediaPreview items={mediaList} onRemove={handleRemoveMedia} />

              {mediaList.length < 4 && (
                <UploadDropzone
                  onMediaUploaded={handleMediaUploaded}
                  maxFiles={4}
                  currentCount={mediaList.length}
                  purpose="post"
                />
              )}
            </div>

            {/* Caption */}
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="input-label" htmlFor="postCaption">Caption</label>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                  {caption.length}/2200
                </span>
              </div>
              <textarea
                id="postCaption"
                className="input-field"
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={2200}
                placeholder="What are you creating or exploring? Use #hashtags to help others discover your work."
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Content Warning Toggle */}
            <div
              style={{
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-glass)',
                border: '1px solid var(--color-glass-border)',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hasWarning}
                  onChange={(e) => setHasWarning(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-primary)' }}>
                  Add Content Warning (Sensitive Content / Spoilers)
                </span>
              </label>

              {hasWarning && (
                <div className="input-group" style={{ marginTop: 'var(--space-sm)' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Flashing lights, sensitive discussion, minor spoilers"
                    value={contentWarning}
                    onChange={(e) => setContentWarning(e.target.value)}
                    maxLength={100}
                    required={hasWarning}
                  />
                </div>
              )}
            </div>

            {/* Topics */}
            <div>
              <label className="input-label" style={{ marginBottom: 'var(--space-xs)', display: 'block' }}>
                Select Topics
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {SUGGESTED_TOPICS.map((topic) => {
                  const isSelected = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', padding: '4px 10px' }}
                    >
                      #{topic}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting || (mediaList.length === 0 && !caption.trim())}
              >
                {submitting ? <div className="spinner" style={{ width: '20px', height: '20px' }} /> : 'Publish Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
