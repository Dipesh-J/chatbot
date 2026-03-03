import { useEffect, useState, useCallback } from 'react';
import {
    Settings, Slack, Check, Loader2, ChevronRight,
    Bell, User, Shield, RefreshCw, AlertCircle, Clock,
    ExternalLink, Trash2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { getComposioStatus, connectSlack, disconnectSlack } from '../../api/composio';
import { cn } from '../../lib/utils';

const TABS = [
    { id: 'general', label: 'General', icon: User },
    { id: 'integrations', label: 'Integrations', icon: Slack },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
];

// ─────────────────────────────────────────────────────────────────────────────
// Root dialog — owns all shared state so nothing resets on tab switch
// ─────────────────────────────────────────────────────────────────────────────
export function SettingsDialog({ open, onClose }) {
    const [activeTab, setActiveTab] = useState('integrations');

    // Slack state lives here so it survives tab switches
    const [composioConfigured, setComposioConfigured] = useState(null); // null = loading
    const [slackConnected, setSlackConnected] = useState(false);
    const [slackLoading, setSlackLoading] = useState(false);
    const [slackPending, setSlackPending] = useState(false); // user opened OAuth, hasn't confirmed yet
    const [slackError, setSlackError] = useState(null);
    const [slackDisconnecting, setSlackDisconnecting] = useState(false);

    // Fetch status whenever the dialog opens
    const fetchStatus = useCallback(async () => {
        setComposioConfigured(null);
        setSlackError(null);
        try {
            const res = await getComposioStatus();
            setComposioConfigured(res.data?.composioConfigured ?? false);
            setSlackConnected(res.data?.slackConnected ?? false);
        } catch {
            setComposioConfigured(false);
            setSlackConnected(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            setSlackPending(false);
            fetchStatus();
        }
    }, [open, fetchStatus]);

    const handleConnectSlack = async () => {
        setSlackLoading(true);
        setSlackError(null);
        try {
            const res = await connectSlack();
            const url = res.data?.authUrl;
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
                setSlackPending(true); // waiting for user to complete OAuth
            } else {
                setSlackError('No OAuth URL returned. Please check your Composio configuration.');
            }
        } catch (err) {
            setSlackError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Failed to initiate Slack connection.'
            );
        } finally {
            setSlackLoading(false);
        }
    };

    const handleRecheckStatus = async () => {
        setSlackPending(false);
        await fetchStatus();
    };

    const handleDisconnectSlack = async () => {
        setSlackDisconnecting(true);
        setSlackError(null);
        try {
            await disconnectSlack();
            setSlackConnected(false);
            setSlackPending(false);
        } catch (err) {
            setSlackError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Failed to disconnect Slack. Please try again.'
            );
        } finally {
            setSlackDisconnecting(false);
        }
    };

    const slackProps = {
        composioConfigured,
        slackConnected,
        slackLoading,
        slackPending,
        slackError,
        slackDisconnecting,
        onConnect: handleConnectSlack,
        onRecheck: handleRecheckStatus,
        onDisconnect: handleDisconnectSlack,
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-3xl h-[560px] flex flex-col gap-0 p-0 bg-zinc-950 border-border overflow-hidden">
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-foreground text-base">
                        <Settings className="w-4 h-4 text-primary" />
                        Settings
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 min-h-0">
                    {/* Left nav */}
                    <nav className="w-48 shrink-0 border-r border-border py-3 flex flex-col gap-0.5 px-2">
                        {TABS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={cn(
                                    'flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-md text-sm transition-all',
                                    activeTab === id
                                        ? 'bg-accent text-foreground font-medium'
                                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                                )}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {label}
                                {activeTab === id && (
                                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary" />
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Content — all tabs rendered, hidden via display to avoid unmounting */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <div className={activeTab === 'general' ? '' : 'hidden'}><GeneralTab /></div>
                        <div className={activeTab === 'integrations' ? '' : 'hidden'}><IntegrationsTab {...slackProps} /></div>
                        <div className={activeTab === 'notifications' ? '' : 'hidden'}><NotificationsTab /></div>
                        <div className={activeTab === 'security' ? '' : 'hidden'}><SecurityTab /></div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// General
// ─────────────────────────────────────────────────────────────────────────────
function GeneralTab() {
    return (
        <div className="space-y-6">
            <SectionHeader title="Appearance" description="Customize how the application looks." />
            <InfoCard label="Theme" value="Dark" />
            <InfoCard label="Language" value="English" />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Integrations
// ─────────────────────────────────────────────────────────────────────────────
function IntegrationsTab({
    composioConfigured, slackConnected, slackLoading, slackPending, slackError,
    slackDisconnecting, onConnect, onRecheck, onDisconnect,
}) {
    return (
        <div className="space-y-6">
            <SectionHeader
                title="Integrations"
                description="Connect external services to share reports and dashboards."
            />

            {/* Composio not configured warning */}
            {composioConfigured === false && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300/80">
                        Composio is not configured on this server.{' '}
                        <span className="text-amber-300 font-medium">
                            Set the <code className="text-[11px] bg-amber-400/10 px-1 rounded">COMPOSIO_API_KEY</code> environment variable
                        </span>{' '}
                        to enable Slack and other integrations.
                    </p>
                </div>
            )}

            {/* Slack card */}
            <div className="rounded-lg border border-border bg-zinc-900/60 p-4 flex items-start gap-4">
                {/* Slack logo */}
                <div className="w-10 h-10 rounded-lg bg-[#4A154B]/20 border border-[#4A154B]/30 flex items-center justify-center shrink-0">
                    <Slack className="w-5 h-5 text-[#E01E5A]" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">Slack</p>
                        {composioConfigured === null && (
                            <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                        )}
                        {slackConnected && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full">
                                <Check className="w-2.5 h-2.5" />
                                Connected
                            </span>
                        )}
                        {slackPending && !slackConnected && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                                <Clock className="w-2.5 h-2.5" />
                                Pending
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Share reports and dashboard snapshots directly to Slack channels.
                    </p>

                    {slackPending && !slackConnected && (
                        <p className="text-xs text-amber-300/80 flex items-center gap-1 pt-0.5">
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            Complete the OAuth flow in the opened tab, then click Re-check.
                        </p>
                    )}

                    {slackError && (
                        <p className="text-xs text-red-400 flex items-center gap-1 pt-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {slackError}
                        </p>
                    )}
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                    {slackConnected ? (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onDisconnect}
                            disabled={slackDisconnecting}
                            className="gap-1.5 border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all disabled:opacity-40"
                        >
                            {slackDisconnecting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                            )}
                            {slackDisconnecting ? 'Disconnecting…' : 'Disconnect'}
                        </Button>
                    ) : slackPending ? (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onRecheck}
                            className="gap-1.5 text-foreground border-border hover:bg-accent transition-all"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Re-check
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onConnect}
                            disabled={slackLoading || composioConfigured === null || composioConfigured === false}
                            className="gap-1.5 border-[#4A154B]/40 hover:border-[#4A154B]/70 text-foreground hover:bg-[#4A154B]/10 transition-all disabled:opacity-40"
                        >
                            {slackLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Slack className="w-3.5 h-3.5 text-[#E01E5A]" />
                            )}
                            {slackLoading ? 'Connecting…' : 'Connect Slack'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications — Coming Soon
// ─────────────────────────────────────────────────────────────────────────────
function NotificationsTab() {
    return (
        <div className="space-y-6">
            <SectionHeader
                title="Notifications"
                description="Control how and when you receive alerts."
            />
            <ComingSoonCard />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Security — Coming Soon
// ─────────────────────────────────────────────────────────────────────────────
function SecurityTab() {
    return (
        <div className="space-y-6">
            <SectionHeader
                title="Security"
                description="Manage your account security preferences."
            />
            <ComingSoonCard />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ title, description }) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
    );
}

function InfoCard({ label, value }) {
    return (
        <div className="flex items-center justify-between rounded-md border border-border bg-zinc-900/40 px-4 py-3">
            <span className="text-sm text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">{value}</span>
        </div>
    );
}

function ComingSoonCard() {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-zinc-900/20 py-12 gap-3">
            <Clock className="w-8 h-8 text-muted-foreground/40" />
            <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Coming Soon</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">This feature is under development.</p>
            </div>
        </div>
    );
}
