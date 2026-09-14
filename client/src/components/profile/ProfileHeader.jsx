import { useState } from 'react';
import api from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import EditProfileModal from './EditProfileModal.jsx';
import UserListModal from './UserListModal.jsx';
import ReportModal from '../moderation/ReportModal.jsx';

const USER_QUOTA_MB = 75;

export default function ProfileHeader({ profile, isSelf, onProfileUpdated }) {
  const [isFollowing, setIsFollowing] = useState(profile?.isFollowing || false);
  const [followersCount, setFollowersCount] = useState(profile?.followersCount || 0);
  const [editOpen, setEditOpen] = useState(false);
  const [userListModal, setUserListModal] = useState({ isOpen: false, type: 'followers' });
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();

  const handleFollowToggle = async () => {
    if (!isAuthenticated) return;
    try {
      if (isFollowing) {
        await api.delete(`/users/${profile._id}/follow`);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        success(`Unfollowed @${profile.username}`);
      } else {
        await api.post(`/users/${profile._id}/follow`);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        success(`Following @${profile.username}`);
      }
    } catch (err) {
      toastError(err.message || 'Failed to update follow relationship');
    }
  };

  const handleBlock = async () => {
    try {
      await api.post(`/users/${profile._id}/block`);
      success(`Blocked @${profile.username}`);
      window.location.reload();
    } catch (err) {
      toastError(err.message || 'Failed to block user');
    }
  };

  const handleMute = async () => {
    try {
      await api.post(`/users/${profile._id}/mute`);
      success(`Muted @${profile.username}`);
      setMenuOpen(false);
    } catch (err) {
      toastError(err.message || 'Failed to mute user');
    }
  };

  // Quota calculation (profile.usedStorageBytes or 0)
  const usedBytes = profile?.mediaUsageBytes || 0;
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const quotaPercent = Math.min(100, Math.round((usedBytes / (USER_QUOTA_MB * 1024 * 1024)) * 100));

  return (
    <div className="card card-glass" style={{ marginBottom: 'var(--space-xl)', padding: 0, overflow: 'hidden' }}>
      {/* Header Banner */}
      <div
        style={{
          height: '140px',
          background: 'var(--gradient-primary)',
          opacity: 0.8,
          position: 'relative',
        }}
      />

      <div style={{ padding: '0 var(--space-lg) var(--space-lg) var(--space-lg)', position: 'relative' }}>
        {/* Avatar & Action Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: '-48px',
            marginBottom: 'var(--space-md)',
          }}
        >
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.username}
              className="avatar avatar-lg"
              style={{ border: '4px solid var(--color-bg-secondary)' }}
            />
          ) : (
            <div
              className="avatar avatar-lg"
              style={{
                border: '4px solid var(--color-bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--gradient-card)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--weight-bold)',
              }}
            >
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}

          {/* Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            {isSelf ? (
              <button onClick={() => setEditOpen(true)} className="btn btn-secondary btn-sm">
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleFollowToggle}
                  className={`btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ minWidth: '100px' }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>

                {/* More options (block, mute, report) */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="btn btn-ghost btn-icon btn-sm"
                    aria-label="Profile actions"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div
                      className="animate-scale-in"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        width: '160px',
                        background: 'var(--color-bg-elevated)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid var(--color-glass-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 'var(--z-dropdown)',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '4px',
                      }}
                    >
                      <button
                        onClick={handleMute}
                        className="btn btn-ghost btn-sm"
                        style={{ justifyContent: 'flex-start', width: '100%' }}
                      >
                        Mute @{profile.username}
                      </button>
                      <button
                        onClick={handleBlock}
                        className="btn btn-ghost btn-sm"
                        style={{ justifyContent: 'flex-start', width: '100%', color: 'var(--color-warm)' }}
                      >
                        Block @{profile.username}
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setReportModalOpen(true);
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ justifyContent: 'flex-start', width: '100%', color: 'var(--color-error)' }}
                      >
                        Report Account
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* User Info */}
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>
              {profile?.displayName || profile?.username}
            </h1>
            {profile?.role === 'admin' && (
              <span className="badge badge-primary">Admin</span>
            )}
            {profile?.role === 'moderator' && (
              <span className="badge badge-success">Moderator</span>
            )}
          </div>
          <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
            @{profile?.username}
          </div>
        </div>

        {profile?.bio && (
          <p style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-md)' }}>
            {profile.bio}
          </p>
        )}

        {/* Counts row */}
        <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: isSelf ? 'var(--space-md)' : 0 }}>
          <div>
            <strong style={{ color: 'var(--color-text-primary)' }}>{profile?.postsCount || 0}</strong> Posts
          </div>
          <button
            onClick={() => setUserListModal({ isOpen: true, type: 'followers' })}
            style={{ cursor: 'pointer', color: 'inherit' }}
          >
            <strong style={{ color: 'var(--color-text-primary)' }}>{followersCount}</strong> Followers
          </button>
          <button
            onClick={() => setUserListModal({ isOpen: true, type: 'following' })}
            style={{ cursor: 'pointer', color: 'inherit' }}
          >
            <strong style={{ color: 'var(--color-text-primary)' }}>{profile?.followingCount || 0}</strong> Following
          </button>
        </div>

        {/* Self Quota Bar */}
        {isSelf && (
          <div
            style={{
              marginTop: 'var(--space-md)',
              paddingTop: 'var(--space-sm)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>
              <span>Personal Media Quota</span>
              <span>{usedMB} MB / {USER_QUOTA_MB} MB ({quotaPercent}%)</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${quotaPercent}%`,
                  height: '100%',
                  background: quotaPercent > 90 ? 'var(--color-error)' : 'var(--gradient-primary)',
                  transition: 'width 300ms ease',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isSelf && (
        <EditProfileModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          user={profile}
          onProfileUpdated={onProfileUpdated}
        />
      )}

      {/* Followers / Following Modal */}
      <UserListModal
        isOpen={userListModal.isOpen}
        onClose={() => setUserListModal({ isOpen: false, type: 'followers' })}
        username={profile?.username}
        type={userListModal.type}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType="user"
        targetId={profile?._id}
      />
    </div>
  );
}
