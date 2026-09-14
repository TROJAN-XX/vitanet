import { useState, useRef } from 'react';
import Modal from '../ui/Modal.jsx';
import api from '../../api/client.js';
import { useMediaUpload } from '../../hooks/useMediaUpload.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function EditProfileModal({ isOpen, onClose, user, onProfileUpdated }) {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarMediaId, setAvatarMediaId] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef(null);

  const { uploadMedia, uploading: uploadingAvatar } = useMediaUpload();
  const { success, error: toastError } = useToast();

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploaded = await uploadMedia(file, 'avatar');
      setAvatarMediaId(uploaded.mediaId);
      setAvatarPreview(uploaded.previewUrl || uploaded.downloadUrl);
      success('Avatar uploaded!');
    } catch (err) {
      toastError(err.message || 'Failed to upload avatar image');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        displayName: displayName.trim(),
        bio: bio.trim(),
      };
      if (avatarMediaId) {
        payload.avatarMediaId = avatarMediaId;
      }

      const res = await api.patch('/users/me', payload);
      success('Profile updated successfully!');
      onProfileUpdated?.(res.data.user);
      onClose();
    } catch (err) {
      toastError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" maxWidth="480px">
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Avatar Upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', paddingBottom: 'var(--space-sm)' }}>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleAvatarFile}
          />

          <div style={{ position: 'relative' }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="avatar avatar-lg" />
            ) : (
              <div
                className="avatar avatar-lg"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--gradient-card)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--weight-bold)',
                }}
              >
                {user?.username?.[0]?.toUpperCase()}
              </div>
            )}

            {uploadingAvatar && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div className="spinner" style={{ width: '20px', height: '20px' }} />
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="btn btn-secondary btn-sm"
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? 'Processing...' : 'Change Photo'}
            </button>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
              JPEG, PNG, or WebP. Auto-resized.
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div className="input-group">
          <label className="input-label" htmlFor="displayName">Display Name</label>
          <input
            id="displayName"
            type="text"
            className="input-field"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            placeholder="Creator Name"
          />
        </div>

        {/* Bio */}
        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="input-label" htmlFor="bio">Bio</label>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              {bio.length}/160
            </span>
          </div>
          <textarea
            id="bio"
            className="input-field"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            placeholder="Tell your story or describe your creative work..."
            style={{ resize: 'none' }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
          <button type="button" onClick={onClose} className="btn btn-ghost" disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || uploadingAvatar}>
            {saving ? <div className="spinner" style={{ width: '18px', height: '18px' }} /> : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
