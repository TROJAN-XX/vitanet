import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import api from '../../api/client.js';
import { useToast } from '../../contexts/ToastContext.jsx';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or automated content' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech or discrimination' },
  { value: 'inappropriate', label: 'Sexually explicit or inappropriate content' },
  { value: 'copyright', label: 'Copyright violation / Intellectual property' },
  { value: 'other', label: 'Other violation of Community Guidelines' },
];

export default function ReportModal({ isOpen, onClose, targetType, targetId }) {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { success, error: toastError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetId || !targetType) return;

    try {
      setSubmitting(true);
      await api.post('/reports', {
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });

      success('Report submitted. Our moderation team will review this promptly.');
      setDetails('');
      onClose();
    } catch (err) {
      toastError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Report ${targetType === 'user' ? 'Account' : 'Content'}`} maxWidth="440px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Help keep VitaNet safe and creator-focused. Please select the primary reason for your report:
        </p>

        <div className="input-group">
          <label className="input-label" htmlFor="reportReason">Reason</label>
          <select
            id="reportReason"
            className="input-field"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
          >
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value} style={{ background: 'var(--color-bg-secondary)' }}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="reportDetails">Additional Details (Optional)</label>
          <textarea
            id="reportDetails"
            className="input-field"
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={500}
            placeholder="Provide any additional context to assist the moderation team..."
            style={{ resize: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
          <button type="button" onClick={onClose} className="btn btn-ghost" disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-danger" disabled={submitting}>
            {submitting ? <div className="spinner" style={{ width: '18px', height: '18px' }} /> : 'Submit Report'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
