import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { shareToSlack } from '../../api/reports';
import toast from 'react-hot-toast';

export default function ShareToSlackButton({ reportId, shared }) {
  const [sharing, setSharing] = useState(false);
  const [done, setDone] = useState(shared);

  const handleShare = async () => {
    setSharing(true);
    try {
      await shareToSlack(reportId);
      setDone(true);
      toast.success('Shared to Slack!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to share');
    } finally {
      setSharing(false);
    }
  };

  if (done) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <CheckCircle size={12} /> Shared
      </span>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600"
    >
      <Send size={12} />
      {sharing ? 'Sharing...' : 'Share to Slack'}
    </button>
  );
}
