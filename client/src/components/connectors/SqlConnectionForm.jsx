import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, CheckCircle2, XCircle, Link2 } from 'lucide-react';

const DEFAULT_PORTS = { postgresql: '5432', mysql: '3306' };

/**
 * Parse a database connection string URI into individual fields.
 * Supports: postgresql://user:pass@host:port/dbname?ssl=true
 *           mysql://user:pass@host:port/dbname
 */
function parseConnectionString(str) {
    try {
        // Normalise protocol so URL constructor can parse it
        let normalized = str.trim();
        // Handle postgres:// alias
        if (normalized.startsWith('postgres://')) {
            normalized = normalized.replace('postgres://', 'postgresql://');
        }
        // URL constructor doesn't know postgresql://, so swap to http temporarily
        const proto = normalized.startsWith('mysql://') ? 'mysql' : 'postgresql';
        const asHttp = normalized.replace(/^(postgresql|mysql):\/\//, 'http://');
        const url = new URL(asHttp);

        const result = {};
        if (url.hostname) result.host = decodeURIComponent(url.hostname);
        if (url.port) result.port = url.port;
        if (url.username) result.username = decodeURIComponent(url.username);
        if (url.password) result.password = decodeURIComponent(url.password);
        if (url.pathname && url.pathname.length > 1) {
            result.database = decodeURIComponent(url.pathname.slice(1));
        }
        // Check for ssl in query params
        const sslParam = url.searchParams.get('ssl') || url.searchParams.get('sslmode');
        if (sslParam && sslParam !== 'disable' && sslParam !== 'false') {
            result.ssl = true;
        }
        // Auto-enable SSL for known cloud database hosts
        const cloudHosts = ['supabase.co', 'neon.tech', 'aivencloud.com', 'rds.amazonaws.com', 'cloud.google.com'];
        if (result.host && cloudHosts.some((h) => result.host.endsWith(h))) {
            result.ssl = true;
        }
        return result;
    } catch {
        return null;
    }
}

export function SqlConnectionForm({ open, onClose, type, connector, onTestBeforeSave, onSave }) {
    const [form, setForm] = useState({
        name: connector?.name || '',
        host: '',
        port: DEFAULT_PORTS[type] || '5432',
        database: '',
        username: '',
        password: '',
        ssl: false,
    });
    const [connectionString, setConnectionString] = useState('');
    const [parseError, setParseError] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [saving, setSaving] = useState(false);

    const update = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setTestResult(null);
    };

    const handleConnectionString = (value) => {
        setConnectionString(value);
        setTestResult(null);
        setParseError(false);
        if (!value.trim()) return;

        const parsed = parseConnectionString(value);
        if (parsed) {
            setForm((prev) => ({
                ...prev,
                host: parsed.host || prev.host,
                port: parsed.port || DEFAULT_PORTS[type] || '5432',
                database: parsed.database || prev.database,
                username: parsed.username || prev.username,
                password: parsed.password || prev.password,
                ssl: parsed.ssl ?? prev.ssl,
            }));
        } else {
            setParseError(true);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        const { name, ...config } = form;
        const result = await onTestBeforeSave(type, config);
        setTestResult(result);
        setTesting(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const { name, ...config } = form;
        const result = connector
            ? await onSave({ id: connector._id, name, config })
            : await onSave({ type, name, config });
        setSaving(false);
        if (result) onClose();
    };

    const typeName = type === 'postgresql' ? 'PostgreSQL' : 'MySQL';

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{connector ? 'Edit' : 'Connect'} {typeName}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Connection Name</label>
                        <Input
                            placeholder={`My ${typeName} DB`}
                            value={form.name}
                            onChange={(e) => update('name', e.target.value)}
                        />
                    </div>

                    {/* Connection String */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                            <Link2 className="w-3 h-3" />
                            Connection String
                            <span className="text-muted-foreground/40 font-normal">(optional — auto-fills fields below)</span>
                        </label>
                        <Input
                            placeholder={`${type === 'mysql' ? 'mysql' : 'postgresql'}://user:password@host:port/database`}
                            value={connectionString}
                            onChange={(e) => handleConnectionString(e.target.value)}
                            className={parseError ? 'border-red-500/50 focus-visible:ring-red-500/30' : ''}
                        />
                        {parseError && (
                            <p className="text-[11px] text-red-400 mt-1">Could not parse connection string. Check the format and try again.</p>
                        )}
                    </div>

                    <div className="relative flex items-center gap-3 py-1">
                        <div className="flex-1 border-t border-border" />
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-medium">or fill manually</span>
                        <div className="flex-1 border-t border-border" />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                            <label className="text-xs text-muted-foreground mb-1 block">Host</label>
                            <Input
                                placeholder="localhost"
                                value={form.host}
                                onChange={(e) => update('host', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Port</label>
                            <Input
                                placeholder={DEFAULT_PORTS[type]}
                                value={form.port}
                                onChange={(e) => update('port', e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Database</label>
                        <Input
                            placeholder="mydb"
                            value={form.database}
                            onChange={(e) => update('database', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Username</label>
                            <Input
                                placeholder="postgres"
                                value={form.username}
                                onChange={(e) => update('username', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => update('password', e.target.value)}
                            />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.ssl}
                            onChange={(e) => update('ssl', e.target.checked)}
                            className="rounded border-border"
                        />
                        Enable SSL
                    </label>

                    {/* Test result */}
                    {testResult && (
                        <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${testResult.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            {testResult.success ? 'Connection successful!' : testResult.error}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleTest} disabled={testing || !form.host || !form.database}>
                        {testing && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                        Test Connection
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !testResult?.success || !form.name}
                    >
                        {saving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                        {connector ? 'Update' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
