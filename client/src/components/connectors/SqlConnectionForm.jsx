import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const DEFAULT_PORTS = { postgresql: '5432', mysql: '3306' };

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
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [saving, setSaving] = useState(false);

    const update = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setTestResult(null);
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
