import { useState, useEffect } from 'react';
import { CheckCircle, ExternalLink, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../api/auth';
import { getComposioStatus, connectSlack } from '../../api/composio';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

export default function SettingsModal({ onClose, onLogout }) {
  const { user, setUser } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState(user?.slackConfig?.webhookUrl || '');
  const [channel, setChannel] = useState(user?.slackConfig?.channel || '');
  const [saving, setSaving] = useState(false);
  const [composioStatus, setComposioStatus] = useState(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    getComposioStatus()
      .then((res) => setComposioStatus(res.data))
      .catch(() => setComposioStatus(null));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateProfile({ slackConfig: { webhookUrl, channel } });
      setUser(res.data.user);
      toast.success('Settings saved');
      onClose();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleComposioConnect = async () => {
    setConnecting(true);
    try {
      const res = await connectSlack();
      window.open(res.data.authUrl, '_blank');
      toast.success('Complete Slack authorization in the opened tab');
    } catch {
      toast.error('Failed to start Slack connection');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-surface border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Composio Slack Connection */}
          {composioStatus?.composioConfigured && (
            <div className="p-4 bg-purple-950/50 rounded-xl border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-purple-300">Slack via Composio</h3>
                {composioStatus.slackConnected && (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle size={12} /> Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-400 mb-3">
                Connect your Slack workspace with one click — no webhook setup needed.
              </p>
              {!composioStatus.slackConnected && (
                <Button
                  size="sm"
                  onClick={handleComposioConnect}
                  disabled={connecting}
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                >
                  <ExternalLink size={14} />
                  {connecting ? 'Connecting…' : 'Connect Slack'}
                </Button>
              )}
            </div>
          )}

          {composioStatus?.composioConfigured && (
            <div className="relative">
              <Separator className="bg-white/10" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-2 text-xs text-gray-500">
                or use webhook
              </span>
            </div>
          )}

          {/* Manual Webhook Config */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-400">Slack Webhook URL</label>
            <Input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-white/20"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-400">Slack Channel</label>
            <Input
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="#general"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-white/20"
            />
          </div>
        </div>

        <DialogFooter className="flex-row items-center sm:justify-between gap-2">
          {onLogout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onClose(); onLogout(); }}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 gap-2"
            >
              <LogOut size={16} />
              Log out
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose} className="border-white/10 text-gray-300 hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
