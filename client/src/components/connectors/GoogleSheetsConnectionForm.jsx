import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react';

export function GoogleSheetsConnectionForm({ open, onClose, onConnect }) {
    const [name, setName] = useState('');
    const [connecting, setConnecting] = useState(false);

    const handleConnect = async () => {
        setConnecting(true);
        await onConnect(name);
        setConnecting(false);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Connect Google Sheets</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Connection Name</label>
                        <Input
                            placeholder="My Google Account"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        You'll sign in with Google to authorize read-only access to your spreadsheets.
                        After connecting, you can browse any spreadsheet by entering its URL.
                    </p>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleConnect}
                        disabled={connecting || !name}
                    >
                        {connecting && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                        Connect with Google
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
